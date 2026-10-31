@echo off
rem ============================================
rem  Avtomaticheskie progon vseh zadanii 9-13
rem  Kuda klasti: v papku s unique.exe, dupcheck.exe, sort.exe (est v Windows)
rem  Zapusk: dvazhdy kliknut po etomu failu
rem ============================================

rem Perekuchaem konsol na russkuyu kodirovku, chtoby vyvod byl chitaemy
chcp 866 >nul

echo.
echo === SHAG 9: unique bez predvaritel'noy sortirovki ===
echo (udalyayutsya TOL'KO podryad idushchie povtory)
unique.exe < input.txt
echo.

echo === SHAG 9: unique s perenapravleniem v fayl ===
unique.exe < input.txt > output1.txt
type output1.txt
echo.

echo === SHAG 10: polnoe udalenie vseh dublikatov (sort ^| unique) ===
sort input.txt | unique.exe
echo.

echo === SHAG 10 variant cherez fail ===
sort input.txt | unique.exe > output2.txt
type output2.txt
echo.

echo === SHAG 12: proverka nalichiya dublikatov ===
echo Fayl s dublikatami (input.txt):
sort input.txt | dupcheck.exe && echo Success || echo Fail
echo.
echo Fayl bez dublikatov (output2.txt):
sort output2.txt | dupcheck.exe && echo Success || echo Fail
echo.

pause
