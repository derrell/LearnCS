/**
 * The virtual machine, and facilities for executing instructions thereon
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
#ignore(require)
#ignore(qx.bConsole)
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 * @lint ignoreUndefined(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
  qx.bConsole = true;
  require("./Memory");
  require("./Instruction");
}


qx.Class.define("playground.c.machine.Machine",
{
  type      : "singleton",
  extend    : qx.core.Object,

  construct : function()
  {
    this.base(arguments);

    // Initialize the machine
    this.initAll();
  },
  
  members :
  {
    initAll : function()
    {
      var             Memory = playground.c.machine.Memory;
      var             mem = playground.c.machine.Machine.mem;

      // Initialize the registers
      mem.setReg("PC", 
                 "unsigned int",
                 0);
      mem.setReg("SP", 
                 "unsigned int",
                 Memory.info.rts.start + Memory.info.rts.length);
      mem.setReg("ESP", 
                 "unsigned int",
                 Memory.info.es.start + Memory.info.es.length);
      mem.setReg("FP", 
                 "unsigned int",
                 Memory.info.rts.start + Memory.info.rts.length);
    },

    /**
     * Execute a program in virtual memory.
     * 
     * @param pc {Number}
     *   The initial program counter value, i.e., the instruction address at
     *   which to begin the program.
     */
    execute : function(pc)
    {
      var             instr;
      var             instrAddr;
      var             opcode;
      var             numDataWords;
      var             debugInfo;
      var             Memory = playground.c.machine.Memory;
      var             mem = playground.c.machine.Machine.mem;

      // Initialize the program counter
      mem.setReg("PC", "unsigned int", pc);

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
          numDataWords = debugInfo >>> 24;

          // Save the address from which we retrieved this instruction
          instrAddr = pc;

          // Update the program counter. It is incremented by 1 word for the
          // instruction itself, plus 1 word for the debug info, plus however
          // many extra words this instruction requires.
          pc += Memory.WORDSIZE * (2 + numDataWords);

          // Save the new program counter now. It may get altered when we
          // process the instruction.
          mem.setReg("PC", "unsigned int", pc);

          // Call the appropriate function to process this reuqest
//          this.__displayInstruction(instr);
          playground.c.machine.Instruction.processOpcode[opcode](instr, instrAddr);
        }
      }
      catch (e)
      {
        if (e.toString().match(/Normal program exit/))
        {
          if (false)
          {
            console.log("Exit code: " + 
                        mem.getReg("R1", "unsigned char").toString(16));
          }
        }
        else
        {
          console.log("Program halted: " + e + "\n" + e.stack);
        }
      }
    },
    
    __displayInstruction : function(instr)
    {
      var             p;
      var             parts;
      
      p = "00000000000000000000000000000000" + instr.toString(2);
      p = p.substr(-32);
      
      parts = /(\d{3})(\d{5})(\d{4})(\d{4})(\d{16})/.exec(p);
      parts.shift();
      
      console.log(parts.join(" "));
    }
  },
  
  defer : function(statics)
  {
    statics.mem = playground.c.machine.Memory.getInstance();
  }
});
