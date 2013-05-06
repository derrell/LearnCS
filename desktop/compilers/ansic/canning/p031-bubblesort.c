/*
 * Derrell Lipman
 * Computing 1, Problem 31
 * Bubblesort
 */

#include <stdio.h>

// Forward declarations
void bubblesort(int arr[]);
void swapValues(int * pA, int * pB);


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
    int             i;
    int             inputs[10];
    FILE *          hFile;

    // Open the file
    if ((hFile = fopen("/canning/p031-input", "r")) == NULL)
    {
        fprintf(stderr, "Could not open file: /canning/p031-input\n");
        return 1;
    }

    // Read 10 numbers
    for (i = 0; i < 10; i++)
    {
        // Read the next input value
        if (fscanf(hFile, "%d", &inputs[i]) != 1)
        {
            fprintf(stderr, "Expected a number; didn't get it.\n");
            fclose(hFile);
            return 1;
        }
    }

    // We have an array full of values to be sorted. Call the bubblesort
    // function to sort them.
    bubblesort(inputs);

    // Print the sorted values
    printf("In sorted order, the numbers are: ");
    for (i = 0; i < 10; i++)
    {
        printf("%d ", inputs[i]);
    }

    // Terminate the output with a newline
    printf("\n");

    // There were no errors. Return zero to indicate successful exit from the
    // program.
    return 0;
}


/**
 * Sort the integers in the provided array, using the bubblesort algorithm
 *
 * @param arr
 *   The array of integers to be sorted
 */
void bubblesort(int arr[])
{
    int             i;
    int             bSwappedSomething;

    // Make at least one pass through the integers, looking for any pairs that
    // require swapping. If we find a pair that does, do the swap, and mark
    // that we found something requiring swapping
    do
    {
        // Initially, assume that nothing will get swapped
        bSwappedSomething = 0;

        // For each element in the array up to the one before the last one...
        for (i = 0; i < 9; i++)
        {
            // ... Does this element need to be swapped with its successor?
            if (arr[i] > arr[i + 1])
            {
                // Yes. Swap them.
                swapValues(&arr[i], &arr[i + 1]);

                // Record that we did a swap
                bSwappedSomething = 1;
            }
        }
    } while (bSwappedSomething);
}


/**
 * Swap the values in the variables pointed to by the two arguments to this
 * function.
 *
 * @param pA
 *   A pointer to the first of two integer values to be swapped.
 *
 * @param pB
 *   A pointer to the second of two integer values to be swapped.
 */
void swapValues(int * pA, int * pB)
{
    int             temp;

    // Stow the first value away, so we can overwrite it with the second one.
    temp = *pA;

    // Store the second value in the location where the first one was.
    *pA = *pB;

    // Now we can store the original first value in the location of the second.
    *pB = temp;
}
