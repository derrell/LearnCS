#include <stdio.h>
#include <ctype.h>

int main(int argc, char * argv[])
{
    int             c;

    for (c = 0; c < 128; c++)
    {
        printf("c: 0x%02x %c", c, isprint(c) ? c : ' ');
        printf(" digit: %d", !! isdigit(c));
        printf(" space: %d", !! isspace(c));
        printf(" upper: %d", !! isupper(c));
        printf(" lower: %d", !! islower(c));
        printf(" alpha: %d", !! isalpha(c));
        printf(" print: %d", !! isprint(c));
        printf(" punct: %d", !! ispunct(c));
        printf("\n");
    }
    return 0;
}
