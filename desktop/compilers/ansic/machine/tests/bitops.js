/**
 * Tests for bit operations
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
    "bit operation: | small numbers",

    "puti uint null GLOBAL(0) 0x1", // assign 0x1 to global word 0
    "puti uint null GLOBAL(1) 0x2", // assign 0x2 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "| uint uint",                  // R1 = R1 | R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x1 &&
          mem.get(GLOBAL(1), "uint") === 0x2 &&
          mem.get(GLOBAL(2), "uint") === 0x3);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "bit operation: | large numbers",

    "puti uint null GLOBAL(0) 0xf7ffffff", // assign 9 to global word 0
    "puti uint null GLOBAL(1) 0xfeffffff", // assign 7 to global word 1
    "get uint uint GLOBAL(1)",             // retrieve global word 1 into R1
    "swap uint",                           // swap R1 into R2
    "get uint uint GLOBAL(0)",             // retrieve global word 0 into R1
    "| uint uint",                         // R1 = R1 | R2
    "put uint uint GLOBAL(2)",             // write R1 to global word 2
    "jump null null 0xffff"                // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0xf7ffffff &&
          mem.get(GLOBAL(1), "uint") === 0xfeffffff &&
          mem.get(GLOBAL(2), "uint") === 0xffffffff);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "bit operation: &",

    "puti uint null GLOBAL(0) 0x07", // assign 0x07 to global word 0
    "puti uint null GLOBAL(1) 0x3C", // assign 0x3C to global word 1
    "get uint uint GLOBAL(1)",       // retrieve global word 1 into R1
    "swap uint",                     // swap R1 into R2
    "get uint uint GLOBAL(0)",       // retrieve global word 0 into R1
    "& uint uint",                   // R1 = R1 & R2
    "put uint uint GLOBAL(2)",       // write R1 to global word 2
    "jump null null 0xffff"          // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x07 &&
          mem.get(GLOBAL(1), "uint") === 0x3C &&
          mem.get(GLOBAL(2), "uint") === 0x04);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "bit operation: ^",

    "puti uint null GLOBAL(0) 0x07", // assign 0x07 to global word 0
    "puti uint null GLOBAL(1) 0x3C", // assign 0x3C to global word 1
    "get uint uint GLOBAL(1)",       // retrieve global word 1 into R1
    "swap uint",                     // swap R1 into R2
    "get uint uint GLOBAL(0)",       // retrieve global word 0 into R1
    "^ uint uint",                   // R1 = R1 ^ R2
    "put uint uint GLOBAL(2)",       // write R1 to global word 2
    "jump null null 0xffff"          // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x07 &&
          mem.get(GLOBAL(1), "uint") === 0x3C &&
          mem.get(GLOBAL(2), "uint") === 0x3b);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "bit operation: ~",

    "puti uint null GLOBAL(0) 0xfffffff8", // assign 0xfffffff8 to global word 0
    "get uint uint GLOBAL(0)",             // retrieve global word 0 into R1
    "~ uint",                              // R1 = ~R1
    "put uint uint GLOBAL(2)",             // write R1 to global word 2
    "jump null null 0xffff"                // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0xfffffff8 &&
          mem.get(GLOBAL(2), "uint") === 0x07);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "bit operation: <<",

    "puti uint null GLOBAL(0) 0x07", // assign 0x07 to global word 0
    "puti uint null GLOBAL(1) 0x02", // assign 0x02 to global word 1
    "get uint uint GLOBAL(1)",       // retrieve global word 1 into R1
    "swap uint",                     // swap R1 into R2
    "get uint uint GLOBAL(0)",       // retrieve global word 0 into R1
    "<< uint uint",                   // R1 = R1 << R2
    "put uint uint GLOBAL(2)",       // write R1 to global word 2
    "jump null null 0xffff"          // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x07 &&
          mem.get(GLOBAL(1), "uint") === 0x02 &&
          mem.get(GLOBAL(2), "uint") === 0x1C);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "bit operation: >>",

    "puti uint null GLOBAL(0) 0x1C", // assign 0x1C to global word 0
    "puti uint null GLOBAL(1) 0x02", // assign 0x02 to global word 1
    "get uint uint GLOBAL(1)",       // retrieve global word 1 into R1
    "swap uint",                     // swap R1 into R2
    "get uint uint GLOBAL(0)",       // retrieve global word 0 into R1
    ">> uint uint",                   // R1 = R1 >> R2
    "put uint uint GLOBAL(2)",       // write R1 to global word 2
    "jump null null 0xffff"          // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x1C &&
          mem.get(GLOBAL(1), "uint") === 0x02 &&
          mem.get(GLOBAL(2), "uint") === 0x07);
};

Tester.test(program, test);

