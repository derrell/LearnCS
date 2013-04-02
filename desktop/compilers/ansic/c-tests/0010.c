int main(int argc, char * argv[])
{
    int             x = 42;
    int             y = 97;
    if (1)
    {
        x = 23;
    }

    if (0)
    {
        y = 2;
    }
    else
    {
        y = 3;
    }

    printf("x=%d y=%d\n", x, y);
    return 0;
}
