/*
 * Derrell Lipman
 * Computing 1, Problem 21
 * Argv
 */

#include <stdio.h>

/**
 * Main program entry point
 * 
 * @param argc
 *   The number of command-line arguments to this function
 * 
 * @param argv
 *   Array of command-line arguments to this function, of length argc.
 * 
 * @return
 *   zero upon success, non-zero upon failure
 */
int main(int argc, char * argv[])
{
    int             i;          // loop iteration index

    // For each argument...
    for (i = 0; i < argc; i++)
    {
        // ... display its argument number and value
        printf("Argument %d: %s\n", i, argv[i]);
    }

    return 0;
}
