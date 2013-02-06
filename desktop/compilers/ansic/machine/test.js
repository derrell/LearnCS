var sys = require("sys");
var Memory = require("./Memory");
var Instr = require("./Instruction");

var nextAddr;
var mem = Memory.getInstance();
var addrInfo;

mem.prettyPrint("Initial mem: ",
                Memory.info.prog.start, Memory.info.prog.length);


addrInfo =
  {
    addr : 0
  };


// Store an immediate value in the first word in the globals&statics area
Instr.write(
  addrInfo, 23, "memory", 0x01, 0x05, null, 
  Memory.info.gas.start, [ 42 ]);

// Store an immediate value in the second word in the globals&statics area
Instr.write(
  addrInfo, 24, "memory", 0x01, 0x05, null,
  Memory.info.gas.start + Memory.WORDSIZE, [ 23 ]);

// Retrieve the second word of globals&statics area into register R1
Instr.write(
  addrInfo, 25, "memory", 0x02, 0x05, 0x05, Memory.info.gas.start);

// Swap R1 into R2
Instr.write(addrInfo, 26, "memory", 0x05, null, null, null);

// Retrieve the first word of globals&statics area into register R1
Instr.write(
  addrInfo, 27, "memory", 0x02, 0x05, 0x05, Memory.info.gas.start);

// Add the values in R1 and R2, storing the result back into R1
Instr.write(addrInfo, 28, "binaryOp", 0x0d, 0x05, 0x05, null);

// Exit the program by jumping (unconditional) to adrress 0xffff
Instr.write(addrInfo, 29, "jumpConditionally", 0x00, 0xffff);

mem.prettyPrint("After adding instruction: ",
                Memory.info.prog.start, Memory.info.prog.length);
