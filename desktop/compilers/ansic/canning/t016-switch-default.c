#include <stdio.h>

int main(int argc, char * argv[])
{
    switch(3)
    {
    case 0:
        printf("0a\n");
        printf("0b\n");
        printf("0c\n");
        break;

    case 1:
        printf("1a\n");
        printf("1b\n");
        printf("1c\n");

    case 2:
        printf("2a\n");
        printf("2b\n");
        printf("2c\n");
        break;

    default:
        printf("default-a\n");
        printf("default-b\n");
        break;
    }
    return 0;
}
