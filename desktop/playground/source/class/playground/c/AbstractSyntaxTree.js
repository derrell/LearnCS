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
    main : function(parser)
    {
      if (typeof window === "undefined")
      {
        require("./lib/Symtab.js");
        require("./lib/Node.js");
        require("./c/machine/Machine.js");
      }

      var error =
      {
        /**
         * Function called upon each error encountered during parsing
         * 
         * @param str {String}
         *   A pre-defined error string which shows where in the line the error
         *   occurred.
         * 
         * @param hash {Map}
         *   A map containing details of the error and its location.
         */
        parseError : function(str, hash)
        {
          if (true)
          {
            var errStr =
              "Parse error on line " +
              hash.line +
              ":\n" +
              parser.lexer.showPosition() +
              "\n"
              ;

            if (str)
            {
              errStr += "\t" + str;
            }

            console.log(errStr);
          }
          else
          {
            // For debugging, this code displays all values of hash.
            console.log(str);

            console.log("Details:");
            for (var x in hash)
            {
              console.log("  " + x + ": " + hash[x]);
            }
          }

          // Increment the number of errors encountered so far.
          ++error.errorCount;
        },

        /** Count of errors encountered so far */
        errorCount : 0
      };

      // Function called upon each error encountered during parsing
      parser.yy.parseError = error.parseError;

      // Give the Node class access to the error object
      playground.c.lib.Node.setError(error);

      // Create the root-level symbol table
      new playground.c.lib.Symtab(null, null, 0);

      // Function to display rules as they are parsed
      parser.yy.R = function(rule)
      {
//        console.log("rule: " + rule);
      };
    },

    process : function(root, argv)
    {
      var             p;
      var             sp;
      var             origSp;
      var             data = {};
      var             argArr;
      var             intSize;
      var             ptrSize;
      var             symtab;
      var             message;
      var             machine;
      var             Memory = playground.c.machine.Memory;
      var             mem = Memory.getInstance();
      var             bDebug = true;

      // Initialize memory
      mem.initAll();

      // Correct line numbers
      root.fixLineNumbers();

      if (bDebug)
      {
        // Display the abstract syntax tree
        root.display();

        // Display the symbol table
//        playground.c.lib.Symtab.display();
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
//        playground.c.lib.Symtab.display();
      }

      intSize = Memory.typeSize["int"];
      ptrSize = Memory.typeSize["pointer"];

      // Process the abstract syntax tree from the entry point, if it exists,
      // to run the program
      if (playground.c.lib.Node.entryNode)
      {
        // Prepare to call main(). Reset the machine.
        machine.initAll();

        // Save the stack pointer, so we can restore it after the function call
        origSp = playground.c.lib.Node.__mem.getReg("SP", "unsigned int");

        // Push the arguments onto the stack. First, if there are no arguments
        // provided, create one.
        argv = argv || [ "test1", "hello", "world" ];
        
        // Explicitly null-terminate each of the argument strings and save in
        // its own array.
        argArr = argv.map(function(arg) { return arg + "\0"; });
        
        // argv now becomes the pointers to each of the strings
        argv = [];
        
        // Point to where the stack pointer points. We'll adjust this for each
        // argument string.
        p = sp = origSp;

        // Write each argument to the stack (last one first, so first one is
        // at the lowest address in memory)
        argArr.reverse().forEach(
          function(arg, i)
          {
            // Set a pointer on the stack to the beginning of that string
            // (aligned at a word boundary)
            p -= arg.length;
            p -= p % playground.c.machine.Memory.WORDSIZE;

            // That address is where this argument string will be
            argv[i] = p;
            
            mem.setSymbolInfo(
              p,
              {
                getName         : function() { return "argument " + 
                                               (argArr.length - i - 1); },
                getType         : function() { return "char"; },
                getSize         : function() { return arg.length; },
                getPointerCount : function() { return 0; },
                getArraySizes   : function() { return [ arg.length ]; },
                getIsParameter  : function() { return false; }
              });

            // Now write each character to memory
            arg.split("").forEach(
              function(ch, i)
              {
                mem.set(p + i, "char", ch.charCodeAt(0));
              });
          });
        
        // We want to end on a word boundary. If there are an odd number of
        // argv pointers, decrement by one pointer to start with.
        if (argv.length % 2 === 1)
        {
          p -= ptrSize;
        }

        // Now push the argv array of pointers
        argv.forEach(
          function(pointer, i)
          {
            // Set a pointer on the stack for this argv pointer
            p -= ptrSize;

            // Write out the pointer
            mem.set(p, "pointer", pointer);
          });
        
        mem.setSymbolInfo(
          p,
          {
            getName         : function() { return "argument pointers"; },
            getType         : function() { return "char"; },
            getSize         : function() { return ptrSize * argv.length; },
            getPointerCount : function() { return 1; },
            getArraySizes   : function() { return [ argv.length ]; },
            getIsParameter  : function() { return false; }
          });

        // Adjust the stack pointer back to a word boundary
        sp = p - playground.c.machine.Memory.WORDSIZE;;
        sp -= p % playground.c.machine.Memory.WORDSIZE;
        playground.c.lib.Node.__mem.setReg("SP", "unsigned int", sp);

        // Push the address of the argv array onto the stack
        playground.c.lib.Node.__mem.stackPush("char", p);

        // Push the argument count onto the stack
        playground.c.lib.Node.__mem.stackPush("int", argv.length);

        // Retrieve the symbol table for main()
        symtab = playground.c.lib.Node.entryNode._symtab;

        // Save the new frame pointer
        symtab.setFramePointer(
          playground.c.lib.Node.__mem.getReg("SP", "unsigned int"));

        // Push the return address (our current line number) onto the stack
        sp = playground.c.lib.Node.__mem.stackPush("unsigned int", 0);
        mem.setSymbolInfo(
          sp,
          {
            getName         : function() { return "called from line #"; },
            getType         : function() { return "int"; },
            getSize         : function() { return intSize; },
            getPointerCount : function() { return 0; },
            getArraySizes   : function() { return []; },
            getIsParameter  : function() { return false; }
          });

        // Process main()
        try
        {
          playground.c.lib.Node.entryNode.process(data, true);
        }
        catch(e)
        {

          // Determine what type of error we encountered
          if (e instanceof playground.c.lib.Break)
          {
            console.log(
              "Error: line " + e.node.line + ": " + 
              "Found 'break' not in a loop, " +
              "nor immediately within a 'switch'");
          }
          else if (e instanceof playground.c.lib.Continue)
          {
            console.log(
              "Error: line " + e.node.line + ": " + 
              "Found 'continue' not immediately within a loop");
          }
          else if (e instanceof playground.c.lib.RuntimeError)
          {
            console.log(
              "Error: line " + e.node.line + ": " + e.message);
          }
          else
          {
            console.log("Programmer error: " + e);
            console.log(e.stack);
          }
        }

        // Restore the previous frame pointer
        symtab.restoreFramePointer();

        // Restore the original stack pointer
        playground.c.lib.Node.__mem.setReg("SP", "unsigned int", origSp);
      }
      else
      {
        console.log("Missing main() function\n");
      } 

/*
      mem.prettyPrint("Globals", Memory.info.gas.start, Memory.info.gas.length);
      mem.prettyPrint("Stack",   Memory.info.rts.start, Memory.info.rts.length);
*/
    }
  }
});
