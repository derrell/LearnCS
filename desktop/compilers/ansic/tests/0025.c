void foo(int x)
{
    short bar = 23U;
    short baz;
    baz = bar;
    baz = x;
    printf("in foo: x=%d\n", x);

    if (x > 1)
    {
        foo(x - 1);
    }
}

int main(int argc, char * argv[])
{
    int bing = 42;
    short z = 2;
    foo(z);
    bing = 43;
}
