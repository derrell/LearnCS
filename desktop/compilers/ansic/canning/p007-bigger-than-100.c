/*
 * Derrell Lipman
 * Computing 1, Problem 7
 * Bigger than 100?
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

    // Is the entered number bigger than 100?
    if (value > 100)
    {
        // Yup. Tell 'em so.
        printf("The number is bigger than 100\n");
    }
    else
    {
        // It's not bigger than 100. Let 'em know.
        printf("The number is not bigger than 100\n");
    }
    return 0;
}
