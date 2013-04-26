/*
 * Derrell Lipman
 * Computing 1, Problem 10
 * Sum of Twenty
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
    int             sum;        // running sum
    int             value;      // input values read from file
    void *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p010-input", "r");
    if (hFile == NULL)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // Initialize the sum
    sum = 0;

    // For each of the 15 numbers in the file...
    for (i = 0; i < 20; i++)
    {
        // ... retrieve a number from the file
        conv = fscanf(hFile, "%d", &value);

        // Ensure we successfully read
        if (conv != 1)
        {
            printf("Read from file failed.");
            fclose(hFile);
            return 1;
        }

        // Update the sum
        sum += value;
    }

    // Print out the sum of the numbers.
    printf("The sum is %d\n", sum);
    fclose(hFile);
    return 0;
}
