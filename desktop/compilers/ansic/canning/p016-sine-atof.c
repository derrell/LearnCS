/*
 * Derrell Lipman
 * Computing 1, Problem 16
 * The sine Function (and atof)
 */

#include <stdio.h>
#include <stdlib.h>
#include <math.h>

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
    int             conv;       // number of conversions
    double          input;      // user input, taken from the command line

    // Ensure there is a command line argument to access
    if (argc < 2)
    {
        printf("Missing command line argument containing a number\n");
        return 1;
    }

    // Convert the argument from a string to a number
    input = atof(argv[1]);

    // Print out their entered number.
    printf("The sine of %f is %f\n", input, sin(input));

    return 0;
}
