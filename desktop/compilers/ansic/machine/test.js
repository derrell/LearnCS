var qx = require("qooxdoo");
var sys = require("sys");
require("./Memory");
require("./Instruction");
require("./Machine");

// Get quick access to classes
var Memory = csthinker.machine.Memory;
var Machine = csthinker.machine.Machine;
var Instr = csthinker.machine.Instruction;

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


// Store an immediate value in the first word in the globals&statics area
Instr.write(
  addrInfo, 23, "memory", 0x01, 0x05, null, 
  Memory.info.gas.start, [ 8 ]);

// Store an immediate value in the second word in the globals&statics area
Instr.write(
  addrInfo, 24, "memory", 0x01, 0x05, null,
  Memory.info.gas.start + Memory.WORDSIZE, [ 9 ]);

// Retrieve the second word of globals&statics area into register R1
Instr.write(
  addrInfo, 25, "memory", 0x02, 0x05, 0x05, 
  Memory.info.gas.start + Memory.WORDSIZE * 1 );

// Swap R1 into R2
Instr.write(addrInfo, 26, "memory", 0x05, null, null, null);

// Retrieve the first word of globals&statics area into register R1
Instr.write(
  addrInfo, 27, "memory", 0x02, 0x05, 0x05, Memory.info.gas.start);

// Add the values in R1 and R2, storing the result back into R1
Instr.write(addrInfo, 28, "binaryOp", 0x0d, 0x05, 0x05, null);

// Write register R1 to the third word of the globals&statics area
Instr.write(
  addrInfo, 27, "memory", 0x00, 0x05, 0x05, 
  Memory.info.gas.start + Memory.WORDSIZE * 2);

// Exit the program by jumping (unconditional) to adrress 0xffff
Instr.write(addrInfo, 29, "jumpConditionally", 0x00, null, null, 0xffff);

mem.prettyPrint("Program memory: ", 0, addrInfo.addr);

machine.execute();

mem.prettyPrint("Globals & Statics: ",
                Memory.info.gas.start, Memory.info.gas.length);
