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
if (typeof qx === "undefined")
{
  var             bConsole = true;

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
    debugFlags :
    {
      ast    : false,
      symtab : false
    },

    /**
     * @lint ignoreUndefined(process.exit)
     */
    main : function(parser)
    {
      var             argv;
      var             optimist;

      if (bConsole)
      {
        // Option processing, when run from the command line
        optimist = require("optimist");
        optimist.usage("Usage: $0 " +
                 "[--ast] [--symtab] [--rts] [--heap] [--gas] <file.c>");
        optimist["boolean"]( [ "ast", "symtab", "rts", "heap", "gas" ] );
        argv = optimist.argv;
        
        // If help was requested...
        if (argv.h || argv.help)
        {
          // ... then just print the help message and exit
          console.log(optimist.help());
          process.exit(0);
        }
        
        // Set flags
        playground.c.AbstractSyntaxTree.debugFlags.ast    = !!argv["ast"];
        playground.c.AbstractSyntaxTree.debugFlags.symtab = !!argv["symtab"];
        playground.c.AbstractSyntaxTree.debugFlags.rts    = !!argv["rts"];
        playground.c.AbstractSyntaxTree.debugFlags.heap   = !!argv["heap"];
        playground.c.AbstractSyntaxTree.debugFlags.gas    = !!argv["gas"];
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
      var             entry;
      var             symtab;
      var             message;
      var             machine;
      var             entryNode;
      var             declarator;
      var             function_decl;
      var             Memory = playground.c.machine.Memory;
      var             mem = Memory.getInstance();

      // Initialize memory
      mem.initAll();

      // Correct line numbers
      root.fixLineNumbers();

      // Display the abstract syntax tree
      if (playground.c.AbstractSyntaxTree.debugFlags.ast)
      {
        root.display();
      }

      // Reset the symbol table to a clean state
      playground.c.lib.Symtab.reset();

      // Re-create the root-level symbol table
      new playground.c.lib.Symtab(null, null, 0);

      // Initialize the machine singleton, which initializes the registers
      machine = playground.c.machine.Machine.getInstance();

      function catchError(error)
      {
        // Determine what type of error we encountered
        if (error instanceof playground.c.lib.Break)
        {
          console.log(
            "Error: line " + error.node.line + ": " + 
            "Found 'break' not in a loop, " +
            "nor immediately within a 'switch'");
        }
        else if (error instanceof playground.c.lib.Continue)
        {
          console.log(
            "Error: line " + error.node.line + ": " + 
            "Found 'continue' not immediately within a loop");
        }
        else if (error instanceof playground.c.lib.RuntimeError)
        {
          console.log(
            "Error: line " + error.node.line + ": " + error.message);
        }
        else
        {
          console.log("Programmer error: " + error);
          console.log(error.stack);
        }
      };

      // Process the abstract syntax tree to create symbol tables
      root.process(
        data,
        false,
        function()
        {
          if (playground.c.AbstractSyntaxTree.debugFlags.symtab)
          {
            playground.c.lib.Symtab.display();
          }

          intSize = Memory.typeSize["int"];
          ptrSize = Memory.typeSize["pointer"];

          // Get the symbol table entry for main, if it exists
          symtab = playground.c.lib.Symtab.getByName("*");
          entry = symtab.get("main", true);

          // If this entry's first specifier/declarator indicates it's a
          // function...
          declarator = entry.getSpecAndDecl()[0];
          if (declarator.getType() == "function")
          {
            // ... then that's our entry node
            entryNode = declarator.getFunctionNode();
          }

          // Process the abstract syntax tree from the entry point, if it
          // exists, to run the program
          if (entryNode)
          {
            qx.core.Init.getApplication().getUserData("terminal").clear();
            qx.core.Init.getApplication().getUserData("terminal").addOutput(
              "\n*** Running program ***\n");

            // Prepare to call main(). Reset the machine.
            machine.initAll();

            // Try to reset the model of the memory template view
            try
            {
              qx.core.Init.getApplication().memTemplate.setModel(null);
            }
            catch(e)
            {
              // Do nothing. The call will fail when not running in the GUI
            }


            // Save the stack pointer, so we can restore it after the function
            // call
            origSp = mem.getReg("SP", "unsigned int");

            // Push the arguments onto the stack. First, if there are no
            // arguments provided, create one.
            argv = argv || [ "test1", "hello", "world" ];

            // Explicitly null-terminate each of the argument strings and save
            // in its own array.
            argArr = argv.map(function(arg) { return arg + "\0"; });

            // argv now becomes the pointers to each of the strings
            argv = [];

            // Point to where the stack pointer points. We'll adjust this for
            // each argument string.
            p = sp = origSp;

            // Write each argument to the stack (last one first, so first one
            // is at the lowest address in memory)
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
                    getUnsigned     : function() { return false; },
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

            // We want to end on a word boundary. If there are an odd number
            // of argv pointers, decrement by one pointer to start with.
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
                getUnsigned     : function() { return false; },
                getSize         : function() { return ptrSize * argv.length; },
                getPointerCount : function() { return 1; },
                getArraySizes   : function() { return [ argv.length ]; },
                getIsParameter  : function() { return false; }
              });

            // Adjust the stack pointer back to a word boundary
            sp = p - playground.c.machine.Memory.WORDSIZE;;
            sp -= p % playground.c.machine.Memory.WORDSIZE;
            mem.setReg("SP", "unsigned int", sp);

            // This is the beginning of an activation record.
            mem.beginActivationRecord(sp);

            // Name this activation record
            declarator = entryNode.children[1];
            function_decl = declarator.children[0];
            mem.nameActivationRecord(
              "Activation Record: " + function_decl.children[0].value);

            // Push the address of the argv array onto the stack
            mem.stackPush("pointer", p);

            // Push the argument count onto the stack
            mem.stackPush("int", argv.length);

            // Retrieve the symbol table for main()
            symtab = entryNode._symtab;

            // Save the new frame pointer
            symtab.setFramePointer(mem.getReg("SP", "unsigned int"));

            // Push the return address (our current line number) onto the stack
            sp = mem.stackPush("unsigned int", 0);
            mem.setSymbolInfo(
              sp,
              {
                getName         : function() { return "called from line #"; },
                getType         : function() { return "int"; },
                getUnsigned     : function() { return false; },
                getSize         : function() { return intSize; },
                getPointerCount : function() { return 0; },
                getArraySizes   : function() { return []; },
                getIsParameter  : function() { return false; }
              });

            // Process main()
            try
            {
              entryNode.process(
                data,
                true,
                function(value)
                {
                  var             application;
                  var             editor;
                  var             memData;
                  var             model;
                  var             message;
                  
                  message = 
                    value.value === 0
                    ? "completed successfully."
                    : "was NOT SUCCESSFUL. Exit code: " + value.value;

                  qx.core.Init.getApplication().
                    getUserData("terminal").addOutput(
                      "*** " +
                      "Program execution " + message + " " +
                      "***\n");

                  if (playground.c.AbstractSyntaxTree.debugFlags.rts)
                  {
                    mem.prettyPrint("Stack",
                                    Memory.info.rts.start,
                                    Memory.info.rts.length);
                  }

                  if (playground.c.AbstractSyntaxTree.debugFlags.heap)
                  {
                    mem.prettyPrint("Stack",
                                    Memory.info.heap.start,
                                    Memory.info.heap.length);
                  }

                  if (playground.c.AbstractSyntaxTree.debugFlags.gas)
                  {
                    mem.prettyPrint("Globals", 
                                    Memory.info.gas.start, 
                                    Memory.info.gas.length);
                  }

                  try
                  {
                    // We have stored some "global" variables in user data of
                    // the app
                    application = qx.core.Init.getApplication();

                    // Retrieve the editor object
                    editor = application.getUserData("sourceeditor");

                    // Remove any decoration on the previous line
                    if (playground.c.lib.Node._prevLine >= 0)
                    {
                      editor.removeGutterDecoration(
                        playground.c.lib.Node._prevLine - 1, "current-line");
                    }
                  }
                  catch (e)
                  {
                    // Ignore failure. It will fail when not in GUI environment
                  }

                  // Turn off single-step mode, and reset previous line for
                  // running the program again.
                  playground.c.lib.Node._bStep = false;
                  playground.c.lib.Node._prevLine = 0;                  

                  // Restore the previous frame pointer
                  symtab.restoreFramePointer();

                  // Restore the original stack pointer
                  mem.setReg("SP", "unsigned int", origSp);

                  // We're finished with this activation record.
                  mem.endActivationRecord();

                  try
                  {
                    // Yup, we're stopped. Retrieve the data in memory, ...
                    memData =
                      playground.c.machine.Memory.getInstance().getDataModel();

                    // ... convert it to a qx.data.Array, ...
                    model = qx.data.marshal.Json.createModel(memData);

                    // ... and update the memory template view.
                    application.memTemplate.setModel(model);
                  }
                  catch(e)
                  {
                    // Ignore failure. It will fail when not in GUI environment
                  }

                }.bind(entryNode),
                catchError);
            }
            catch(e)
            {
              catchError(e);
            }
          }
          else
          {
            console.log("Missing main() function\n");
          } 
        }.bind(root),
        catchError);
    }
  }
});
