require("../Tester");

var program;
var test;

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "comparison operation: == (true)",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13C to global word 1
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "== uint uint",                   // R1 = R1 == R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "== uint uint",                   // R1 = R1 == R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "!= uint uint",                   // R1 = R1 != R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "!= uint uint",                   // R1 = R1 != R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "< uint uint",                    // R1 = R1 < R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "< uint uint",                    // R1 = R1 < R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13 to global word 1
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "< uint uint",                    // R1 = R1 < R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "<= uint uint",                   // R1 = R1 <= R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "<= uint uint",                   // R1 = R1 <= R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13 to global word 1
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "<= uint uint",                   // R1 = R1 <= R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "> uint uint",                    // R1 = R1 > R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "> uint uint",                    // R1 = R1 > R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13 to global word 1
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    "> uint uint",                    // R1 = R1 > R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    ">= uint uint",                   // R1 = R1 >= R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    ">= uint uint",                   // R1 = R1 >= R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
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
    "puti uint null GLOBAL(1) 0x13C", // assign 0x13 to global word 1
    "get uint uint GLOBAL(1)",        // retrieve global word 1 into R1
    "swap uint",                      // swap R1 into R2
    "get uint uint GLOBAL(0)",        // retrieve global word 0 into R1
    ">= uint uint",                   // R1 = R1 >= R2
    "put uint uint GLOBAL(2)",        // write R1 to global word 2
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(GLOBAL(2), "uint") === 0x1);
};

Tester.test(program, test);

