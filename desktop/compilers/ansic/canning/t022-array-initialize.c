#include <stdio.h>
int main(int argc, char * argv[])
{
    int a = 23;
    int c[2] = { 1, 2 };
    int d[] = { 3, 4 };
    char * arr55[5] = { "no", "first", "second", "third", "fourth" };
    char * arr_3[] = { "hi", "there", "world" };
    char * arr53[5] = { "yo!", "one", "two" };
    char chars[] = "abcde";

    printf("a=%d c[0]=%d c[1]=%d d[0]=%d d[1]=%d\n",
           a, c[0], c[1], d[0], d[1]);
    for (a = 0; a < 5; a++)
    {
        printf("arr55[%d]=%s\n", a, arr55[a]);
    }

    for (a = 0; a < 3; a++)
    {
        printf("arr_3[%d]=%s\n", a, arr_3[a]);
    }

    for (a = 0; a < 3; a++)
    {
        printf("arr53[%d]=%s\n", a, arr53[a]);
    }
    for (a = 0; a < 6; a++)
    {
        printf("chars[%d]=%02x=%c\n", a, chars[a], chars[a]);
    }
    return 0;
}
