/*
 * Derrell Lipman
 * Computing 1, Problem 26
 * fgetc and toupper
 */

#include <stdio.h>
#include <ctype.h>

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
    int             ch;         // input value read from file
    void *          hFile;      // file handle

    // Open the input file
    hFile = fopen("/canning/p026-input", "r");
    if (hFile == NULL)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // Repeatedly retrieve a character from the file, until end-of-file
    while ((ch = fgetc(hFile)) != EOF)
    {
        // Print out the retrieved character, converted to upper case
        putchar(toupper(ch));
    }

    printf("\nAnd that's all, folks.\n");
    fclose(hFile);
    return 0;
}
