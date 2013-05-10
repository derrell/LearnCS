/*
 * Derrell Lipman
 * Computing 1, Problem 6
 * The fscanf Function
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
    int             conv;       // number of conversions
    int             value;      // input value read from file
    FILE *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p006-input", "r");
    if (hFile == NULL)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // Retrieve a number from the file
    conv = fscanf(hFile, "%d", &value);

    // Ensure we successfully read
    if (conv != 1)
    {
        printf("Read from file failed.");
        fclose(hFile);
        return 1;
    }

    // Print out the retrieved number
    printf("Found value %d\n", value);
    fclose(hFile);
    return 0;
}
