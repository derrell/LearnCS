/*
 * Derrell Lipman
 * Computing 1, Problem 19
 * Area of a Rectangle
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
    int             convWidth;  // number of conversions getting width
    int             convHeight; // number of conversions getting height
    float           width;      // user input value for width
    float           height;     // user input value for height

    // Prompt for user input: width
    printf("Please enter the width: ");

    // Retrieve a number from the user
    convWidth = scanf("%f", &width);

    // Prompt for user input: height
    printf("Please enter the height: ");

    // Retrieve a number from the user
    convHeight = scanf("%f", &height);

    // Validate input
    if (convWidth != 1 || convHeight != 1)
    {
        printf("Invalid input. Expected two numbers.\n");
        return 1;
    }

    // Print out the area.
    printf("The area of a %1.2f x %1.2f rectangle is %f\n",
           width, height, width * height);

    return 0;
}
