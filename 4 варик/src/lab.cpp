// Пункт 2: простейшая программа, выводящая произвольный текст
// в стандартный поток вывода (cout).
// Сборка:  g++ -std=c++17 -o lab.exe src/lab.cpp
#include <iostream>

int main() {
    std::cout << "Hello from lab.exe! Line 1\n";
    std::cout << "This is lab.exe. Line 2\n";
    return 0;
}
