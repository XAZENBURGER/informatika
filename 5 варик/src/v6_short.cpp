// Лабораторная работа 5, вариант 6.
// f(x) = e^Y - 1000*Y, Y = [x] - x ([x] — целая часть).
// Точки: x = n/2 - 1, n = 0..32.
#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;

double f(double x)
{
    double const intpart = floor(x);           // [x] — один раз
    double const Y = intpart - x;
    return exp(Y) - 1000.0 * Y;
}

int main()
{
    cout << fixed << setprecision(8);
    for (int n = 0; n <= 32; ++n)
    {
        double const x = n / 2.0 - 1.0;
        cout << n << '\t' << x << '\t' << f(x) << '\n';
    }
    return 0;
}
