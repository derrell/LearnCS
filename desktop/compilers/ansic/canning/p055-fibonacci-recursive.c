/*
 * Derrell Lipman
 * Computing 1, Problem 55
 * Fibonacci Sequence (Recursive)
 */

#include <stdio.h>

// Forward declaration
int Fibonacci(int n);

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
    int             value;      // input value read from file

    // For each of the numbers in the file...
    for (;;)
    {
        // Prompt for input
        printf("Which number in the Fibonacci sequence would you like? ");

        // ... retrieve a number from the file
        conv = scanf("%d", &value);

        // Did we reach end of file?
        if (conv == EOF)
        {
            // Yup. Exit loop.
            break;
        }

        // Ensure we successfully read
        if (conv != 1)
        {
            printf("Read from file failed.");
            return 1;
        }

        // Print out the n'th Fibonacci number
        printf("The Fibonacci numbered %d is %d\n", value, Fibonacci(value));
    }

    return 0;
}

/**
 * Calculate the n'th number in the Fibonacci sequence
 *
 * @param n
 *   The number in the Fibonacci sequence to calculate
 *
 * @return
 *   The n'th number in the Fibonacci sequence
 */
int Fibonacci(int n)
{
    // If we got invalid input, just return 0
    if (n <= 0)
    {
        return 0;
    }

    // The first and second numbers are hard-coded to be 1
    if (n == 1 || n == 2)
    {
        return 1;
    }

    // Any other number is the sum of the prior two numbers.
    return Fibonacci(n - 2) + Fibonacci(n - 1);
}
