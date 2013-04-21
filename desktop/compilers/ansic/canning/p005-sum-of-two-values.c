/*
 * Derrell Lipman
 * Computing 1, Problem 5
 * Sum of Two Values
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
    int             value1;
    int             value2;

    // Prompt for user input
    printf("Please enter two numbers, separated by whitespace: ");

    // Retrieve two numbers from the user
    conv = scanf("%d %d", &value1, &value2);

    // Print the sum of the retrieved values, or an error
    if (conv != 2)
    {
        printf("Sorry, I asked you to enter two numbers.");
        return 1;
    }

    // Print out their entered numbers, and the sum.
    printf("The sum of %d and %d is %d\n", value1, value2, value1 + value2);
    return 0;
}
