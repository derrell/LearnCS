#include <stdio.h>
int main(int argc, char * argv[])
{
    int a = 23;
    int b = { 23 };
    int c[2] = { 1, 2 };
    int d[] = { 3, 4 };
    char * names5[5] = { "no", "first", "second", "third", "fourth" };
    char * names3[] = { "hi", "there", "world" };
    char chars[] = "abcde";

    printf("a=%d b=%d c[0]=%d c[1]=%d d[0]=%d d[1]=%d\n",
           a, b, c[0], c[1], d[0], d[1]);
    for (a = 0; a < 5; a++)
    {
        printf("names5[%d]=%s\n", a, names5[a]);
    }
    for (a = 0; a < 3; a++)
    {
        printf("names3[%d]=%s\n", a, names3[a]);
    }
    for (a = 0; a < 5; a++)
    {
        printf("chars[%d]=%c\n", a, chars[a]);
    }
    return 0;
}
