/*
 * Assignment: p207 (calculator)
 *
 * Author: Derrell Lipman
 */

#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>

#define UNRECOGNIZED_COMMAND    "Unrecognized command\n"
#define EMPTY_STACK             "Empty stack\n"

enum TokenType
{
    TokenType_Value,
    TokenType_Command
};

struct Integer
{
    struct Integer *  pNext;
    int               integer;
};

typedef struct Integer    Integer;

void pushInteger(Integer ** ppHead, int integerToPush);
int popInteger(Integer ** ppHead);
void printInteger(Integer * pInteger);
enum TokenType getToken(int * pValue, char * pCommand);


/**
 * For this program, you must retrieve the C file associated with this program
 * in Bottlenose. That C file contains the getToken() function and the
 * manifest constants described below.
 *
 * You will likely want to pull functions from your implementation of p206 to
 * accomplish this program.
 *
 *
 * Write a "Reverse Polish Notation" (RPN) calculator. With RPN, numeric
 * values that are entered are pushed onto a stack. When a "binary"
 * (two-operand) operator command is specified, such as '+', the top two
 * values are popped off of the stack, the operator is applied to them, e.g.,
 * if the operator was '+', the two values are added, and the result is pushed
 * back onto the stack. Your calculator must support the operators '+', '-',
 * and '*'.
 *
 * Some additional commands must also supported:
 *
 *    'p' : the top value is popped off of the stack and printed, followed by a
 *          newline.
 *
 *    's' : the entire stack is printed, from top-of-stack to bottom-of-stack
 *
 *    'q' : the program quits
 *
 * All commands are single letters. The quotes delimiting them in this
 * description are not part of the command.
 *
 * All input is obtain via calls to the pre-existing getToken() function. You
 * pass to getToken() two addresses: where to put an integer value that is
 * retrieved, and where to put a command that is retrieved. The getToken()
 * function returns one of the two enumerated values TokenType_Value
 * orTokenType_Command, to tell you which of your two variables was filled.
 *
 * Use of any unrecognized command must display the text in the manifest
 * constant (#define) UNRECOGNIZED_COMMAND.
 *
 * If a command attempts to pop the stack when the stack is empty, the text in
 * the manifest constant EMPTY_STACK must be displayed. Any operands that had
 * already been popped off of the stack in this situation must be silently
 * discarded. They do not get pushed back onto the stack.
 *
 * Example run of the program:
 *
 *         1 2 + p
 *         3
 *         1 2 s
 *          2 1
 *         + p
 *         3
 *         3 5 - p
 *         -2
 *         2 2 * 3 3 * * p
 *         36
 *         2 3 + 4 s
 *          4 5
 *         * p
 *         20
 *         2 +
 *         Empty stack
 *         a
 *         Unrecognized command
 *         q
 *
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
    int             bDone = 0;
    int             value1;
    int             value2;
    char            command;
    enum TokenType  tokenType;
    Integer *       pHead = NULL;

    while (! bDone)
    {
        // Retrieve the next token
        tokenType = getToken(&value1, &command);

        // Did we get a value or a command?
        if (tokenType == TokenType_Value)
        {
            // We got a value. Push it onto the stack
            pushInteger(&pHead, value1);
        }
        else
        {
            // We got a command. Figure out which one it is.
            switch(command)
            {
            case '+':           // add
                // Pop the top value off of the stack
                value1 = popInteger(&pHead);
                if (value1 == -999999)
                {
                    printf(EMPTY_STACK);
                    break;
                }

                // Pop the top value off of the stack
                value2 = popInteger(&pHead);
                if (value2 == -999999)
                {
                    printf(EMPTY_STACK);
                    break;
                }

                // Push the result of the addition
                pushInteger(&pHead, value2 + value1);
                break;

            case '-':           // subtract
                // Pop the top value off of the stack
                value1 = popInteger(&pHead);
                if (value1 == -999999)
                {
                    printf(EMPTY_STACK);
                    break;
                }

                // Pop the top value off of the stack
                value2 = popInteger(&pHead);
                if (value2 == -999999)
                {
                    printf(EMPTY_STACK);
                    break;
                }

                // Push the result of the subtraction
                pushInteger(&pHead, value2 - value1);
                break;

            case '*':           // multiply
                // Pop the top value off of the stack
                value1 = popInteger(&pHead);
                if (value1 == -999999)
                {
                    printf(EMPTY_STACK);
                    break;
                }

                // Pop the top value off of the stack
                value2 = popInteger(&pHead);
                if (value2 == -999999)
                {
                    printf(EMPTY_STACK);
                    break;
                }

                // Push the result of the multiplication
                pushInteger(&pHead, value2 * value1);
                break;

            case 'p':           // print
                // Pop the top value off of the stack
                value1 = popInteger(&pHead);
                if (value1 == -999999)
                {
                    printf(EMPTY_STACK);
                    break;
                }

                // Print the value that was at the top of the stack
                printf("%d\n", value1);
                break;

            case 's':           // stack dump
                // Print the whole stack
                printInteger(pHead);
                printf("\n");
                break;

            case 'q':           // quit
                // Clean up after ourselves
                while (popInteger(&pHead) != -999999)
                {
                    // Don't do anything. We're just popping to clean up.
                }

                // Cause the loop to terminate
                bDone = 1;
                break;

            default:
                printf(UNRECOGNIZED_COMMAND);
                break;
            }
        }
    }
    
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
 * Retrieve a token from the keyboard. A token is either a single-character
 * command, or an integer value.
 *
 * @param pValue
 *   If the retrieved token is an integer value, it will be put at the address
 *   specified by this pointer, and the return value of this function will be
 *   Token_Value. If the retrieved token is not an integer value, the memory
 *   at this address will be untouched.
 *
 * @param pCommand
 *   If the retrieved token is a character command, the character will be put
 *   at the address of specified by this pointer, and the return value of this
 *   function will be Token_Command. If the retrieved value is an integer
 *   value, the memory at this address will be untouched.
 *
 * @return
 *   Token_Value if the retrieved token is an integer;
 *   Token_Command if the retrieved token is a single-character commmand.
 */
enum TokenType getToken(int * pValue, char * pCommand)
{
    char            c;

    // Read a character at a time until the one we get isn't whitespace.
    do
    {
        // Read a single character from standard input.
        c = getc(stdin);

        // Loop as long as the character we got is whitespace
    } while (isspace(c));

    // Determine what type of character we got
    if (c == EOF)
    {
        // We encountered end of input on stdin. Convert that into 'q' to quit
        c = 'q';
    }

    // Is the character we retrieved a digit?
    if (isdigit(c))
    {
        // Yup, it's a digit. Push the character back onto the input stream,
        // and then call scanf to retrieve the converted integer value (which
        // may be many digits long).
        ungetc(c, stdin);

        // We know there's at least one digit in the input stream because we
        // just pushed one back onto the input stream, so we're definitely not
        // at EOF and we'll absolutely get a successful conversion. We can
        // therefore ignore the return value from scanf in this very rare
        // case.
        //
        // Place the converted integer into the location that the caller
        // specified.
        scanf("%d", pValue);

        // We gave the caller an integer value. Let 'em know.
        return TokenType_Value;
    }
    else
    {
        // We got some character other than whitespace or digit. It must
        // be a command. Give it to the caller.
        *pCommand = c;

        // Tell 'em they've got a command.
        return TokenType_Command;
    }
}
