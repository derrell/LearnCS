#include <stdio.h>

int main(int argc, char * argv[])
{
    int             x;

    printf("hello world\n");

    // declaration following an executable statement
    char            c;          /* expect a parse error here */

    printf("I'm still here!\n");
    return 0;
}
