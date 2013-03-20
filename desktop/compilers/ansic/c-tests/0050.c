int main(int argc, char * argv[])
{
    char            c;
    short           s;
    int             i;
    long            l;
    float           f;
    double          d;
    unsigned char   uc;
    unsigned short  us;
    unsigned int    ui;
    unsigned long   ul;

    printf("sizeof(char) = %d\n", sizeof(char));
    printf("sizeof(short) = %d\n", sizeof(short));
    printf("sizeof(int) = %d\n", sizeof(int));
    printf("sizeof(long) = %d\n", sizeof(long));
    printf("sizeof(float) = %d\n", sizeof(float));
    printf("sizeof(double) = %d\n", sizeof(double));
    printf("sizeof(unsigned char) = %d\n", sizeof(unsigned char));
    printf("sizeof(unsigned short) = %d\n", sizeof(unsigned short));
    printf("sizeof(unsigned int) = %d\n", sizeof(unsigned int));
    printf("sizeof(unsigned long) = %d\n", sizeof(unsigned long));

    printf("sizeof(char *) = %d\n", sizeof(char *));
    printf("sizeof(short *) = %d\n", sizeof(short *));
    printf("sizeof(int *) = %d\n", sizeof(int *));
    printf("sizeof(long *) = %d\n", sizeof(long *));
    printf("sizeof(float *) = %d\n", sizeof(float *));
    printf("sizeof(double *) = %d\n", sizeof(double *));
    printf("sizeof(unsigned char *) = %d\n", sizeof(unsigned char *));
    printf("sizeof(unsigned short *) = %d\n", sizeof(unsigned short *));
    printf("sizeof(unsigned int *) = %d\n", sizeof(unsigned int *));
    printf("sizeof(unsigned long *) = %d\n", sizeof(unsigned long *));

    printf("sizeof(c) = %d\n", sizeof(c));
    printf("sizeof(s) = %d\n", sizeof(s));
    printf("sizeof(i) = %d\n", sizeof(i));
    printf("sizeof(l) = %d\n", sizeof(l));
    printf("sizeof(f) = %d\n", sizeof(f));
    printf("sizeof(d) = %d\n", sizeof(d));
    printf("sizeof(uc) = %d\n", sizeof(uc));
    printf("sizeof(us) = %d\n", sizeof(us));
    printf("sizeof(ui) = %d\n", sizeof(ui));
    printf("sizeof(ul) = %d\n", sizeof(ul));

    return 0;
}
