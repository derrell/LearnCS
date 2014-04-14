#include <stdio.h>

int main(int argc, char * argv[])
{
    int             i = 2;

    // This should work. See also t052 and Node.js FIXME message, which
    // mentions t052. Excluding this test for now, until we make this
    // work properly.
    *&i = 23;

    printf("%d\n", i);
    return 0;
}
