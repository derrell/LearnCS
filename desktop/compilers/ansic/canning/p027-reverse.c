/*
 * Derrell Lipman
 * Computing 1, Problem 27
 * Reverse
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
    int             i;          // loop index
    int             conv;       // number of conversions
    int             value[10];  // input values read from file

    // Prompt for user input
    printf("Enter 10 numbers separated by spaces or newlines: ");

    // For each of the 15 numbers in the file...
    for (i = 0; i < 10; i++)
    {
        // ... retrieve a number from the file
        conv = scanf("%d", &value[i]);

        // Ensure we successfully read
        if (conv != 1)
        {
            printf("Read from file failed.");
            fclose(hFile);
            return 1;
        }
    }

    // Now print them back out in reverse order
    for (--i; i >= 0; i--)
    {
        printf("%d ", value[i]);
    }

    // Finally, terminate output with a newline
    printf("\n");
    return 0;
}
