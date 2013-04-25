/*
 * Derrell Lipman
 * Computing 1, Problem 25
 * Sum of a Bunch
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
    int             sum;        // sum of the values read from the file
    int             conv;       // number of conversions
    int             value;      // input value read from file
    void *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p025-input", "r");
    if (hFile == (void *) -1)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // For each of the numbers in the file...
    for (sum = 0; ; sum += value)
    {
        // ... retrieve a number from the file
        conv = fscanf(hFile, "%d", &value);

        // Did we reach end of file?
        if (conv == -1)
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
    }

    // Print out the sum of the numbers.
    printf("The sum is %d\n", sum);
    fclose(hFile);
    return 0;
}
