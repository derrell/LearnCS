int main(int argc, char * argv[])
{
    char            ch;
    short           s;
    int             i;
    long            l;
    float           f;
    double          d;
    unsigned char   uch;
    unsigned short  us;
    unsigned int    ui;
    unsigned long   ul;

    printf("sizeof(char) = " + sizeof(char));
    printf("sizeof(short) = " + sizeof(short));
    printf("sizeof(int) = " + sizeof(int));
    printf("sizeof(long) = " + sizeof(long));
    printf("sizeof(float) = " + sizeof(float));
    printf("sizeof(double) = " + sizeof(double));
    printf("sizeof(unsigned char) = " + sizeof(unsigned char));
    printf("sizeof(unsigned short) = " + sizeof(unsigned short));
    printf("sizeof(unsigned int) = " + sizeof(unsigned int));
    printf("sizeof(unsigned long) = " + sizeof(unsigned long));

    printf("sizeof(char *) = " + sizeof(char *));
    printf("sizeof(short *) = " + sizeof(short *));
    printf("sizeof(int *) = " + sizeof(int *));
    printf("sizeof(long *) = " + sizeof(long *));
    printf("sizeof(float *) = " + sizeof(float *));
    printf("sizeof(double *) = " + sizeof(double *));
    printf("sizeof(unsigned char *) = " + sizeof(unsigned char *));
    printf("sizeof(unsigned short *) = " + sizeof(unsigned short *));
    printf("sizeof(unsigned int *) = " + sizeof(unsigned int *));
    printf("sizeof(unsigned long *) = " + sizeof(unsigned long *));

    return 0;
}
