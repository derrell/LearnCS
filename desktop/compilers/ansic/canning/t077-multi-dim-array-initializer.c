#include <stdio.h>

int main(void)
{
    int     i, j, k;
    int     arr[3][2][4] =
        {
            {
                {
                    23  // [0][0][0]
                }
            },
            {
                {
                    24  // [1][0][0]
                },
                {
                    25, // [1][1][0]
                    26  // [1][1][1]
                }
            }
        };

    for (i = 0; i < 3; i++)
    {
        for (j = 0; j < 2; j++)
        {
            for (k = 0; k < 4; k++)
            {
                printf("arr[%d][%d][%d] = %d\n", i, j, k, arr[i][j][k]);
            }
        }
    }
    return 0;
}
