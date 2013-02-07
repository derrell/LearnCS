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
/*
    var             args;
    var             pseudoop;
    var             op;
    var             data;
    
    // Make a copy of the program line, so we can prepend and append arguments
    args = instr.split(" ");
    
    // If there's an address provided...
    if (args.length > 3)
    {
      // ... then evaluate it. It may be a function call.
      if (! args[3].match(/^WORD[(]|[0-9]/))
      {
        throw new Error("Line " + line + ": " +
                        "Illegal address specified (" + instr + ")");
      }
      args[3] = eval(args[3]);
    }
    
    // Convert any arguments after the address into a data array, remove those
    // elements from the arguments array, and then add the data array onto the
    // end of the arguments.
    if (args.length > 4)
    {
      data = args.slice(4);
      args = args.slice(0, 4);
      args.push(data);
    }
    
    // Prepend the line number and the address info reference
    args.unshift(line);
    args.unshift(addrInfo);
    
    // Append nulls to fill in the required arguments to Instr.write()
    while (args.length < 7)
    {
      args.push(null);
    }
    
    // Assemble this instruction
    Instr.write.apply(Instr, args);
*/
    Instr.write(instr, addrInfo, line);
  });


mem.prettyPrint("Program memory: ", 0, addrInfo.addr);

// Run the program, beginning at address zero
machine.execute(0);

mem.prettyPrint("Globals & Statics: ",
                Memory.info.gas.start, Memory.info.gas.length);
