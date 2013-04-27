/*
 * Derrell Lipman
 * Computing 1, Problem 23
 * Scanf Returns What?
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
    int             value;      // user input value
    void *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p023-input", "r");
    if (hFile == NULL)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // For each integer found in the file...
    while (fscanf(hFile, "%d", &value) == 1)
    {
        // ... display its value
        printf("%d\n", value);
    }

    printf("End of input\n");
    fclose(hFile);
    return 0;
}
