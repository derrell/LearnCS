/*
 * Derrell Lipman
 * Computing 1, Problem 15
 * Using the sqrt Function
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
    double          input;      // user input

    // Prompt for user input
    printf("Please enter a number: ");

    // Retrieve a number from the user
    conv = scanf("%lf", &input);

    // Print the retrieved value, or an error
    if (conv != 1)
    {
        printf("I asked you to enter a number. You entered something else.\n");
        return 1;
    }

    // Print out the square root of their entered number.
    printf("The square root of %f is %f\n", input, sqrt(input));

    return 0;
}
