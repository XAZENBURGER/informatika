// Пункт 7: анализ заданного кода.
//
//   if (char prev; cin.get(prev)) {
//       cout.put(prev);
//       for (char ch; cin.get(ch);)
//           if (ch != prev)
//               cout.put(prev = ch);
//   }
//
// Что делает этот код: читает поток посимвольно и выводит каждый символ,
// ОТЛИЧАЮЩИЙСЯ от предыдущего. То есть он убирает идущие подряд ПОВТОРЯЮЩИЕСЯ
// СИМВОЛЫ (не строки!). Например: "aaabbbcccaa" -> "abcba".
//
// Здесь prev — «скользящее окно»: в нём хранится последний напечатанный символ;
// новый символ печатается только если он не равен prev, после чего prev
// обновляется этим символом (выражение prev = ch возвращает значение присваивания).
//
// Сборка:  g++ -std=c++17 -o dedup_chars.exe src/dedup_chars.cpp
// Проверка:  ./dedup_chars.exe < input.txt > output.txt
#include <iostream>

int main() {
    if (char prev; std::cin.get(prev)) {
        std::cout.put(prev);
        for (char ch; std::cin.get(ch);)
            if (ch != prev)
                std::cout.put(prev = ch);
    }
    return 0;
}
