#include <stdio.h>

int foo(void)
{
    return 23;
}

int bar(void)
{
    return 42;
}

int main(int argc, char * argv[])
{
    unsigned long   f;

    foo = bar();
    return 0;
}
