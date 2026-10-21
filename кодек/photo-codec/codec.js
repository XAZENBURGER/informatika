/* ============================================================
   codec.js — прототип кодека сжатия фото (работает в браузере)
   ============================================================

   Пайплайн ENCODE:
     1. Декодируем входной файл в пиксели (ImageBitmap).
     2. Кодируем пиксели в JPEG через canvas.toBlob('image/jpeg', quality).
        Это этап С ПОТЕРЯМИ: квантование DCT-коэффициентов отбрасывает
        малозначимые для глаза детали (quality 0.9–0.95 ≈ "минимальные потери").
     3. Поверх JPEG применяем LOSSLESS LZ-сжатие (CompressionStream gzip),
        если включено. Получаем контейнер .pck.

   Пайплайн DECODE (строгое обращение):
     1. Читаем заголовок контейнера PCK1, проверяем magic/версию.
     2. Если флаг LZ стоит — сначала decompress (gzip → байты JPEG).
     3. Байты JPEG декодируем обратно в ImageBitmap.

   Формат контейнера .pck (все поля little-endian):
     [0..3]   magic   "PCK1"         (4 байта)
     [4]      version  (1 байт)      = 1
     [5]      flags   (1 байт)       bit0: payload сжат gzip
     [6..7]   reserved (2 байта)
     [8..15]  original size (uint64 через 2×uint32, здесь используем low 32 бит)
     [16..19] payload length (uint32)
     [20..]   payload (байты JPEG, возможно gzip)
   ============================================================ */

'use strict';

const PCK_MAGIC  = [0x50, 0x43, 0x4b, 0x31]; // "PCK1"
const PCK_VERSION = 1;
const PCK_HEADER_LEN = 20;
const FLAG_LZ = 0x01;

/* ---------- Вспомогательные: supported formats ---------- */

function supportsCompressionStreams() {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

/* ---------- LZ-обёртка (lossless слой) ---------- */

async function lzCompress(bytes) {
  if (!supportsCompressionStreams()) return bytes; // деградация без LZ
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const buf = await new Response(cs.readable).arrayBuffer();
  return new Uint8Array(buf);
}

async function lzDecompress(bytes) {
  const ds = new DecompressionStream('gzip');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();
  const buf = await new Response(ds.readable).arrayBuffer();
  return new Uint8Array(buf);
}

/* ---------- ШАГ 1: raster -> JPEG (этап с потерями) ---------- */

async function rasterToJpeg(imageBitmap, quality) {
  const canvas = document.createElement('canvas');
  canvas.width  = imageBitmap.width;
  canvas.height = imageBitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imageBitmap, 0, 0);
  const blob = await new Promise(res =>
    canvas.toBlob(res, 'image/jpeg', quality));
  if (!blob) throw new Error('Не удалось закодировать JPEG (canvas.toBlob вернул null)');
  return {
    jpegBytes: new Uint8Array(await blob.arrayBuffer()),
    blob,
    canvas,
    ctx,
  };
}

/* ---------- ШАГ 2: сборка контейнера .pck ---------- */

async function encodeContainer(jpegBytes, useLz) {
  let payload = jpegBytes;
  let flags = 0;
  if (useLz && supportsCompressionStreams()) {
    payload = await lzCompress(jpegBytes);
    flags |= FLAG_LZ;
  }
  const header = new ArrayBuffer(PCK_HEADER_LEN);
  const dv = new DataView(header);
  for (let i = 0; i < 4; i++) dv.setUint8(i, PCK_MAGIC[i]);
  dv.setUint8(4, PCK_VERSION);
  dv.setUint8(5, flags);
  dv.setUint16(6, 0, true);            // reserved
  dv.setUint32(8,  jpegBytes.length, true);  // размер до LZ
  dv.setUint32(12, payload.length, true);    // размер payload
  dv.setUint32(16, 0, true);           // padding / future use
  const out = new Uint8Array(PCK_HEADER_LEN + payload.length);
  out.set(new Uint8Array(header), 0);
  out.set(payload, PCK_HEADER_LEN);
  return out;
}

/* ---------- ШАГ 3: разбор контейнера и декод ---------- */

function parseContainer(bytes) {
  if (bytes.length < PCK_HEADER_LEN) throw new Error('Файл слишком мал — не контейнер PCK');
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < 4; i++) {
    if (dv.getUint8(i) !== PCK_MAGIC[i]) throw new Error('Неверная магическая сигнатура (ожидался .pck PCK1)');
  }
  const version = dv.getUint8(4);
  if (version !== PCK_VERSION) throw new Error(`Неподдерживаемая версия контейнера: ${version}`);
  const flags = dv.getUint8(5);
  return {
    version,
    flags,
    lz: (flags & FLAG_LZ) !== 0,
    rawSize: dv.getUint32(8, true),
    payloadSize: dv.getUint32(12, true),
    payload: bytes.subarray(PCK_HEADER_LEN, PCK_HEADER_LEN + dv.getUint32(12, true)),
  };
}

async function decodeContainer(bytes) {
  const c = parseContainer(bytes);
  let jpegBytes = c.payload;
  if (c.lz) {
    jpegBytes = await lzDecompress(c.payload);
    if (jpegBytes.length !== c.rawSize) {
      console.warn('Размер после LZ не совпал с заголовком:', jpegBytes.length, '!=', c.rawSize);
    }
  }
  // Проверяем, что внутри действительно JPEG (SOI-маркер FFD8)
  if (!(jpegBytes[0] === 0xFF && jpegBytes[1] === 0xD8)) {
    throw new Error('Payload не является JPEG (нет маркера SOI)');
  }
  const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
  const bitmap = await createImageBitmap(blob);
  return { bitmap, jpegBytes, container: c };
}

/* ---------- Метрики качества (lossless сравнение пикселей) ----------
   Считаем MSE между исходным растром и восстановленным из JPEG.
   PSNR = 10 * log10(MAX^2 / MSE), MAX=255.
   SSNR-подобная оценка по каналам R/G/B.
*/

function getImageData(canvasOrCtx, w, h) {
  const ctx = canvasOrCtx.getContext ? canvasOrCtx.getContext('2d') : canvasOrCtx;
  return ctx.getImageData(0, 0, w, h);
}

function computeMetrics(origData, reconData) {
  const a = origData.data, b = reconData.data;
  const n = Math.min(a.length, b.length);
  let seR = 0, seG = 0, seB = 0, peak = 0;
  const pixels = n / 4;
  for (let i = 0; i < n; i += 4) {
    const dr = a[i] - b[i], dg = a[i+1] - b[i+1], db = a[i+2] - b[i+2];
    seR += dr * dr; seG += dg * dg; seB += db * db;
    const m = Math.max(Math.abs(dr), Math.abs(dg), Math.abs(db));
    if (m > peak) peak = m;
  }
  const mseR = seR / pixels, mseG = seG / pixels, mseB = seB / pixels;
  const mse = (mseR + mseG + mseB) / 3;
  const psnr = mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
  return { mse, psnr, peakMaxAbsDiff: peak, mseChannels: [mseR, mseG, mseB], pixels };
}

/* Простой SSIM по серому (оконное сглаживание не делаем — глобальная
   упрощённая версия для учебного прототипа). */
function computeSsimGray(origData, reconData) {
  const toGray = d => {
    const g = new Float64Array(d.width * d.height);
    for (let i = 0, j = 0; i < d.data.length; i += 4, j++) {
      g[j] = 0.299 * d.data[i] + 0.587 * d.data[i+1] + 0.114 * d.data[i+2];
    }
    return g;
  };
  const x = toGray(origData), y = toGray(reconData);
  const N = x.length;
  const mean = v => v.reduce((s, q) => s + q, 0) / N;
  const varOf = (v, m) => v.reduce((s, q) => s + (q - m) ** 2, 0) / (N - 1);
  const cov = (a, b, ma, mb) => {
    let s = 0;
    for (let i = 0; i < N; i++) s += (a[i] - ma) * (b[i] - mb);
    return s / (N - 1);
  };
  const mx = mean(x), my = mean(y);
  const vx = varOf(x, mx), vy = varOf(y, my), vxy = cov(x, y, mx, my);
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2;
  return ((2 * mx * my + C1) * (2 * vxy + C2)) / ((mx * mx + my * my + C1) * (vx + vy + C2));
}

/* Экспорт в глобальную область для app.js */
window.Codec = {
  supportsCompressionStreams,
  rasterToJpeg,
  encodeContainer,
  decodeContainer,
  parseContainer,
  computeMetrics,
  computeSsimGray,
  FLAG_LZ,
  PCK_HEADER_LEN,
};
