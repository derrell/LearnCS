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
    "epush uint null GLOBAL(0)",    // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",    // push global word 1 onto the estack
    "&& uint uint",                 // epush(epop() && epop())
    "epop uint null GLOBAL(2)",     // pop estack into global word 2
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
    "epush uint null GLOBAL(0)",    // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",    // push global word 1 onto the estack
    "&& uint uint",                 // epush(epop() && epop())
    "epop uint null GLOBAL(2)",     // pop estack into global word 2
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
    "epush uint null GLOBAL(0)",    // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",    // push global word 1 onto the estack
    "&& uint uint",                 // epush(epop() && epop())
    "epop uint null GLOBAL(2)",     // pop estack into global word 2
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
    "epush uint null GLOBAL(0)",    // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",    // push global word 1 onto the estack
    "&& uint uint",                 // epush(epop() && epop())
    "epop uint null GLOBAL(2)",     // pop estack into global word 2
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
    "epush uint null GLOBAL(0)",    // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",    // push global word 1 onto the estack
    "|| uint uint",                 // epush(epop() || epop())
    "epop uint null GLOBAL(2)",     // pop estack into global word 2
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
    "epush uint null GLOBAL(0)",    // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",    // push global word 1 onto the estack
    "|| uint uint",                 // epush(epop() || epop())
    "epop uint null GLOBAL(2)",     // pop estack into global word 2
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
    "epush uint null GLOBAL(0)",    // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",    // push global word 1 onto the estack
    "|| uint uint",                 // epush(epop() || epop())
    "epop uint null GLOBAL(2)",     // pop estack into global word 2
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
    "epush uint null GLOBAL(0)",    // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",    // push global word 1 onto the estack
    "|| uint uint",                 // epush(epop() || epop())
    "epop uint null GLOBAL(2)",     // pop estack into global word 2
    "jump null null 0xffff"         // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x0 &&
          mem.get(GLOBAL(1), "uint") === 0x0 &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

