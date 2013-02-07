/**
 * Tests for logical operations
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
    "logical operation: && (both non-zero)",

    "puti uint null GLOBAL(0) 0x1", // assign 0x1 to global word 0
    "puti uint null GLOBAL(1) 0x2", // assign 0x2 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "&& uint uint",                 // R1 = R1 && R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x1 &&
          mem.get(GLOBAL(1), "uint") === 0x2 &&
          mem.get(GLOBAL(2), "uint") === 0x2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "logical operation: && (first zero)",

    "puti uint null GLOBAL(0) 0x0", // assign 0x0 to global word 0
    "puti uint null GLOBAL(1) 0x2", // assign 0x2 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "&& uint uint",                 // R1 = R1 && R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x0 &&
          mem.get(GLOBAL(1), "uint") === 0x2 &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "logical operation: && (second zero)",

    "puti uint null GLOBAL(0) 0x2", // assign 0x2 to global word 0
    "puti uint null GLOBAL(1) 0x0", // assign 0x0 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "&& uint uint",                 // R1 = R1 && R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x2 &&
          mem.get(GLOBAL(1), "uint") === 0x0 &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "logical operation: && (both zero)",

    "puti uint null GLOBAL(0) 0x0", // assign 0x0 to global word 0
    "puti uint null GLOBAL(1) 0x0", // assign 0x0 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "&& uint uint",                 // R1 = R1 && R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x0 &&
          mem.get(GLOBAL(1), "uint") === 0x0 &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "logical operation: || (both non-zero)",

    "puti uint null GLOBAL(0) 0x2", // assign 0x2 to global word 0
    "puti uint null GLOBAL(1) 0x1", // assign 0x1 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "|| uint uint",                 // R1 = R1 || R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x2 &&
          mem.get(GLOBAL(1), "uint") === 0x1 &&
          mem.get(GLOBAL(2), "uint") === 0x2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "logical operation: || (first zero)",

    "puti uint null GLOBAL(0) 0x0", // assign 0x0 to global word 0
    "puti uint null GLOBAL(1) 0x2", // assign 0x2 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "|| uint uint",                 // R1 = R1 || R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x0 &&
          mem.get(GLOBAL(1), "uint") === 0x2 &&
          mem.get(GLOBAL(2), "uint") === 0x2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "logical operation: || (second zero)",

    "puti uint null GLOBAL(0) 0x2", // assign 0x2 to global word 0
    "puti uint null GLOBAL(1) 0x0", // assign 0x0 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "|| uint uint",                 // R1 = R1 || R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x2 &&
          mem.get(GLOBAL(1), "uint") === 0x0 &&
          mem.get(GLOBAL(2), "uint") === 0x2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "logical operation: || (both zero)",

    "puti uint null GLOBAL(0) 0x0", // assign 0x0 to global word 0
    "puti uint null GLOBAL(1) 0x0", // assign 0x0 to global word 1
    "get uint uint GLOBAL(1)",      // retrieve global word 1 into R1
    "swap uint",                    // swap R1 into R2
    "get uint uint GLOBAL(0)",      // retrieve global word 0 into R1
    "|| uint uint",                 // R1 = R1 || R2
    "put uint uint GLOBAL(2)",      // write R1 to global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x0 &&
          mem.get(GLOBAL(1), "uint") === 0x0 &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

