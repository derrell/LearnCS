#include <stdio.h>

void foo(int n)
{
    printf("Foo!\n");
}

int main(int argc, char * argv[])
{
  int (*   pFoo)(int n) = foo;
  
  foo(1);
  (*pFoo)(2);
  return 0;
}
