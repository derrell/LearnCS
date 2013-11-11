#include <stdio.h>

int             a = 1;
int             b = a + 1;
int             c = b + 1;

int main(int argc, char * argv[])
{
    int             d = 10;
    int             e = d + 1;
    int             f = e + 1;

    printf("a=%d b=%d c=%d d=%d e=%d f=%d\n", a, b, c, d, e, f);
    return 0;
}
