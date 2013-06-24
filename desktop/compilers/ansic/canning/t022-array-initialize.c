#include <stdio.h>
int main(int argc, char * argv[])
{
    int a = 23;
    int b = { 23 };
    int c[2] = { 1, 2 };
    int d[] = { 3, 4 };
    char * arr55[5] = { "no", "first", "second", "third", "fourth" };
    char * arr33[] = { "hi", "there", "world" };
    char * arr53[5] = { NULL, "one", "two" };
    char chars[] = "abcde";

    printf("a=%d b=%d c[0]=%d c[1]=%d d[0]=%d d[1]=%d\n",
           a, b, c[0], c[1], d[0], d[1]);
    for (a = 0; a < 5; a++)
    {
        printf("arr55[%d]=%s\n", a, arr55[a]);
    }
    for (a = 0; a < 3; a++)
    {
        printf("arr33[%d]=%s\n", a, arr33[a]);
    }
    for (a = 0; a < 5; a++)
    {
        printf("arr53[%d]=%s\n", a, arr53[a]);
    }
    for (a = 0; a < 5; a++)
    {
        printf("chars[%d]=%c\n", a, chars[a]);
    }
    return 0;
}
