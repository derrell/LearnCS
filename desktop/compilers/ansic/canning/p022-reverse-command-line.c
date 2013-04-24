/*
 * Derrell Lipman
 * Computing 1, Problem 22
 * Reverse the Command Line
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
    // For each argument...
    while (argc--)
    {
        // ... display its argument number and value
        printf("Argument %d: %s\n", argc, argv[argc]);
    }

    return 0;
}
