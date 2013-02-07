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
    // Assign 8 to the first word in the globals&statics area
    [ "puti", "unsigned int", null, WORD(0), [ 8 ] ],
    
    // Assign 9 to the second word in the globals&statics area
    [ "puti", "unsigned int", null, WORD(1), [ 9 ] ],
    
    // Get the second word of globals&statics area into register R1
    [ "get", "unsigned int", "unsigned int", WORD(1)],

    // Swap R1 into R2
    [ "swap", "unsigned int" ],
    
    // Get the first word from globals&statics into register R1
    [ "get", "unsigned int", "unsigned int", WORD(0) ],
    
    // Add the values in R1 and R2, storing the result back into R1
    [ "+", "unsigned int", "unsigned int" ],
    
    // Store the result of the add into the third word of globals&statics
    [ "put", "unsigned int", "unsigned int", WORD(2) ],
    
    // Exit the program by jumping (unconditional) to adrress 0xffff
    [ "jump", null, null, 0xffff ]
  ];

// Assemble the program
program.forEach(
  function(instr, line)
  {
    var             args;
    var             pseudoop;
    var             op;
    
    // Make a copy of the program line, so we can prepend and append arguments
    args = instr.slice(0);
    
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
  });


mem.prettyPrint("Program memory: ", 0, addrInfo.addr);

// Run the program, beginning at address zero
machine.execute(0);

mem.prettyPrint("Globals & Statics: ",
                Memory.info.gas.start, Memory.info.gas.length);
