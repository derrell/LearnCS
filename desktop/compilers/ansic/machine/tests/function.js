/**
 * Tests for function call and return operations
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

require("../Tester");

var program;
var test;

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "function call/return",

    "puti uint null GLOBAL(0) 0x1", // assign 0x1 to global word 0
    "call null null 0x3C",          // Call the function at 0x30
    "puti uint null GLOBAL(1) 0x23",// assign exit code 0x23 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "puti uint null GLOBAL(1) 0x07",// assign exit code 0x07 to global word 1
    "jump null null 0xffff",        // exit

    "puti uint null GLOBAL(0) 0x2", // assign 0x2 to global word 0
    "ret",                          // return from function
    "puti uint null GLOBAL(2) 0x42",// assign exit code 0x42 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(1), "uint") === 0x07);
  return (mem.get(GLOBAL(2), "uint") === 0x42);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "function call/return",

    "puti uint null GLOBAL(0) 0x1", // assign 0x1 to global word 0
    "@newAR",                       // create a new activation record
    "push uint null GLOBAL(0)",     // push global word 0 onto the stack
    "@param foo -4 uint",           // pushed param foo, offset -4, size uint
    "push uint null GLOBAL(0)",     // push global word 0 onto the stack
    "@param bar -8 uint",           // pushed param bar, offset -8, size uint
    "@returnTo 3",                  // return to line 3
    "call null null 0x4C",          // Call the function
    "@popAR",                       // destroy the activation record
    "puti uint null GLOBAL(1) 0x23",// assign exit code 0x23 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "puti uint null GLOBAL(1) 0x07",// assign exit code 0x07 to global word 1
    "jump null null 0xffff",        // exit

    "@auto baz 0 uint",             // auto variable baz, offset 0, size uint
    "puti uint null GLOBAL(0) 0x2", // assign 0x2 to global word 0
    "ret",                          // return from function
    "puti uint null GLOBAL(2) 0x42",// assign exit code 0x42 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(1), "uint") === 0x07);
  return (mem.get(GLOBAL(2), "uint") === 0x42);
};

Tester.test(program, test);

