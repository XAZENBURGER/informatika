// Вариант 6. Корень квадратный из суммы квадратов чисел,
// не превосходящих по модулю единицу.
// Предикат: |x| <= 1. Действие: sum += x*x. Итог: sqrt(sum). Пусто -> 0.
#include <iostream>
#include <cmath>            // fabs, sqrt
using namespace std;

int main() {
    double sum = 0;         // аккумулятор суммы квадратов

    for (double x; cin >> x; )
        if (fabs(x) <= 1)       // предикат: |x| <= 1
            sum += x * x;       // аккумуляция: прибавляем квадрат числа

    cout << sqrt(sum) << endl;  // результат: корень из накопленной суммы
                                // если чисел не было, sum = 0, sqrt(0) = 0
    return 0;
}
