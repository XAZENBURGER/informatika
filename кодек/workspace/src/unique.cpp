// Пункт 9: читает строки из stdin функцией getline и выводит их
// в stdout, убирая ИДУЩИЕ ПОДРЯД повторения (аналог uniq).
// Использование в командной строке (перенаправление потоков):
//     unique.exe < input.txt > output.txt
// Сборка:  g++ -std=c++17 -o unique.exe src/unique.cpp
#include <string>
#include <iostream>

int main() {
    std::string line;
    // getline возвращает объект потока, поэтому его можно
    // использовать в условии цикла чтения.
    if (std::getline(std::cin, line)) {
        std::cout << line << '\n';          // первая строка печатается всегда
        std::string prev = line;
        while (std::getline(std::cin, line))
            if (line != prev) {             // печать только если строка
                std::cout << line << '\n';  // отличается от предыдущей
                prev = line;
            }
    }
    return 0;
}
