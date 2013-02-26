/**
 * Tests for integer arithmetic operations
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
    "unsigned int add",

    "puti uint null GLOBAL(0) 9", // assign 9 to global word 0
    "puti uint null GLOBAL(1) 7", // assign 7 to global word 1
    "epush uint null GLOBAL(0)",  // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",  // push global word 1 onto the estack
    "+ uint uint",                // epush(epop() + epop())
    "epop uint null GLOBAL(2)",   // pop estack into global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 9 &&
          mem.get(GLOBAL(1), "uint") === 7 &&
          mem.get(GLOBAL(2), "uint") === 16);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "unsigned int subtract",

    "puti uint null GLOBAL(0) 9", // assign 9 to global word 0
    "puti uint null GLOBAL(1) 7", // assign 7 to global word 1
    "epush uint null GLOBAL(0)",  // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",  // push global word 1 onto the estack
    "- uint uint",                // epush(epop() - epop())
    "epop uint null GLOBAL(2)",   // pop estack into global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 9 &&
          mem.get(GLOBAL(1), "uint") === 7 &&
          mem.get(GLOBAL(2), "uint") === 2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "unsigned int multiply",

    "puti uint null GLOBAL(0) 7", // assign 7 to global word 0
    "puti uint null GLOBAL(1) 9", // assign 9 to global word 1
    "epush uint null GLOBAL(0)",  // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",  // push global word 1 onto the estack
    "* uint uint",                // epush(epop() * epop())
    "epop uint null GLOBAL(2)",   // pop estack into global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 7 &&
          mem.get(GLOBAL(1), "uint") === 9 &&
          mem.get(GLOBAL(2), "uint") === 63);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "unsigned int divide",

    "puti uint null GLOBAL(0) 7", // assign 7 to global word 0
    "puti uint null GLOBAL(1) 3", // assign 3 to global word 1
    "epush uint null GLOBAL(0)",  // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",  // push global word 1 onto the estack
    "/ uint uint",                // epush(epop() / epop())
    "epop uint null GLOBAL(2)",   // pop estack into global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 7 &&
          mem.get(GLOBAL(1), "uint") === 3 &&
          mem.get(GLOBAL(2), "uint") === 2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "unsigned int mod",

    "puti uint null GLOBAL(0) 7", // assign 7 to global word 0
    "puti uint null GLOBAL(1) 3", // assign 3 to global word 1
    "epush uint null GLOBAL(0)",  // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",  // push global word 1 onto the estack
    "% uint uint",                // epush(epop() % epop())
    "epop uint null GLOBAL(2)",   // pop estack into global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 7 &&
          mem.get(GLOBAL(1), "uint") === 3 &&
          mem.get(GLOBAL(2), "uint") === 1);
};

Tester.test(program, test);

