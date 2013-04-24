/*
 * Derrell Lipman
 * Computing 1, Problem 8
 * One Horizontal Line of Asterisks
 */

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
    int             numStars;   // number of stars to print, read from file
    void *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p008-input", "r");
    if (hFile == (void *) -1)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // Retrieve a number from the file
    conv = fscanf(hFile, "%d", &numStars);

    // Ensure we successfully read
    if (conv != 1)
    {
        printf("Read from file failed.");
        fclose(hFile);
        return 1;
    }

    // Print out the specified number of asterisks
    for (i = 0; i < numStars; i++)
    {
        printf("*");
    }

    // We've printed a complete line of asterisks. Add a newline.
    printf("\n");
    fclose(hFile);
    return 0;
}
