int main(int argc, char * argv[])
{
    int             i;

    for (i = 0; i < 5; i++)
    {
        printf("i=%d ", i);
        if (i == 3)
        {
            printf("Should not print 'hello world'\n");
            continue;
        }
        printf("hello world\n");
    }

    printf("\n\n");

    i = 0;
    do
    {
        printf("i=%d ", i);
        if (i == 3)
        {
            printf("Should not print 'hello world'\n");
            ++i;
            continue;
        }
        printf("hello world\n");
        ++i;
    } while (i < 5);

    return 0;
}
