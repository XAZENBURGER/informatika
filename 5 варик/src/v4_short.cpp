// Лабораторная работа 5, вариант 4.
// f(x) = sin(Y)*cos(Y) / (1 + cos^2(Y)), Y = x^3.
// Точки: x = n/2 + 1, n = 0..10.
#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;

double f(double x)
{
    double const Y = x * x * x;                // x^3 — один раз
    double const c = cos(Y);                   // cos(Y) — один раз
    return sin(Y) * c / (1.0 + c * c);
}

int main()
{
    cout << fixed << setprecision(8);
    for (int n = 0; n <= 10; ++n)
    {
        double const x = n / 2.0 + 1.0;
        cout << n << '\t' << x << '\t' << f(x) << '\n';
    }
    return 0;
}
