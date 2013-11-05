#include <stdio.h>

int main(int argc, char * argv[])
{
    char            c;
    unsigned char   uc;
    int             i1;
    int             i2;
    double          d1;
    double          d2 = 1.23;

    d1 = (int) d2;
    printf("Converting %f yields %f\n", d2, d1);

    i1 = 0x00112233;
    c = i1;
    uc = i1;
    i2 = (char) i1;
    printf("Converting 0x%x yields 0x%x 0x%x 0x%x\n", i1, c, uc, i2);
    
    i1 = 0xaabbccdd;
    c = i1;
    uc = i1;
    i2 = (char) i1;
    printf("Converting 0x%x yields 0x%x 0x%x 0x%x\n", i1, c, uc, i2);
    
    return 0;
}
