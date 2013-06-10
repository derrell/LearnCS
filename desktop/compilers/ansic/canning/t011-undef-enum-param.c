#include <stdio.h>

enum E
{
    E1 = 23,
    E2
};

void foo(enum F f)
{
    printf("f=%d\n", f);
}

int main(int argc, char * argv[])
{
    foo(E1);
    return 0;
}
