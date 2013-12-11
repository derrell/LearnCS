#include <stdio.h>

int func(int instance, int expected, int retval);

int main(int argc, char * argv[])
{
    printf("\nfalse OR false\n");
    if (func(1, 1, 0) || func(2, 1, 0))
    {
        printf("Reached body of if statement (bad)\n");
    }

    printf("\nfalse OR true\n");
    if (func(1, 1, 0) || func(2, 1, 1))
    {
        printf("Reached body of if statement (good)\n");
    }

    printf("\ntrue OR false\n");
    if (func(1, 1, 1) || func(2, 0, 0))
    {
        printf("Reached body of if statement (good)\n");
    }

    printf("\ntrue OR true\n");
    if (func(1, 1, 1) || func(2, 0, 1))
    {
        printf("Reached body of if statement (good)\n");
    }

    printf("\nfalse AND false\n");
    if (func(1, 1, 0) && func(2, 0, 0))
    {
        printf("Reached body of if statement (bad)\n");
    }

    printf("\nfalse AND true\n");
    if (func(1, 1, 0) && func(2, 0, 1))
    {
        printf("Reached body of if statement (bad)\n");
    }

    printf("\ntrue AND false\n");
    if (func(1, 1, 1) && func(2, 1, 0))
    {
        printf("Reached body of if statement (bad)\n");
    }

    printf("\ntrue AND true\n");
    if (func(1, 1, 1) && func(2, 1, 1))
    {
        printf("Reached body of if statement (good)\n");
    }

    printf("\n");

    return 0;
}

int func(int instance, int expected, int retval)
{
    printf("%s func(instance=%d, retval=%d)\n",
           expected ? "expected" : "UNEXPECTED", instance, retval);
    return retval;
}
