#include <stdio.h>
#include <stdlib.h>


int main(void)
{
    // Currently there is no argument validation for built-in functions. This
    // could be accomplished in any of three ways:
    //
    // 1. In each built-in function, valiliate number and types of variables
    //
    // 2. In the include() function, add a validate function to each entry of
    // the array (in addition to info and func), pass that validate function
    // to declarator.setBuiltin(), and call the validation function when the
    // built-in function is called.
    //
    // 3. Ultimately, implement a proper AST node wrapper around builtins,
    // which will allow them to be validated as with any non-builtin
    // function. (This, too, requires adding something to the array of
    // functions, so that the AST and symbol table entries can be built
    // correctly.)

    srand();
    return 0;
}
