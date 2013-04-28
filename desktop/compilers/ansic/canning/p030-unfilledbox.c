/*
 * Derrell Lipman
 * Computing 1, Problem 30
 * Unfilled Box
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
 *   0 upon success (always, in this particular program)
 */
int main(int argc, char * argv[])
{
    int     row;        // loop iterator for each row
    int     col;        // loop iterator for each column
    int     width;      // The user-entered width
    int     height;     // The user-entered height
    int     conv;       // number of conversions, returned by scanf

    // Prompt for box width and height
    printf("Please enter the box width: ");
    do
    {
        // Attempt to read an integer
        conv = scanf("%d", &width);

        // Did we succeed?
        if (conv != 1)
        {
            // No, we found garbage or EOF. If we're not at EOF...
            if (conv == 0)
            {
                // ... then remove the garbage character
                scanf("%*c");

                // Re-prompt
                printf("Invalid input. Please enter the box width: ");
            }
        }
    } while (conv != 1);
    
    printf("Please enter the box height: ");
    do
    {
        // Attempt to read an integer
        conv = scanf("%d", &height);

        // Did we succeed?
        if (conv != 1)
        {
            // No, we found garbage or EOF. If we're not at EOF...
            if (conv == 0)
            {
                // ... then remove the garbage character
                scanf("%*c");

                // Re-prompt
                printf("Invalid input. Please enter the box height: ");
            }
        }
    } while (conv != 1);
    
    // For each row...
    for (row = 0; row < height; row++)
    {
        // ... and for each column within that row...
        for (col = 0; col < width; col++)
        {
            // ... draw an asterisk at the current row/column position
            printf("%c",
                   (col == 0 || col == width - 1 ||
                    row == 0 || row == height - 1
                    ? '*'
                    : ' '));
        }
        
        // Terminate each line with a newline
        printf("\n");
    }
    
    printf("\nAnd there you have it, folks: an unfilled box!\n\n");

    return 0;
}
