int main(int argc, char * argv[])
{
    int             i;

    i = 23;
    printf("Expecting 23: %d\n", i);
    printf("Expecting 0x17: 0x%x\n", i);

    i = 0x17;
    printf("Expecting 23: %d\n", i);
    printf("Expecting 0x17: 0x%x\n", i);

    i = -572662307;
    printf("Expecting -572662307: %d\n", i);
    printf("Expecting 0xdddddddd: 0x%x\n", i);

    i = 0xdddddddd;
    printf("Expecting -572662307: %d\n", i);
    printf("Expecting 0xdddddddd: 0x%x\n", i);

    printf("Expecting -572662307: %d\n", -572662307);
    printf("Expecting 0xdddddddd: 0x%x\n", -572662307);

    printf("Expecting -572662307: %d\n", 0xdddddddd);
    printf("Expecting 0xdddddddd: 0x%x\n", 0xdddddddd);

    return 0;
}
