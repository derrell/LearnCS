#include <stdio.h>

int foo(void)
{
    return 23;
}

int main(int argc, char * argv[])
{
    unsigned long   f;

    f = foo;
    return 0;
}
