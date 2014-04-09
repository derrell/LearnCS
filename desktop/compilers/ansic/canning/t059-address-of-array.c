int main(int argc, char * argv[])
{
    char *	p1;
    char *	p2;

    p1 = &p2;
    p2 = &p1;
    return &p1 - &p2;
}
