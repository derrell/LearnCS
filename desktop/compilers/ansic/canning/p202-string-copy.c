/*
 * Derrell Lipman
 * Computing 1, Problem 202
 * String Copy
 */

#include <stdio.h>

// Forward declarations
void stringCopyByIndex(char * pSource, char * pDest);
void stringCopyByDereference(char * pSource, char * pDest);

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
    char            buf1[40];   // buffer to use for stringCopyByIndex
    char            buf2[40];   // buffer to use for stringCopyByDereference

    // Ensure we were passed the requisite string
    if (argc < 2)
    {
        printf("Expected that the string to be copied would be provided ");
        printf("on the command line.");
        return 1;
    }

    // Call the function which copies using an index
    stringCopyByIndex(argv[1], buf1);
    printf("stringCopyByIndex copied: '%s'\n", buf1);

    // Ditto for the one which copies by dereference
    stringCopyByDereference(argv[1], buf2);
    printf("stringCopyByDereference copied: '%s'\n", buf2);

    return 0;
}

void stringCopyByIndex(char * pSource, char * pDest)
{
    int             i;

    // Copy up to 40 characters. Stop upon reaching 40, or the null terminator
    for (i = 0; i < 40 && pSource[i]; i++)
    {
        // Copy this indexed character from the source to the destination.
        pDest[i] = pSource[i];
    }

    // If there's room left in the destination buffer...
    if (i < 40)
    {
        // ... then copy the null terminator
        pDest[i] = pSource[i];
    }
}

void stringCopyByDereference(char * pSource, char * pDest)
{
    int             i = 40;

    // Copy up to 40 characters. Stop upon reaching 40, or the null terminator
    while (*pSource && i > 0)
    {
        // Copy the character currently being pointed to
        *pDest++ = *pSource++;

        // Decrement maximum number of characters allowable to copy
        --i;
    }

    // If there's room left in the destination buffer...
    if (i > 0)
    {
        // ... then copy the null terminator
        *pDest = *pSource;
    }
}
