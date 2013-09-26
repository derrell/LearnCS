#include <stdio.h>

int main(int argc, char * argv[])
{
    int             i;

    for (i = 0; i <= 5; i++)
    {
        switch(i)
        {
        case 1 :
            printf("case 1\n");
            printf("case 1 (second try)\n");
            break;

        case 2 :
        case 3 :
            printf("case 2 and 3\n");
            printf("case 2 and 3 (second try)\n");
            break;

        case 4 :
        default :
            printf("case 4 and default\n");
            printf("case 4 and default (second try)\n");
            break;

        case 5 :
            printf("case 5\n");
            printf("case 5 (second try)\n");
            break;
        }
    }

    return 0;
}
