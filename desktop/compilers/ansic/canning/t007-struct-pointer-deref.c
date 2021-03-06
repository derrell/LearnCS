#include <stdio.h>

int main(int argc, char * argv[])
{
  struct X
  {
      int i;
      struct
      {
          double    d;
          double    e;
      } k;
      int j;
  } x;
  
  struct X *      pX = &x;

  x.i = 23;  
  x.j = 42;
  x.k.d = 2.0;
  x.k.e = 4.2;

  printf("Via structure access:\n");
  printf("i=%d d=%f e=%f j=%d\n", x.i, x.k.d, x.k.e, x.j);
  printf("&i=0x%x &d=0x%x &e=0x%x &j=0x%x\n", &x.i, &x.k.d, &x.k.e, &x.j);
  printf("&x.k=0x%x\n", &x.k);

  printf("\nVia pointer dereference:\n");
  printf("pX=0x%x\n", pX);
  printf("i=%d d=%f e=%f j=%d\n",
         pX->i, pX->k.d, pX->k.e, pX->j);
  printf("&i=0x%x &d=0x%x &e=0x%x &j=0x%x\n",
         &pX->i, &pX->k.d, &pX->k.e, &pX->j);
  printf("&pX->k=0x%x\n", &pX->k);

  return 0;
}
