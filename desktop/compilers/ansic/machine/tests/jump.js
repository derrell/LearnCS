/**
 * Tests for jump operations
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
    "jump",

    "puti uint null GLOBAL(0) 0x1", // assign 0x1 to global word 0
    "jump null null 0x20",          // jump past next statement
    "puti uint null GLOBAL(0) 0x2", // assign 0x2 to global word 0
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "jump if true (true)",

    "puti uint null GLOBAL(0) 0x1", // assign 0x1 to global word 0
    "puti uint null GLOBAL(1) 0x1", // assign 0x1 to global word 0
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "jit null null 0x34",           // jump if true, past next statement
    "puti uint null GLOBAL(1) 0x2", // assign 0x2 to global word 0
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(1), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "jump if true (false)",

    "puti uint null GLOBAL(0) 0x0", // assign 0x0 to global word 0
    "puti uint null GLOBAL(1) 0x1", // assign 0x1 to global word 0
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "jit null null 0x34",           // jump if true, past next statement
    "puti uint null GLOBAL(1) 0x2", // assign 0x2 to global word 0
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(1), "uint") === 0x2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "jump if false (true)",

    "puti uint null GLOBAL(0) 0x0", // assign 0x0 to global word 0
    "puti uint null GLOBAL(1) 0x1", // assign 0x1 to global word 0
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "jit null null 0x34",           // jump if false, past next statement
    "puti uint null GLOBAL(1) 0x2", // assign 0x2 to global word 0
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(1), "uint") === 0x2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "jump if false (false)",

    "puti uint null GLOBAL(0) 0x1", // assign 0x1 to global word 0
    "puti uint null GLOBAL(1) 0x1", // assign 0x1 to global word 0
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "jit null null 0x34",           // jump if false, past next statement
    "puti uint null GLOBAL(1) 0x2", // assign 0x2 to global word 0
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(1), "uint") === 0x1);
};

Tester.test(program, test);

