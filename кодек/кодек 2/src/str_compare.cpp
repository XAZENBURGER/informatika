// Пункт 8: сравнение чтения строк оператором >> и функцией getline.
//
// Пример 3.1 (cin >> name):  оператор >> считывает до ПЕРВОГО ПРОБЕЛА.
//   Ввод "Ivan Petrov Sidorov" -> name == "Ivan", остальное остаётся в потоке.
//
// Пример 3.2 (getline(cin, name)): getline считывает ВЕСЬ ввод ДО КОНЦА СТРОКИ
//   (пробелы включаются). Ввод "Ivan Petrov Sidorov" -> name == "Ivan Petrov Sidorov".
//
// Режим выбирается аргументом командной строки:  prog.exe gt   — getline-вариант.
// Сборка:  g++ -std=c++17 -o str_compare.exe src/str_compare.cpp
#include <string>
#include <iostream>
using namespace std;

int main(int argc, char* argv[]) {
    string name;                      // вначале пустая строка
    cout << "What is your name? ";
    const bool useGetline = (argc > 1 && string(argv[1]) == "gt");
    if (useGetline)
        getline(cin, name);           // вся строка целиком (с пробелами)
    else
        cin >> name;                  // только первое слово
    cout << "Greetings, " << name << "\n";
    return 0;
}
