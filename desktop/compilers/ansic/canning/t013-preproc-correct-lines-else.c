#include <stdio.h>

#include <ctype.h>

#define X 1
#define Y

int main(int argc, char * argv[])
{
#if X
    
    printf("true\n");

#else

    printf("false\n");

#endif
}
