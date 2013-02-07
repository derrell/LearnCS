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


var pseudoops =
  {
    ">>"   : [ "binaryOp", 0x00 ],
    "<<"   : [ "binaryOp", 0x01 ],
    "&&"   : [ "binaryOp", 0x02 ],
    "||"   : [ "binaryOp", 0x03 ],
    ">"    : [ "binaryOp", 0x04 ],
    "<="   : [ "binaryOp", 0x05 ],
    "=="   : [ "binaryOp", 0x06 ],
    "!="   : [ "binaryOp", 0x07 ],
    ">="   : [ "binaryOp", 0x08 ],
    ">"    : [ "binaryOp", 0x09 ],
    "&"    : [ "binaryOp", 0x0A ],
    "|"    : [ "binaryOp", 0x0B ],
    "^"    : [ "binaryOp", 0x0C ],
    "+"    : [ "binaryOp", 0x0D ],
    "-"    : [ "binaryOp", 0x0E ],
    "*"    : [ "binaryOp", 0x0F ],
    "/"    : [ "binaryOp", 0x10 ],
    "%"    : [ "binaryOp", 0x11 ],

    "~"    : [ "unaryOp", 0x00 ],
    "!"    : [ "unaryOp", 0x01 ],
    "cast" : [ "unaryOp", 0x02 ],
    "test" : [ "unaryOp", 0x03 ],

    "jump" : [ "jumpConditionally", 0x00 ],
    "jit"  : [ "jumpConditionally", 0x01 ],
    
    "put"  : [ "memory", 0x00 ],
    "puti" : [ "memory", 0x01 ],
    "get"  : [ "memory", 0x02 ],
    "push" : [ "memory", 0x03 ],
    "pop"  : [ "memory", 0x04 ],
    "swap" : [ "memory", 0x05 ],
    
    "call" : [ "functionOp", 0x00 ],
    "ret"  : [ "functionOp", 0x01 ]
  };

var globals = Memory.info.gas.start;

var program =
  [
    // Assign 8 to the first word in the globals&statics area
    [ "puti", "unsigned int", null, globals + Memory.WORDSIZE * 0, [ 8 ] ],
    
    // Assign 9 to the second word in the globals&statics area
    [ "puti", "unsigned int", null, globals + Memory.WORDSIZE * 1, [ 9 ] ],
    
    // Get the second word of globals&statics area into register R1
    [ "get", "unsigned int", "unsigned int", globals + Memory.WORDSIZE * 1],

    // Swap R1 into R2
    [ "swap", "unsigned int" ],
    
    // Get the first word from globals&statics into register R1
    [ "get", "unsigned int", "unsigned int", globals + Memory.WORDSIZE * 0 ],
    
    // Add the values in R1 and R2, storing the result back into R1
    [ "+", "unsigned int", "unsigned int" ],
    
    // Store the result of the add into the third word of globals&statics
    [ "put", "unsigned int", "unsigned int", globals + Memory.WORDSIZE * 2 ],
    
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
    
    // Retrieve the pseudo operation
    pseudoop = args.shift();
    
    // Convert the pseudo operation into its opcode and subcode parts
    op = pseudoops[pseudoop];
    
    // Ensure it exists
    if (! op)
    {
      throw new Error("Program error at line " + line +
                      ": no such operation: " + pseudoop);
    }
    
    // Prepend the subcode and then the opcode
    args.unshift(op[1]);
    args.unshift(op[0]);

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
