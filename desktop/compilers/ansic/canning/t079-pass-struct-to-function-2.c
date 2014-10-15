#include <stdio.h>
#include <math.h>

typedef struct color{int r; int g; int b;}color;

void drawCircle(int x, int y, int rad, color c);

int main(int argc, char * argv[])
{
    color c;

    c.r = 160;
    c.g = 0;
    c.b = 0;

    drawCircle(50, 50, 200, c);
    return 0;
}

void drawCircle(int x, int y, int rad, color c)
{
    printf("drawCircle\n");
}
