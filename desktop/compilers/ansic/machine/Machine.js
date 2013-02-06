/**
 * The virtual machine, and facilities for executing statements thereon
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var sys = require("sys");
var Memory = require("./Memory");
var Instruction = require("./Instruction");

var mem = Memory.getInstance();


function Machine()
{
  // Initialize the registers
  mem.setReg("PC", 
             "unsigned int",
             0);
  mem.setReg("SP", 
             "unsigned int",
             Memory.info.rts.start + Memory.info.rts.length);
  mem.setReg("FP", 
             "unsigned int",
             Memory.info.rts.start + Memory.info.rts.length);
}

Machine.prototype.execute = function()
{
  var             pc;
  var             instr;
  var             instrAddr;
  var             opcode;
  var             numDataWords;
  var             debugInfo;

  try
  {
    for (;;)
    {
      // Get the program counter value
      pc = mem.getReg("PC", "unsigned int");

      // Retrieve an instruction from that address
      instr = mem.get(pc, "unsigned int");

      // The high-order three bits determine the primary opcode
      opcode = instr >>> 29;
      
      // Retrieve the debug info that immediately follows the instruction
      debugInfo = mem.get(pc + Memory.WORDSIZE, "unsigned int");
      
      // Determine how many extra words this instruction uses
      numDataWords = debugInfo >>> 29;

      // Save the address from which we retrieved this instruction
      instrAddr = pc;
      
      // Update the program counter. It is incremented by 1 word for the
      // instruction itself, plus 1 word for the debug info, plus however many
      // extra words this instruction requires.
      pc += Memory.WORDSIZE * (2 + numDataWords);

      // Save the new program counter now. It may get altered when we process
      // the instruction.
      mem.setReg("PC", "unsigned int", pc);

      // Call the appropriate function to process this reuqest
      Instruction.processOpcode[opcode](instr, instrAddr);
    }
  }
  catch (e)
  {
    sys.print("Program halted: " + e + "\n\n");
  }
}

// This is a singleton. Export its getInstance() method.
var singleton;
exports.getInstance = function()
{
  // If we haven't yet generated the singleton instance of memory...
  if (! singleton)
  {
    // ... then do so now.
    singleton = new Machine();
  }

  // Return that singleton.
  return singleton;
};

