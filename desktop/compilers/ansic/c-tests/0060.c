int main(int argc, char * argv[])
{
    int             i = 23;
    int *           pI;

    pI = &i;
    printf("i=%d &i=%x pI=%x *pI=%d\n", i, &i, pI, *pI);
    return 0;
}
