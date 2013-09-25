#include <stdio.h>

int main(int argc, char * argv[])
{
    int             i;
    int             j;
    int             k;
    int             l;

    for (i = 1, j = 10, k = 20, l = 30; i < 3; i++, l = j, j++, k = j)
    {
        printf("i=%d j=%d k=%d l=%d\n", i, j, k, l);
    }

    return 0;
}
