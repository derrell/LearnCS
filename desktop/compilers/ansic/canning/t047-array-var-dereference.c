#include <stdio.h>
#include <stdlib.h>

int main(int argc, char * argv[])
{
  char  str[] = "hi";
  
  printf("First char: %c %c\n", *str, str[0]);
  ++str;
  return 0;
}
