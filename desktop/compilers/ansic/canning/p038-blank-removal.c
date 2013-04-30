/*
 * Derrell Lipman
 * Computing 1, Problem 38
 * Blank Removal
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
    int             c;          // input character
    int             conv;       // number of conversions
    int             value;      // input value read from file
    int             bSawSpace;  // whether we just saw a space character
    void *          hFile;      // file handle

    // The file name is a required command-line argument. Ensure something is
    // there.
    if (argc < 2)
    {
        printf("You must provide a file name as a command-line argument.");
        printf(" Use \"/canning/p038-input\"\n");
        return 1;
    }

    // Open the input file
    hFile = fopen(argv[1], "r");
    if (hFile == NULL)
    {
        printf("Could not open input file\n");
        return 1;
    }

    // Initialize to having not just seen a space character
    bSawSpace = 0;

    // As long as we don't encounter end of file, retrieve a character
    while ((c = fgetc(hFile)) != EOF)
    {
        // Is this a space?
        if (c == ' ')
        {
            // Yes. Did we already see a space?
            if (bSawSpace)
            {
                // We did, so we can just ignore this character.
                continue;
            }
            else
            {
                // We hadn't just seen a space. Note that we're seeing one.
                bSawSpace = 1;
            }
        }
        else
        {
            // This character isn't a space. Clear the saw-a-space flag
            bSawSpace = 0;
        }

        // Either we hadn't just seen a space, or this isn't a space. Output it.
        putchar(c);
    }

    fclose(hFile);
    return 0;
}
