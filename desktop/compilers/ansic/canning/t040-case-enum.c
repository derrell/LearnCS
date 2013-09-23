#include <stdio.h>

enum
  {
    Zero = 0
  };

int main(int argc, char * argv[])
{
    switch(3)
    {
    case Zero :
      printf("case 0\n");
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
