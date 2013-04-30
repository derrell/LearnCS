/*
 * Derrell Lipman
 * Computing 1, Problem 54
 * Fibonacci Sequence (Iterative)
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
    int             i;          // loop iterator
    int             prev2;      // the previous' previous value
    int             prev1;      // the immediate previous value
    int             current;    // the current value, while looping

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

    // Initialize the first two values in the sequence
    prev2 = 1;
    prev1 = 1;
    
    // For each value from 3 upwards to the requested number...
    for (i = 3; i <= n; i++)
    {
        // Get the sum of the previous two values
        current = prev2 + prev1;

        // Now shift prev1 into prev2, and the current value into prev1.
        prev2 = prev1;
        prev1 = current;
    }

    // The most recent current value is our result.
    return current;
}
