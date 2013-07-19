#include <stdlib.h>
#include <stdio.h>

struct Swingset1
{
    int numSwings;
    int swingsInUse;
};

int main(int argc, char * argv[])
{
    struct Swingset2
    {
        int numSwings;
        int swingsInUse;
    };
    
    struct Swingset1 swingset1;
    struct Swingset2 swingset2;
    
    printf("sizeof(struct Swingset1) = %d sizeof(struct Swingset2) = %d\n",
            sizeof(struct Swingset1), sizeof(struct Swingset2));
    printf("sizeof(swingset1) = %d sizeof(swingset2) = %d\n",
            sizeof(swingset1), sizeof(swingset2));

    swingset1.numSwings = 2;
    swingset1.swingsInUse = 1;

    swingset2.numSwings = 5;
    swingset2.swingsInUse = 3;

    printf("Swingset1: %d of %d swings in use\n",
           swingset1.swingsInUse, swingset1.numSwings);
    printf("Swingset2: %d of %d swings in use\n",
           swingset2.swingsInUse, swingset2.numSwings);

    return 0;
}
