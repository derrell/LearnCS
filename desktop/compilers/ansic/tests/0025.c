void foo(int x)
{
    short bar = 23U;
    short baz;
    char * format = "in foo: x=%d\n";
    baz = bar;
    baz = x;

    if (x > 1)
    {
        foo(x - 1);
    }
}

int main(int argc, char * argv[])
{
    int bing = 42;
    foo(2);
    bing = 43;
}
