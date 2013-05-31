#include <stdio.h>

int main(int argc, char * argv[])
{
  union U
  {
      unsigned long   ul;
      unsigned char   bytes[4];
  } u;

  u.ul = 0x11223344;

  printf("bytes: %02x %02x %02x %02x\n",
         u.bytes[0], u.bytes[1], u.bytes[2], u.bytes[3]);

  return 0;
}
