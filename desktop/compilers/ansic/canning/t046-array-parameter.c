#include <stdio.h>
#include <stdlib.h>

void x(char str[])
{
    printf("First char: %c %c\n", *str, str[0]);

    ++str;
}

int main(int argc, char * argv[])
{
  char  str[] = "hi";
  
  x(str);
  
  return 0;
}
