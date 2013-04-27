/*
 * Derrell Lipman
 * Computing 1, Problem 17
 * Count characters
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
    int             numChars;   // number of conversions

    // Prompt for user input
    printf("Please enter characters, and then press EOF: ");

    for (numChars = 0; getchar() != EOF; ++numChars)
        ;

    printf("\nReceived %d characters\n", numChars);

    return 0;
}
