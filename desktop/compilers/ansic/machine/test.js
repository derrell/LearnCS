var qx = require("qooxdoo");
var sys = require("sys");
require("./Memory");
require("./Instruction");
require("./Machine");

// Get quick access to classes
var Memory = learncs.machine.Memory;
var Machine = learncs.machine.Machine;
var Instr = learncs.machine.Instruction;

// Get singleton instances
var mem = Memory.getInstance();
var machine = Machine.getInstance();

// Local variables
var nextAddr;
var addrInfo;

addrInfo =
  {
    addr : 0
  };


function WORD(index)
{
  return Memory.info.gas.start + (Memory.WORDSIZE * index);
}

var program =
  [
    "puti uint null WORD(0) 8", // assign 8 to word 0
    "puti uint null WORD(1) 9", // assign 9 to word 1
    "get uint uint WORD(1)",    // retrieve word 1 into R1
    "swap uint",                // swap R1 into R2
    "get uint uint WORD(0)",    // retrieve word 0 into R1
    "+ uint uint",              // R1 = R1 + R2
    "put uint uint WORD(2)",    // write R1 to word 2
    "jump null null 0xffff"     // exit
  ];


// Assemble the program
program.forEach(
  function(instr, line)
  {
    Instr.write(instr, addrInfo, line);
  });


mem.prettyPrint("Program memory: ", 0, addrInfo.addr);

// Run the program, beginning at address zero
machine.execute(0);

mem.prettyPrint("Globals & Statics: ",
                Memory.info.gas.start, Memory.info.gas.length);
