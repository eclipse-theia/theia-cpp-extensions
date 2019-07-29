#include <iostream>

using namespace std;

void printInt(int a)
{
    cout << "value: " << a << endl;
}

int main()
{
    int i, j;
    for (i = 10; i < 20; i++) {
        j += 5;
        printInt(j);
    }
    return 0;
}
