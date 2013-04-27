/*
 * Derrell Lipman
 * Computing 1, Problem 20
 * Area of a Circle
 */

#include <stdio.h>
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
    int             conv;       // number of conversions getting width
    float           radius;     // user input value for radius

    // Prompt for user input: radius
    printf("Please enter the radius of the circle: ");

    // Retrieve a number from the user
    conv = scanf("%f", &radius);

    // Validate input
    if (conv != 1)
    {
        printf("Invalid input. Expected a number.\n");
        return 1;
    }

    // Print out the area.
    printf("The area of a circle of radius %1.2f is %1.2f\n",
           radius, radius * radius * M_PI);

    return 0;
}
