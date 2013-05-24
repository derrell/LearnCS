/*
 * Assignment: p203 (Malloc'ed array of structs)
 *
 * Author: Derrell Lipman
 */

#include <stdio.h>
#include <stdlib.h>

/**
 * Create a structure type called Person that contains a name (16 characters)
 * and an age (an integer).
 *
 * Open a file called p203-input. Read the first integer from the file, which
 * is the number of lines of data that follow it. Each following line of data
 * will contain a person's name and that person's age.
 *
 * Malloc space for the specified number of Person structures.
 *
 * Read entries from the file. Each entry will contain a name (without any
 * spaces), a space, and an integer. You will read this data into the fields
 * of successive structures in the malloc'ed array. In other words, the first
 * name and age you read in will be entered into the first Person structure in
 * the array, the second name and age you read will go into the second Person
 * structure in the array, etc.
 *
 * You must ensure that you do not overflow the name field. You've specified
 * that it can hold 16 characters -- including the trailing null terminator --
 * so you must ensure that you never read more than 15 characters from the
 * file into the array of chars so that it does not "overflow". You must leave
 * rroom for the null terminator character to be added. (It is added
 * automatically for you by fscanf.)
 *
 * You can use the format string, "%15s %d" to read each line of data. The
 * %15s will read up to 15 characters into the memory at the address specified
 * by the corresponding argument, and the %d will read, of course, a decimal
 * value into the address indicated by the corresponding integer
 * argument. (What is the expected number of conversions you should expect
 * from this call to fscanf?  Don't forget to test that expected number
 * against what fscanf returns, so you know if something failed.)
 *
 * Once all entries have been read in, print out each name and age pair on a
 * separate line (with a single space between the name and the age).
 *
 * Be sure to close any files you open, and to free any memory you allocate.
 *
 * A sample p203-input file might look like this:
 *
 * 6
 * Marlo 17
 * Chris 23
 * Julie 19
 * Kirtano 38
 * Mark 29
 * Sharon 18
 *
 * and your program's output would be:
 *
 * Marlo 17
 * Chris 23
 * Julie 19
 * Kirtano 38
 * Mark 29
 * Sharon 18
 *
 * @param argc
 *   The number of arguments passed to this program
 *
 * @param argv
 *   Array of pointers to the argument strings
 *
 * @return
 *   0 upon success; non-zero otherwise
 */
int main(int argc, char *argv[])
{
    int             i;
    int             numEntries;
    FILE *          hFile;
    struct Person
    {
        char            name[16];
        int             age;
    };
    struct Person * pPerson;

    // Open the input file
    if ((hFile = fopen("/canning/p203-input", "r")) == NULL)
    {
        fprintf(stderr, "Could not open file p203-input\n");
        return 1;
    }

    // Read the first integer, which is the number of following lines of data
    if (fscanf(hFile, "%d", &numEntries) != 1)
    {
        fprintf(stderr, "Error reading number of entries\n");
        fclose(hFile);
        return 1;
    }

    // Allocate space for that many entries
    if ((pPerson = malloc(sizeof(struct Person) * numEntries)) == NULL)
    {
        fprintf(stderr, "Out of memory allocating Persons\n");
        fclose(hFile);
        return 1;
    }

    // For each entry...
    for (i = 0; i < numEntries; i++)
    {
        if (fscanf(hFile, "%15s %d", pPerson[i].name, &pPerson[i].age) != 2)
        {
            fprintf(stderr, "Error reading entry %d\n", i);
            fclose(hFile);
            free(pPerson);
            pPerson = NULL;
            return 1;
        }
    }

    // We're finished with the file. Close it.
    fclose(hFile);

    // Print all of the data
    for (i = 0; i < numEntries; i++)
    {
        printf("%s %d\n", pPerson[i].name, pPerson[i].age);
    }

    // We're done with the allocated memory. Free it.
    free(pPerson);
    pPerson = NULL;
    
    return 0;
}
