// Пункт 13: аналог команды more — постраничный вывод текста.
// Читает строки из stdin (или из файла, заданного аргументом) и выводит
// их по экрану; после каждого «экрана» жмёт паузу и ждёт нажатия Enter
// для продолжения ('q' — выход). Размер экрана задаётся переменной
// окружения LINES (по умолчанию 24 строки).
//
// Сборка:  g++ -std=c++17 -o mymore.exe src/mymore.cpp
// Примеры:  mymore.exe file.txt
//           sort input.txt | mymore.exe
#include <string>
#include <iostream>
#include <cstdlib>   // getenv
#include <cstdio>    // fflush
#ifdef _WIN32
#include <conio.h>   // _getch
static void waitKey() {
    int c = _getch();          // ждём нажатие клавиши без Enter
    if (c == 'q' || c == 'Q') { std::exit(0); }
}
#else
#include <unistd.h>
static void waitKey() {
    std::cerr << "----- Press ENTER to continue (q + ENTER to quit) -----\n";
    std::cerr.flush();
    std::string dummy;
    if (!std::getline(std::cin, dummy)) std::exit(0);
    if (dummy == "q" || dummy == "Q") std::exit(0);
}
#endif

int main(int argc, char* argv[]) {
    // Если задано имя файла — открываем его вместо stdin.
    if (argc > 1) {
        freopen(argv[1], "r", stdin);
    }
    int screenLines = 24;
    if (const char* env = std::getenv("LINES"))
        if (int v = std::atoi(env); v > 0) screenLines = v;

    std::string line;
    int count = 0;
    while (std::getline(std::cin, line)) {
        std::cout << line << '\n';
        if (++count >= screenLines - 1) {  // оставляем место под строку паузы
            count = 0;
            std::cout.flush();
            waitKey();
        }
    }
    return 0;
}
