#include <stdio.h>

void fill(int array[], int size)
{
    *array[0] = 23;
}

int main(int argc, char * argv[])
{
    int     i;
    int     arr[] = { 1, 2, 3 };

    fill(arr, 3);
    for (i = 0; i < 3; i++)
    {
        printf("array[%d] = %d\n", i, arr[i]);
    }

    printf("THAT SHOULD HAVE CAUSED A SEGMENTATION FAULT!\n\n");
    return 0;
}
