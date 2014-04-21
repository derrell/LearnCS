#include <stdio.h>

int main(int argc, char * argv[])
{
    char            c = 0;
    
    if (c == '/0')
    {
        printf("got /0\n");
    }
    else
    {
        printf("did not get /0\n");
    }
    return 0;
}
