/**
 * Process the abstract syntax tree
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

require("./lib/Symtab.js");
require("./lib/Node.js");
require("./machine/Memory.js");
require("./machine/Machine.js");

qx.Class.define("learncs.AbstractSyntaxTree",
{
  extend : Object,
  
  statics :
  {
    process : function(root)
    {
      var sp;
      var data = {};
      var symtab;
      var machine;
      var Memory = learncs.machine.Memory;
      var bDebug = false;

      // Initialize memory
      Memory.getInstance().initAll();

      // Correct line numbers
      root.fixLineNumbers();

      if (bDebug)
      {
        // Display the abstract syntax tree
        root.display();

        // Display the symbol table
        learncs.lib.Symtab.display();
      }

      // Reset the symbol table to a clean state
      learncs.lib.Symtab.reset();

      // Re-create the root-level symbol table
      new learncs.lib.Symtab(null, null, 0);

      // Initialize the machine singleton, which initializes the registers
      machine = learncs.machine.Machine.getInstance();

      // Process the abstract syntax tree to create symbol tables
      root.process(data, false);

      if (bDebug)
      {
        sys.print("\n\nAfter processing...");
        learncs.lib.Symtab.display();
      }

      // Process the abstract syntax tree from the entry point, if it exists,
      // to run the program
      if (learncs.lib.Node.entryNode)
      {
        // Prepare to call main(). Reset the machine.
        machine.initAll();

        // Save the stack pointer, so we can restore it after the function call
        sp = learncs.lib.Node.__mem.getReg("SP", "unsigned int");

        // Push argv and argc onto the stack
        learncs.lib.Node.__mem.stackPush("pointer", 0xeeeeeeee);
        learncs.lib.Node.__mem.stackPush("unsigned int", 0xdddddddd);

        // Retrieve the symbol table for main()
        symtab = learncs.lib.Node.entryNode._symtab;

        // Save the new frame pointer
        symtab.setFramePointer(
          learncs.lib.Node.__mem.getReg("SP", "unsigned int"));

        // Push the return address (our current line number) onto the stack
        learncs.lib.Node.__mem.stackPush("unsigned int", 0xcccccccc);

        // Process main()
        learncs.lib.Node.entryNode.process(data, true);

        // Restore the previous frame pointer
        symtab.restoreFramePointer();

        // Restore the stack pointer
        learncs.lib.Node.__mem.setReg("SP", "unsigned int", sp);
      }
      else
      {
        sys.print("Missing main() function\n");
      } 

      learncs.machine.Memory.getInstance().prettyPrint(
        "Globals",
        Memory.info.gas.start,
        Memory.info.gas.length);

      learncs.machine.Memory.getInstance().prettyPrint(
        "Stack",
        Memory.info.rts.start,
        Memory.info.rts.length);
    }
  }
});
