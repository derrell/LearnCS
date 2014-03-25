#include <stdio.h>

void foo(int x)
{
    printf("x=%d\n", x);
}

int main(int argc, char * argv[])
{
    char            buf[32];
    int             size = sizeof(buf);
    
    foo(size);
    foo(sizeof(buf));
    foo(sizeof(char *));
    return 0;
}
