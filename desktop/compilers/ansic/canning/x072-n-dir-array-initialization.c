#include <stdio.h>

int main(void)
{
    int             a[2][2] = { { 1, 2 }, { 3, 4 } };

    printf("[0][0]=%d [0][1]=%d [1][0]=%d [1][1]=%d\n",
           a[0][0], a[0][1], a[1][0], a[1][1]);
    return 0;
}
