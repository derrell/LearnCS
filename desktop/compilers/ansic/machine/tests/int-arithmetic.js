require("../Tester");

var program;
var test;

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "unsigned int add",

    "puti uint null GLOBAL(0) 9", // assign 9 to global word 0
    "puti uint null GLOBAL(1) 7", // assign 7 to global word 1
    "get uint uint GLOBAL(1)",    // retrieve global word 1 into R1
    "swap uint",                  // swap R1 into R2
    "get uint uint GLOBAL(0)",    // retrieve global word 0 into R1
    "+ uint uint",                // R1 = R1 + R2
    "put uint uint GLOBAL(2)",    // write R1 to global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") == 9 &&
          mem.get(GLOBAL(1), "uint") == 7 &&
          mem.get(GLOBAL(2), "uint") == 16);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "unsigned int subtract",

    "puti uint null GLOBAL(0) 9", // assign 9 to global word 0
    "puti uint null GLOBAL(1) 7", // assign 7 to global word 1
    "get uint uint GLOBAL(1)",    // retrieve global word 1 into R1
    "swap uint",                  // swap R1 into R2
    "get uint uint GLOBAL(0)",    // retrieve global word 0 into R1
    "- uint uint",                // R1 = R1 - R2
    "put uint uint GLOBAL(2)",    // write R1 to global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") == 9 &&
          mem.get(GLOBAL(1), "uint") == 7 &&
          mem.get(GLOBAL(2), "uint") == 2);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "unsigned int multiply",

    "puti uint null GLOBAL(0) 7", // assign 7 to global word 0
    "puti uint null GLOBAL(1) 9", // assign 9 to global word 1
    "get uint uint GLOBAL(1)",    // retrieve global word 1 into R1
    "swap uint",                  // swap R1 into R2
    "get uint uint GLOBAL(0)",    // retrieve global word 0 into R1
    "* uint uint",                // R1 = R1 * R2
    "put uint uint GLOBAL(2)",    // write R1 to global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") == 7 &&
          mem.get(GLOBAL(1), "uint") == 9 &&
          mem.get(GLOBAL(2), "uint") == 63);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "unsigned int divide",

    "puti uint null GLOBAL(0) 7", // assign 7 to global word 0
    "puti uint null GLOBAL(1) 3", // assign 3 to global word 1
    "get uint uint GLOBAL(1)",    // retrieve global word 1 into R1
    "swap uint",                  // swap R1 into R2
    "get uint uint GLOBAL(0)",    // retrieve global word 0 into R1
    "/ uint uint",                // R1 = R1 * R2
    "put uint uint GLOBAL(2)",    // write R1 to global word 2
    "jump null null 0xffff"       // exit
  ];

test = function(mem, GLOBAL)
{
  return (mem.get(GLOBAL(0), "uint") == 7 &&
          mem.get(GLOBAL(1), "uint") == 3 &&
          mem.get(GLOBAL(2), "uint") == 2);
};

Tester.test(program, test);

