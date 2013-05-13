/*
 * Derrell Lipman
 * Computing 1, Problem 45
 * Malloc an integer
 */

#include <stdio.h>
#include <stdlib.h>

/**
 * Malloc space for one integer. This program mallocs space to hold one
 * integer value.  6 is deposited into this space and the value of the space
 * is then printed out.
 *
 * @param argc
 *   The number of arguments passed to this program
 *
 * @param argv
 *   Array of pointers to the argument strings
 *
 * @return
 *   0 upon success; non-zero otherwise
 */
int main(int argc, char *argv[])
{
    int *           pNum;
    
    // Allocate space for one integer
    pNum = malloc(sizeof(int));
    if (pNum == NULL)
    {
        fprintf(stderr, "Out of memory\n");
        return 1;
    }
    
    // Put a value there
    *pNum = 6;
    
    printf( "The number is %d.\n", *pNum );
    
    // Free the previously-allocated memory
    free(pNum);
    
    return 0;
}
