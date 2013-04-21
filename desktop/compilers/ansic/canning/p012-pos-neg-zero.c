/*
 * Derrell Lipman
 * Computing 1, Problem 12
 * Positive, Negative, or Zero
 */

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
    int             value;

    // Prompt for user input
    printf("Please enter a number: ");

    // Retrieve a number from the user
    conv = scanf("%d", &value);

    // Print a message based on the retrieved value, or an error
    if (conv != 1)
    {
        printf("Sorry, I asked you to enter a number.");
        return 1;
    }

    // What is the entered value's relation to zero?
    if (value == 0)
    {
        // It is zero.
        printf("The number is zero.\n");
    }
    else if (value < 0)
    {
        // The number is less than zero.
        printf("The number is negative.\n");
    }
    else
    {
        // The number is greater than zero
        printf("The number is positive.\n");
    }
    return 0;
}
