#include <stdio.h>

int main(int argc, char* argv[])
{
    int             i;
    FILE *          fin;

    fin = (FILE *) 1;
    fscanf(fin, "%d", &i);
    return 0;
}
