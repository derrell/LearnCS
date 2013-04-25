/*
 * Derrell Lipman
 * Computing 1, Problem 9
 * Using a For Loop
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
    int             value;      // the value read from the file
    void *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p009-input", "r");
    if (hFile == (void *) -1)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // For each of the five values in the file...
    for (i = 0; i < 5; i++)
    {
        // ... retrieve a number from the file
        conv = fscanf(hFile, "%d", &value);

        // Ensure we successfully read
        if (conv != 1)
        {
            printf("Read of number %d from file failed.", i);
            fclose(hFile);
            return 1;
        }

        // Print the number
        printf("%d ", value);
    }

    // We've printed all of the numbers. Terminate the line.
    printf("\n");
    fclose(hFile);
    return 0;
}
