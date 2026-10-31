# Задания 11–12: dupcheck + связки && / || (с учётом твоих проблем с PowerShell)

## Что в этой папке
- `dupcheck.cpp` — код программы из задания 12
- `dups.txt` — тестовый файл **С** дубликатами (banana дважды)
- `nodups.txt` — тестовый файл **БЕЗ** дубликатов

---

## Шаг 1. Создай проект в Visual Studio
1. Файл → Создать → Проект → «Консольное приложение» (C++), имя например `dupcheck`.
2. Удали всё из `dupcheck.cpp` и вставь код из файла `dupcheck.cpp` выше.
3. Собери: **Ctrl+Shift+B**. В окне «Вывод» появится путь, например:
   `D:\Users\mkozi\source\repos\dupcheck\x64\Debug\dupcheck.exe`

## Шаг 2. Открой терминал В НУЖНОЙ ПАПКЕ (главный секрет!)
Это решает твою проблему «ищет только по полному пути»:

1. В проводнике открой папку, где лежит `dupcheck.exe`
   (в VS: правая кнопка на проект → «Открыть» → «Открыть папку в проводнике»).
2. Скопируй туда же файлы `dups.txt` и `nodups.txt`.
3. Кликни в **адресную строку проводника**, сотри путь, напиши `powershell` и нажми Enter.

После этого ты окажешься в PowerShell **прямо в папке с exe**, и ничего искать по
полному пути не придётся. Проверить, что всё на месте:
```powershell
dir
```
Ты должен увидеть `dupcheck.exe`, `dups.txt`, `nodups.txt` в списке.

## Шаг 3. Команды (задание 12)

⚠️ Две вещи, которые ты уже выяснил на своей шкуре:
- exe из текущей папки в PowerShell запускается только как `.\dupcheck.exe` (с точкой!)
- `<` в PowerShell не работает, вместо него `Get-Content ... |`

ВАЖНОЕ ЗАМЕЧАНИЕ: программа ищет повторы только среди **идущих подряд** строк
(так по заданию). В файле `dups.txt` строки не отсортированы, поэтому без
сортировки дубль не находится — это нормально и даже полезно для демонстрации.

### Запуск программы напрямую:
```powershell
Get-Content dups.txt | .\dupcheck.exe
```
Без сортировки: вывод пустой (повторы banana не идут подряд) → код 0.

```powershell
Get-Content dups.txt | Sort-Object | .\dupcheck.exe
```
С сортировкой: `Duplicate found: "banana"` → программа нашла повтор.

### Посмотреть код возврата (то, ради чего всё затеяно):
```powershell
Get-Content dups.txt | Sort-Object | .\dupcheck.exe; $LASTEXITCODE
```
Покажет `1` — неуспех (дубли есть).

```powershell
Get-Content nodups.txt | Sort-Object | .\dupcheck.exe; $LASTEXITCODE
```
Покажет `0` — успех (дублей нет).

### Задание 11 — связка с echo (сообщение пользователю):
В твоей старой PowerShell (5.1) операторы `&&` и `||` **не поддерживаются**,
поэтому делаем через if — смысл тот же:
```powershell
Get-Content dups.txt | Sort-Object | .\dupcheck.exe
if ($LASTEXITCODE -eq 0) { echo "Duplikatov net" } else { echo "Est' duplikaty!" }
```
Для `dups.txt` выведет `Est' duplikaty!`, для `nodups.txt` — `Duplikatov net`.

Если у тебя PowerShell 7+ (проверь командой `$PSVersionTable`), то можно прямо
как в методичке:
```powershell
Get-Content dups.txt | Sort-Object | .\dupcheck.exe && echo "Fail" || echo "Success"
```
(внимание: тут инверсия — при коде 1 выполняется левая часть после &&)

### Комбинация sort + dupcheck (как в методичке, п.12):
```powershell
Get-Content dups.txt | Sort-Object | .\dupcheck.exe
```
После сортировки две `banana` встают рядом, и программа их гарантированно найдёт.

## Лайфхак: используй cmd вместо PowerShell
Методичка написана под cmd, там всё проще: `<` работает, точка перед именем не нужна.
Открой папку с exe в проводнике → в адресной строке напиши `cmd` → Enter. И дальше
команды ровно как в методичке:
```cmd
sort dups.txt | dupcheck.exe && echo Est-duplikaty || echo Duplikatov-net
dupcheck.exe < nodups.txt && echo Success || echo Fail
```
(если в методе требуется именно PowerShell — бери варианты из прошлого раздела)

## Ожидаемые результаты (шпаргалка для отчета)
| Команда | Код возврата | echo-сообщение |
|---|---|---|
| `Get-Content dups.txt \| Sort-Object \| .\dupcheck.exe` | 1 | Est' duplikaty! |
| `Get-Content nodups.txt \| Sort-Object \| .\dupcheck.exe` | 0 | Duplikatov net |

Я реально скомпилировал и прогнал этот код — результаты именно такие:
на отсортированном dups.txt программа печатает `Duplicate found: "banana"`
и возвращает 1, на nodups.txt молчит и возвращает 0.
