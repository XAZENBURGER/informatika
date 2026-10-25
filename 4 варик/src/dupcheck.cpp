// Пункт 12: программа, читающая строки из stdin и возвращающая код ошибки 1,
// если обнаружены ДВЕ ПОДРЯД ИДУЩИЕ ОДИНАКОВЫЕ строки; иначе — код 0 (успех).
//
// Сборка:   g++ -std=c++17 -o dupcheck.exe src/dupcheck.cpp
//
// Вызов в командной строке (Windows cmd), пункт 12:
//   sort input.txt | dupcheck.exe && echo No duplicates || echo Has duplicates
//
// Логика: sort расставляет одинаковые строки рядом, dupcheck смотрит только
// соседние строки. Код возврата 1 (дубликаты найдены) -> срабатывает ветка
// после ||; код 0 -> ветка после &&.
#include <string>
#include <iostream>
#ifndef _WIN32
#include <csignal>   // signal, SIGPIPE, SIG_IGN — см. комментарий ниже
#endif

int main() {
#ifndef _WIN32
    // ВАЖНО (тонкость Unix-пайпа): в конструкции
    //     sort file | dupcheck && echo ... || echo ...
    // dupcheck может завершиться ДО того, как sort допишет вывод, —
    // тогда sort получит SIGPIPE и сам «умрёт» с кодом 141. Чтобы код
    // возврата пайпа определялся именно нашей программой, игнорируем
    // SIGPIPE: write вернёт ошибку, а iostream выбросит исключение,
    // которое мы перехватим и вернём корректный код.
    std::signal(SIGPIPE, SIG_IGN);
#endif
    std::string line, prev;
    try {
        if (std::getline(std::cin, prev)) {
            while (std::getline(std::cin, line))
                if (line == prev)               // идущие подряд повторы строк
                    return 1;                   // неуспех: дубликат найден
        }
    } catch (const std::ios_base::failure&) {
        // поток sort закрылся из-за нашего раннего выхода — не страшно,
        // решение уже принято (дубликат найден), возвращаем 1.
        return 1;
    }
    return 0;                                   // успех: повторов нет
}
