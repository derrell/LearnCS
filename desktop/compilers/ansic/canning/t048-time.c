#include <stdio.h>
#include <time.h>

int main(int argc, char * argv[])
{
    time_t          t1;
    time_t          t2;

    t1 = time(&t2);

    printf("t1 = time(&t2): (t1 == t2): %d\n", t1 == t2);

    return 0;
}
