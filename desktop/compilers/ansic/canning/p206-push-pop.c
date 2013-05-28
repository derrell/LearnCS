/*
 * Assignment: p206 (push/pop)
 *
 * Author: Derrell Lipman
 */

#include <stdio.h>
#include <stdlib.h>

struct Integer
{
    struct Integer *  pNext;
    int               integer;
};

typedef struct Integer    Integer;

void pushInteger(Integer ** ppHead, int integerToPush);
int popInteger(Integer ** ppHead);
void printInteger(Integer * pInteger);
void printIntegerReverse(Integer * pInteger);
int getIntegerProduct(Integer * pInteger);


/**
 * Define the following structure and its type definition in your program
 *
 * struct Integer
 * {
 *     struct Integer *  pNext;
 *     int               integer;
 * };
 *
 * typedef struct Integer    Integer;
 *
 * Write a function called pushInteger() which is passed the address of a list
 * head pointer and an integer. The function must allocate an Integer
 * structure and insert it onto the head of the list. The signature of your
 * pushInteger() function should be as follows:
 *
 *   void pushInteger(Integer ** ppHead, int integerToPush);
 *
 * and might be called like this:
 *
 *   pushInteger(&pHead, 23);
 *
 * Write a function called popInteger() which is passed the address of a list
 * head pointer, and removes the Integer structure which is at the head of the
 * list by unlinking it from the list, saves the integer value saved in that
 * structure, frees the structure, and returns the saved integer. If there are
 * no more Integer structures on the list, the function should instead return
 * -999999. The signature of your popInteger() function should be as follows:
 *
 *   int popInteger(Integer ** ppHead);
 *
 * and might be called like this:
 *
 *   num = popInteger(&pHead);
 *
 * Write a function called printInteger() which is passed the a pointer to an
 * Integer structure. If the pointer provided is NULL, the function should
 * simply return. Otherwise, it should print that Integer structure's integer
 * value, and then call printInteger() recursively, passing the Integer
 * structure's pNext pointer. You may want to base this printInteger()
 * function on the printAnimal() function from the lexture notes. The entire
 * printed list should be on one line, with a single space before each
 * integer. It is the responsibility of the caller to append a newline if one
 * is desired.
 *
 * Write a function called printIntegerReverse() which operates identically to
 * printInteger, except that the end result should be that that list is
 * printed out in reverse order.
 *
 * Write a main() function that reads integers from the file p206-input until
 * reaching the end of the file. Each integer should be pushed onto the head
 * of the list, and the list printed after each push, by calling
 * printInteger() with the head pointer as its argument.
 *
 * After reaching the end of the input file, print the entire list in reverse
 * order, by calling printIntegerReverse with the head pointer as its argument.
 *
 * Finally, the integer at the head of the list should be repeatedly popped
 * off of the list and printed, and the resulting list printed. (When the
 * end-of-list value, -999999, is returned, There should be no attempt to
 * print the (non-existent) list after displaying that value.
 *
 * **__This specific output format is required.__**
 *
 * Example run:
 *
 * If the file contains the following data:
 *
 * 23
 * 13
 * 42
 * 19
 *
 * then running the program would result in this output:
 *
 *  23
 *  13 23
 *  42 13 23
 *  19 42 13 23
 *  23 13 42 19
 * 238602
 * 19
 *  42 13 23
 * 42
 *  13 23
 * 13
 *  23
 * 23
 *
 * -999999
 *
 * The first four lines of output are the result of printing the list each
 * time a new number is pushed onto the list.
 *
 * The following line is the list printed in reverse order.
 *
 * The big number is the product of the numbers in the list.
 *
 * Each pair of lines thenceforth is the number popped off of the list, and
 * the list as it then exists without the popped number.
 *
 * Finally, the empty list number is printed when there is nothing remaining
 * on the list.
 *
 * ** Notice how even the first element of a list has a space before it, but the
 * product and the popped numbers do not.**
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
    int             value;
    int             numConversions;
    FILE *          hFile;
    Integer *       pHead = NULL;

    // Open the input file
    if ((hFile = fopen("/canning/p206-input", "r")) == NULL)
    {
        fprintf(stderr, "Could not open file p206-input\n");
        return 1;
    }

    // As long as there are numbers in the file...
    for (numConversions = fscanf(hFile, "%d", &value);
         numConversions == 1;
         numConversions = fscanf(hFile, "%d", &value))
    {
        // Push this integer onto the list
        pushInteger(&pHead, value);

        // Print the list to show the new integer on the list
        printInteger(pHead);
        printf("\n");
    }

    // Print the list in reverse order
    printIntegerReverse(pHead);
    printf("\n");

    // Print the product of the numbers in the list
    printf("%d\n", getIntegerProduct(pHead));

    // Repeatedly pop the list until there's nothing left on it. Print the
    // popped value and then the remaining list.
    do
    {
        // Pop the top integer from the list
        value = popInteger(&pHead);

        // Print that popped value
        printf("%d\n", value);

        // Print the list
        if (value != -999999)
        {
            printInteger(pHead);
            printf("\n");
        }
    } while (value != -999999);

    // We're finished with the file. Close it.
    fclose(hFile);
    
    return 0;
}

/**
 * Push an integer onto the head of a list.
 *
 * @param ppHead
 *   Address of the list head. The pointer it points to is altered to reflect
 *   the new list head (the item being pushed)
 *
 * @param integerToPush
 *   The integer value to be pushed onto the top of the list, in an Integer
 *   structure.
 */
void pushInteger(Integer ** ppHead, int integerToPush)
{
    Integer *       pInteger;

    // Allocate an Integer structure for this new integer
    if ((pInteger = malloc(sizeof(Integer))) == NULL)
    {
        fprintf(stderr, "Out of memory\n");
        exit(1);
    }

    // Store the provided value in the structure
    pInteger->integer = integerToPush;

    // This new one's next element is whatever is currently the head
    pInteger->pNext = *ppHead;
    
    // Now the head can point to this new one
    *ppHead = pInteger;
}

/**
 * Pop an integer off of the head of a list.
 *
 * @param ppHead
 *   Address of the list head. The pointer it points to is altered to contain
 *   a pointer to the formerly second item on the list.
 *
 * @return
 *   The integer that was stored in the Integer structure that was at the head
 *   of the list.
 */
int popInteger(Integer ** ppHead)
{
    int             integer;
    Integer *       pInteger;

    // Is there anything in the list?
    if (*ppHead == NULL)
    {
        // Nope. Return the special value to indicate empty list
        return -999999;
    }

    // Point to the first element on the list
    pInteger = *ppHead;

    // The new list head becomes what that first element points to
    *ppHead = pInteger->pNext;

    // Save the integer value
    integer = pInteger->integer;

    // Now we can free the structure
    free(pInteger);

    // Return the integer value that we popped
    return integer;
}

/**
 * Print the list of integers with one space before each value output.
 *
 * @param pInteger
 *   The integer to be printed (along with all of its successors)
 */
void printInteger(Integer * pInteger)
{
    // Is this the end of the list?
    if (pInteger == NULL)
    {
        // Yup. Nothing to do.
        return;
    }

    // Print this one's value
    printf(" %d", pInteger->integer);

    // Print the next one
    printInteger(pInteger->pNext);
}

/**
 * Print the list of integers in reverse order, with one space before each
 * value output.
 *
 * @param pInteger
 *   The integer to be printed (along with all of its successors)
 */
void printIntegerReverse(Integer * pInteger)
{
    // Is this the end of the list?
    if (pInteger == NULL)
    {
        // Yup. Nothing to do.
        return;
    }

    // Print the next one first
    printIntegerReverse(pInteger->pNext);

    // Now print this one's value
    printf(" %d", pInteger->integer);
}

/**
 * Get the product of the numbers in the list.
 *
 * @param pInteger
 *   The current integer structure whose product is being determined
 *
 * @return
 *   The product of all successor integers and the argument's integer
 *
 */
int getIntegerProduct(Integer * pInteger)
{
    // Is this the end of the list?
    if (pInteger == NULL)
    {
        // Yup. Nothing to do.
        return 1;
    }

    // Get the next product of the following ones
    return pInteger->integer * getIntegerProduct(pInteger->pNext);
}
