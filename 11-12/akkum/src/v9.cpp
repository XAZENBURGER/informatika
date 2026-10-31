// Вариант 9. Сумма синусов чисел, не превосходящих по модулю pi.
// Предикат: |x| <= pi. Действие: sum += sin(x). Если таких чисел нет — 0.
#include <iostream>
#include <cmath>            // fabs, sin; M_PI — константа пи (из cmath в MSVC)
using namespace std;

int main() {
    double sum = 0;         // аккумулятор суммы синусов

    for (double x; cin >> x; )
        if (fabs(x) <= M_PI)    // предикат: |x| <= pi
            sum += sin(x);      // аккумуляция: прибавляем sin(x)

    cout << sum << endl;    // вывод результата (0, если подходящих чисел не было)
    return 0;
}
