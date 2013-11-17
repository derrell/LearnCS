#include <stdio.h>

struct X
{
    int             x;
    short           y;
};

int main(int argc, char * argv[])
{ 
    int *   pInt = 0x100;
    short * pShort = 0x200;
    struct X * pX = (struct X *) 0x300;
    
    pInt++;
    pShort++;
    pX++;

    printf("Size of struct X is %d\n", sizeof(struct X));
    printf("pInt=0x%lx pShort=0x%lx pX=%lx\n", pInt, pShort, pX);

    pInt = pInt + 1;
    pShort = pShort + 1;
    pX = pX + 1;
    
    printf("pInt=0x%lx pShort=0x%lx pX=%lx\n", pInt, pShort, pX);
    return 0;
}
