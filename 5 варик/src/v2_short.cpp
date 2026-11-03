// Лабораторная работа 5, вариант 2.
// f(x) = Y * arctg(ln|Y|) / (1 + Y^2), Y = x^2 - 1.
// Точки: x = n/4 - 2, n = 0..16.
#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;

double f(double x)
{
    double const Y = x * x - 1.0;              // повторяющееся подвыражение — один раз
    return Y * atan(log(fabs(Y))) / (1.0 + Y * Y);
}

int main()
{
    cout << fixed << setprecision(8);
    for (int n = 0; n <= 16; ++n)
    {
        double const x = n / 4.0 - 2.0;
        cout << n << '\t' << x << '\t' << f(x) << '\n';
    }
    return 0;
}
