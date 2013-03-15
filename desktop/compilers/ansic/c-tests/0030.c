int main(int argc, char * argv[])
{
    int i = 23;
    
    printf("original i: %d\n", i);
    printf("i += 4 : %d\n", i += 4);
    printf("i -= 4 : %d\n", i -= 4);
    printf("i *= 2 : %d\n", i *= 2);
    printf("i = 23 : %d\n", i = 23);
    printf("i /= 2 : %d\n", i /= 2);
    printf("i = 23 : %d\n", i = 23);
    printf("i %= 10 : 0x%x\n", i %= 10);
    printf("i >>= 1 : 0x%x\n", i >>= 1);
    printf("i = 15 : 0x%x\n", i = 15);
    printf("i <<= 2 : 0x%x\n", i <<= 2);
    printf("i |= 7 : 0x%x\n", i |= 7);
    printf("i &= ~4 : 0x%x\n", i &= ~4);
    printf("i ^= 2 : 0x%x\n", i ^= 2);
    
    printf("i = 23 : %d\n", i = 23);
    printf("--i : %d\n", --i);
    printf("i : %d\n", i);
    printf("++i : %d\n", ++i);
    printf("i : %d\n", i);
    printf("i-- : %d\n", i--);
    printf("i : %d\n", i);
    printf("i++ : %d\n", i++);
    printf("i : %d\n", i);
    
    printf("i = 2 : %d\n", i = 2);
    printf("i ^ 3 : 0x%x\n", i ^ 3);
    printf("i | 4 : 0x%x\n", i | 4);
    printf("i & ~4 : 0x%x\n", i & ~4);
    printf("i == 2 : %d\n", i == 2);
    printf("i == 3 : %d\n", i == 3);
    printf("i != 2 : %d\n", i != 2);
    printf("i != 3 : %d\n", i != 3);
    
    printf("i < 3 : %d\n", i < 3);
    printf("i < 2 : %d\n", i < 2);
    printf("i < 1 : %d\n", i < 1);

    printf("i <= 3 : %d\n", i <= 3);
    printf("i <= 2 : %d\n", i <= 2);
    printf("i <= 1 : %d\n", i <= 1);

    printf("i > 3 : %d\n", i > 3);
    printf("i > 2 : %d\n", i > 2);
    printf("i > 1 : %d\n", i > 1);

    printf("i >= 3 : %d\n", i >= 3);
    printf("i >= 2 : %d\n", i >= 2);
    printf("i >= 1 : %d\n", i >= 1);

    return 0;
}
