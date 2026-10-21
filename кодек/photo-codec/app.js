/* app.js — UI-логика сайта Photo Codec */

'use strict';

const $ = id => document.getElementById(id);

const state = {
  file: null,          // исходный File
  bitmap: null,        // ImageBitmap оригинала
  origData: null,      // ImageData оригинала (для метрик)
  packed: null,        // Uint8Array контейнера .pck после encode
  reconBitmap: null,   // восстановленный ImageBitmap
  reconData: null,     // ImageData восстановленного
  timings: {},         // замеры времени
};

/* ---------- Утилиты ---------- */

const fmtBytes = n => {
  if (n === undefined || n === null) return '—';
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} КБ`;
  return `${(n / 1024 / 1024).toFixed(2)} МБ`;
};

const logPipeline = steps => {
  const ol = $('pipeline-log');
  ol.innerHTML = '';
  for (const s of steps) {
    const li = document.createElement('li');
    li.textContent = s;
    ol.appendChild(li);
  }
};

/* ---------- Загрузка файла ---------- */

async function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    alert('Пожалуйста, выберите файл изображения');
    return;
  }
  state.file = file;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    state.bitmap = await createImageBitmap(file);

    // Сохраняем пиксели оригинала для метрик
    const canvas = document.createElement('canvas');
    canvas.width = state.bitmap.width;
    canvas.height = state.bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(state.bitmap, 0, 0);
    state.origData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    $('orig-img').src = url;
    $('orig-stats').innerHTML = `
      <li>Размер файла: <b>${fmtBytes(file.size)}</b></li>
      <li>Разрешение: <b>${state.bitmap.width}×${state.bitmap.height}</b></li>
      <li>Тип: <b>${file.type}</b></li>`;

    $('controls').hidden = false;
    $('results').hidden = false;
    state.packed = null;
    $('decode-btn').disabled = true;
    $('download-bin').disabled = true;
    logPipeline(['Файл загружен и декодирован в растр. Нажмите «Сжать», чтобы запустить encode.']);
  } catch (e) {
    alert('Не удалось прочитать изображение: ' + e.message);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

/* ---------- ENCODE ---------- */

async function doEncode() {
  if (!state.bitmap) return;
  const quality = parseInt($('quality').value, 10) / 100;
  const useLz = $('use-lz').checked;
  const steps = [];
  const t0 = performance.now();

  try {
    // Шаг 1: raster -> JPEG (потери)
    const tJ0 = performance.now();
    const { jpegBytes, canvas } = await Codec.rasterToJpeg(state.bitmap, quality);
    const tJ1 = performance.now();
    steps.push(`JPEG-кодирование (quality=${(quality*100)|0}%): ${fmtBytes(jpegBytes.length)}, ${(tJ1-tJ0).toFixed(1)} мс`);

    // Шаг 2: опциональный LZ + контейнер
    const tC0 = performance.now();
    state.packed = await Codec.encodeContainer(jpegBytes, useLz);
    const tC1 = performance.now();
    steps.push(`${useLz && Codec.supportsCompressionStreams() ? 'gzip (LZ) + ' : ''}сборка контейнера .pck: ${fmtBytes(state.packed.length)}, ${(tC1-tC0).toFixed(1)} мс`);

    const ratio = state.packed.length / state.file.size;
    steps.push(`Итог: ${fmtBytes(state.file.size)} → ${fmtBytes(state.packed.length)} (${(ratio*100).toFixed(1)}% от исходника)`);

    state.timings.encode = performance.now() - t0;
    steps.push(`Общее время encode: ${state.timings.encode.toFixed(1)} мс`);

    $('decode-btn').disabled = false;
    $('download-bin').disabled = false;
    logPipeline(steps);
  } catch (e) {
    alert('Ошибка при кодировании: ' + e.message);
    console.error(e);
  }
}

/* ---------- DECODE ---------- */

async function doDecode() {
  if (!state.packed) return;
  const steps = [];
  const t0 = performance.now();

  try {
    const { bitmap, jpegBytes, container } = await Codec.decodeContainer(state.packed);
    state.reconBitmap = bitmap;

    // Показываем восстановленное
    const url = URL.createObjectURL(new Blob([jpegBytes], { type: 'image/jpeg' }));
    $('dec-img').src = url;

    // Пиксели восстановленного для метрик
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0);
    state.reconData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const tDec = performance.now();
    steps.push(`Разбор контейнера: magic=PCK1 v${container.version}, LZ=${container.lz}, payload=${fmtBytes(container.payloadSize)} → raw=${fmtBytes(container.rawSize)}`);
    steps.push(`JPEG-декодирование обратно в растр: ${bitmap.width}×${bitmap.height}, ${(tDec - t0).toFixed(1)} мс`);

    // Метрики
    const m = Codec.computeMetrics(state.origData, state.reconData);
    const ssim = Codec.computeSsimGray(state.origData, state.reconData);
    steps.push(`Метрики посчитаны: PSNR=${m.psnr.toFixed(2)} дБ, SSIM≈${ssim.toFixed(4)}`);
    state.timings.decode = tDec - t0;
    steps.push(`Общее время decode: ${state.timings.decode.toFixed(1)} мс`);
    logPipeline(steps);

    $('dec-stats').innerHTML = `
      <li>Байт в контейнере: <b>${fmtBytes(state.packed.length)}</b></li>
      <li>Разрешение: <b>${bitmap.width}×${bitmap.height}</b></li>
      <li>LZ внутри: <b>${container.lz ? 'да (gzip)' : 'нет'}</b></li>`;

    renderMetrics(m, ssim);
  } catch (e) {
    alert('Ошибка при декодировании: ' + e.message);
    console.error(e);
  }
}

/* ---------- Метрики в таблицу ---------- */

function psnrVerdict(psnr) {
  if (!isFinite(psnr)) return 'Потерь нет (идентично) 🎉';
  if (psnr >= 45) return 'Практически неотличимо от оригинала';
  if (psnr >= 40) return 'Очень высокое качество, минимальные потери';
  if (psnr >= 35) return 'Хорошее качество, заметны лёгкие артефакты';
  if (psnr >= 30) return 'Среднее, видны блоки JPEG';
  return 'Сильные потери, артефакты хорошо видны';
}

function renderMetrics(m, ssim) {
  const tbody = $('metrics-table').querySelector('tbody');
  const rows = [
    ['PSNR (пик-сигнал-шум)', isFinite(m.psnr) ? `${m.psnr.toFixed(2)} дБ` : '∞', psnrVerdict(m.psnr)],
    ['SSIM (структурное сходство, серый)', ssim.toFixed(5), '1.0 = идеально; >0.95 обычно визуально без потерь'],
    ['MSE (среднеквадратичная ошибка)', m.mse.toFixed(3), '0 = идентично пиксель-в-пиксель'],
    ['Макс. отклонение канала', `±${m.peakMaxAbsDiff}`, 'худший пиксель по R/G/B'],
    ['Сжатие к исходнику', `${(state.packed.length / state.file.size * 100).toFixed(1)}%`, `${fmtBytes(state.file.size)} → ${fmtBytes(state.packed.length)}`],
    ['Время encode / decode', `${state.timings.encode?.toFixed(0)} / ${state.timings.decode?.toFixed(0)} мс`, 'в браузере, без сервера'],
  ];
  tbody.innerHTML = rows.map(r =>
    `<tr><td>${r[0]}</td><td><b>${r[1]}</b></td><td>${r[2]}</td></tr>`).join('');

  $('psnr-hint').textContent =
    '💡 Совет: подвигайте слайдер качества и нажмите «Сжать» снова — следите за PSNR. ' +
    'Для «минимальных потерь» ориентир: PSNR ≥ 40 дБ и SSIM ≥ 0.97.';
}

/* ---------- Скачать .pck ---------- */

function downloadPacked() {
  if (!state.packed) return;
  const blob = new Blob([state.packed], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (state.file?.name || 'photo') + '.pck';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

/* ---------- Привязка событий ---------- */

window.addEventListener('DOMContentLoaded', () => {
  const drop = $('drop-zone');
  const input = $('file-input');

  input.addEventListener('change', () => loadFile(input.files[0]));

  ['dragenter', 'dragover'].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach(ev =>
    drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

  $('quality').addEventListener('input', e => $('quality-value').textContent = e.target.value);
  $('encode-btn').addEventListener('click', doEncode);
  $('decode-btn').addEventListener('click', doDecode);
  $('download-bin').addEventListener('click', downloadPacked);

  if (!Codec.supportsCompressionStreams()) {
    $('use-lz').disabled = true;
    $('use-lz').parentElement.title = 'Этот браузер не поддерживает CompressionStream — LZ-слой будет пропущен';
  }
});
