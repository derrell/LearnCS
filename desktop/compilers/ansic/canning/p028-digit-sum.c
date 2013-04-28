/*
 * Derrell Lipman
 * Computing 1, Problem 28
 * Digit Sum
 */

#include <stdio.h>

// Forward declaration
int digitSum(int input);

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
    void *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p028-input", "r");
    if (hFile == NULL)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // For each of the numbers in the file...
    for (;;)
    {
        // ... retrieve a number from the file
        conv = fscanf(hFile, "%d", &value);

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
            fclose(hFile);
            return 1;
        }

        // Print out the sum of the digits
        printf("The digit sum of %d is %d\n", value, digitSum(value));
    }

    // Clean up
    fclose(hFile);
    return 0;
}

/**
 * Calculate the sum of the digits of a number.
 *
 * @param input
 *   The value whose digits are to be summed
 *
 * @return
 *   The sum of the digits
 */
int digitSum(int input)
{
    int             sum = 0;    // Initialize the sum

    // While there are still digits to be added...
    while (input != 0)
    {
        // add the right-most digit's value to the sum
        sum += input % 10;

        // shift the number right one digit
        input /= 10;
    }

    // Give 'em the sum of the digits
    return sum;
}
