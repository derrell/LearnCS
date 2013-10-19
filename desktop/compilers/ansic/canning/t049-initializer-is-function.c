#include <stdio.h>

int x(void)
{
  int                 a;
  int                 b;
  
  a = 23;
  b = 42;

  return a;
}

int main(int argc, char * argv[])
{
  int                 aa = 10;
  int                 bb = x();

  printf("aa=%d bb=%d\n", aa, bb);
  return 0;
}
