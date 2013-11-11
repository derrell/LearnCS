#include <stdio.h>

int main(int argc, char * argv[])
{ 
    int *   pInt = 0x100;
    short * pShort = 0x200;
    
    pInt++;
    pShort++;

    pInt = pInt + 1;
    pShort = pShort + 1;
    
    printf("pInt=0x%lx pShort=0x%lx\n", pInt, pShort);
    return 0;
}
