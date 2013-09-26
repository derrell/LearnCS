#include <stdio.h>

const int       One = 1;

int main(int argc, char * argv[])
{
    switch(3)
    {
    case One :
      break;

    case 2 :
    case 3 :
    case 4 :
        printf("hello world\n");
        printf("hi there\n");
        break;
    }

    return 0;
}
