/**
 * Process the abstract syntax tree
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
#ignore(require)
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 */
if (typeof qx === 'undefined')
{
  require("./lib/Symtab.js");
  require("./lib/Node.js");
  require("./machine/Memory.js");
  require("./machine/Machine.js");
}


qx.Class.define("playground.c.AbstractSyntaxTree",
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
      var Memory = playground.c.machine.Memory;
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
        playground.c.lib.Symtab.display();
      }

      // Reset the symbol table to a clean state
      playground.c.lib.Symtab.reset();

      // Re-create the root-level symbol table
      new playground.c.lib.Symtab(null, null, 0);

      // Initialize the machine singleton, which initializes the registers
      machine = playground.c.machine.Machine.getInstance();

      // Process the abstract syntax tree to create symbol tables
      root.process(data, false);

      if (bDebug)
      {
        playground.c.lib.Symtab.display();
      }

      // Process the abstract syntax tree from the entry point, if it exists,
      // to run the program
      if (playground.c.lib.Node.entryNode)
      {
        // Prepare to call main(). Reset the machine.
        machine.initAll();

        // Save the stack pointer, so we can restore it after the function call
        sp = playground.c.lib.Node.__mem.getReg("SP", "unsigned int");

        // Push argv and argc onto the stack
        playground.c.lib.Node.__mem.stackPush("pointer", 0xeeeeeeee);
        playground.c.lib.Node.__mem.stackPush("unsigned int", 0xdddddddd);

        // Retrieve the symbol table for main()
        symtab = playground.c.lib.Node.entryNode._symtab;

        // Save the new frame pointer
        symtab.setFramePointer(
          playground.c.lib.Node.__mem.getReg("SP", "unsigned int"));

        // Push the return address (our current line number) onto the stack
        playground.c.lib.Node.__mem.stackPush("unsigned int", 0xcccccccc);

        // Process main()
        playground.c.lib.Node.entryNode.process(data, true);

        // Restore the previous frame pointer
        symtab.restoreFramePointer();

        // Restore the stack pointer
        playground.c.lib.Node.__mem.setReg("SP", "unsigned int", sp);
      }
      else
      {
        console.log("Missing main() function\n");
      } 

      playground.c.machine.Memory.getInstance().prettyPrint(
        "Globals",
        Memory.info.gas.start,
        Memory.info.gas.length);

      playground.c.machine.Memory.getInstance().prettyPrint(
        "Stack",
        Memory.info.rts.start,
        Memory.info.rts.length);
    }
  }
});
