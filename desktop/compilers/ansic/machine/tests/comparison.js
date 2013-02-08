/**
 * Tests for comparison operations
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
    "comparison operation: == (true)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "== uint uint",                   // epush(epop() == epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: == (false)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x12C", // assign 0x12C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "== uint uint",                   // epush(epop() == epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x12C &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: != (true)",

    "puti uint null GLOBAL(0) 0x12C", // assign 0x12C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "!= uint uint",                   // epush(epop() != epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x12C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: != (false)",

    "puti uint null GLOBAL(0) 0x12C", // assign 0x12C to global word 0
    "puti uint null GLOBAL(1) 0x12C", // assign 0x12C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "!= uint uint",                   // epush(epop() != epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x12C &&
          mem.get(GLOBAL(1), "uint") === 0x12C &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: < (true)",

    "puti uint null GLOBAL(0) 0x12C", // assign 0x12C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "< uint uint",                    // epush(epop() < epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x12C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: < (false different)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x12C", // assign 0x12C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "< uint uint",                    // epush(epop() < epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x12C &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: < (false same)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "< uint uint",                    // epush(epop() < epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: <= (true different)",

    "puti uint null GLOBAL(0) 0x12C", // assign 0x12C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "<= uint uint",                   // epush(epop() <= epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x12C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: <= (false different)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x12C", // assign 0x12C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "<= uint uint",                   // epush(epop() <= epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x12C &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: <= (true same)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "<= uint uint",                   // epush(epop() <= epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: > (true)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x12C", // assign 0x12C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "> uint uint",                    // epush(epop() > epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x12C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: > (false different)",

    "puti uint null GLOBAL(0) 0x12C", // assign 0x12C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "> uint uint",                    // epush(epop() > epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x12C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: > (false same)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    "> uint uint",                    // epush(epop() > epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: >= (true different)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x12C", // assign 0x12C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    ">= uint uint",                   // epush(epop() >= epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x12C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: >= (false different)",

    "puti uint null GLOBAL(0) 0x12C", // assign 0x12C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    ">= uint uint",                   // epush(epop() >= epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x12C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x0);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: >= (true same)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "epush uint null GLOBAL(0)",      // push global word 0 onto the estack
    "epush uint null GLOBAL(1)",      // push global word 1 onto the estack
    ">= uint uint",                   // epush(epop() >= epop())
    "epop uint null GLOBAL(2)",       // pop estack into global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

