var qx = require("qooxdoo");
var sys = require("sys");
require("./Memory");
require("./Instruction");
require("./Machine");

qx.Class.define("Tester",
{
  extend : qx.core.Object,
  
  statics :
  {
    test : function(program, testSuccess)
    {
      var             name;
      var             Memory = learncs.machine.Memory;
      var             Machine = learncs.machine.Machine;
      var             Instr = learncs.machine.Instruction;
      var             mem = Memory.getInstance();
      var             machine = Machine.getInstance();
      var             addrInfo;
      var             bSuccess;
      var GLOBAL = function(index)
      {
        return (Memory.info.gas.start + (Memory.WORDSIZE * index));
      };

      // Reinitialize the machine and memory
      learncs.machine.Memory.getInstance().initAll();
      learncs.machine.Machine.getInstance().initAll();

      // Initialize address info. It is updated by Instr.write()
      addrInfo =
        {
          addr : 0
        };

      // Assemble the program
      program.forEach(
        function(instr, line)
        {
          // The first line of the program is its name
          if (! name)
          {
            name = instr;
            return;
          }
          Instr.write(instr, addrInfo, line);
        });

      if (true)
      {
        mem.prettyPrint("Program memory", 
                        Memory.info.prog.start,
                        Memory.info.prog.length);
      }

      // Run the program, beginning at address zero
      machine.execute(0);

      // Display success or failure
      bSuccess = testSuccess(mem, GLOBAL);
      console.log((bSuccess ? "passed" : "FAILED") + ": " + name);
      
      if (! bSuccess)
      {
        mem.prettyPrint("Failed test", 
                        Memory.info.gas.start,
                        Memory.info.gas.length);
      }
    }
  }
});
