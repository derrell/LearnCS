/*
 * Derrell Lipman
 * Computing 1, Problem 29
 * Find the Average
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
    double          numValues;  // number of values read from the file
    void *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p029-input", "r");
    if (hFile == NULL)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // Initlialize the sum and number of values read so far
    sum = 0;
    numValues = 0;

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

        // Add this value to the sum
        sum += value;

        // We've had one addition value. Track that.
        ++numValues;
    }

    // Print out the average.
    printf("The average is %f\n", sum / numValues);

    // Clean up
    fclose(hFile);
    return 0;
}
