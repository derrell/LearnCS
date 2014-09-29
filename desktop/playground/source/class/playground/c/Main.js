/**
 * Process the abstract syntax tree
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
@ignore(require)
@ignore(process)
@ignore(bTest)

@require(playground.c.builtin.Ctype)
@require(playground.c.builtin.Math)
@require(playground.c.builtin.Stdlib)
@require(playground.c.stdio.Stdio)
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @ignore(require)
 * @ignore(process.*)
 */
if (typeof qx === "undefined")
{
  var             bConsole = true;

  require("./lib/Symtab.js");
  require("./lib/Node.js");
  require("./lib/Exit.js");
  require("./lib/RuntimeError.js");
  require("./lib/NotYetImplemented.js");
  require("./machine/Memory.js");
  require("./machine/Machine.js");
  require("./stdio/AbstractFile.js");
  require("./stdio/EofError.js");
  require("./stdio/Printf.js");
  require("./stdio/Scanf.js");
  require("./stdio/Stdin.js");
  require("./stdio/Stdout.js");
  require("./stdio/Stderr.js");
  require("./stdio/RemoteFile.js");
  require("./stdio/StringIn.js");
  require("./stdio/StringOut.js");
  require("./builtin/Stdlib.js");
  require("./builtin/Ctype.js");
  require("./builtin/Math.js");
  require("./builtin/Time.js");
}

qx.Class.define("playground.c.Main",
{
  extend : Object,
  
  statics :
  {
    debugFlags :
    {
      ast       : false,
      symtab    : false
    },

    commandeLine : null,

    /** Functions to be called after parsing, to reread includes */
    includes : [],

    /** Functions to be called after program execution */
    finalize : [],

    /**
     * @ignore(process.exit)
     * @ignore(bTest)
     */
    main : function(parser)
    {
      var             argv;
      var             optimist;
      var             terminal;
      var             button;

      if (bConsole || (typeof bTest != "undefined" && bTest))
      {
        // Option processing, when run from the command line
        optimist = require("optimist");
        optimist.usage(
          "Usage: $0 " +
            "[--ast] [--symtab] [--rts] [--heap] [--gas] " +
            "[--cmdline <command_line>] [--rootdir <root_dir>]" +
          "<file.c>");
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
        playground.c.Main.debugFlags.ast    = !!argv["ast"];
        playground.c.Main.debugFlags.symtab = !!argv["symtab"];
        playground.c.Main.debugFlags.rts    = !!argv["rts"];
        playground.c.Main.debugFlags.heap   = !!argv["heap"];
        playground.c.Main.debugFlags.gas    = !!argv["gas"];
        
        // If a root directory is specified...
        if (argv["rootdir"])
        {
          playground.c.stdio.RemoteFile.ROOTDIR = argv["rootdir"].toString();
        }
        
        // If a command line was specified...
        if (argv["cmdline"])
        {
          playground.c.Main.commandLine = argv["cmdline"].toString();
        }
      }
      else
      {
        // Set focus to the terminal window
        terminal = qx.core.Init.getApplication().getUserData("terminal");
        terminal.focus();
        terminal.clear();
        
        // Ensure the terminal is not in end-of-file condition
        terminal.setEof(false);
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
         * 
         * @param prevPosition {String}
         *   A previous position to show instead of the current position
         */
        parseError : function(str, hash, prevPosition)
        {
          var             errStr;
          var             showPosition;
          var             button;
          var             hint;
          var             editor;
          var             expected;
          
          // Set the program state
          qx.core.Init.getApplication().setProgramState("idle");

          if (true)
          {
            // Strip off entry meaningless text that we'll replicate
            str = str.replace(/^Parse error on.*\n.*\n.*\n/, "");

//console.log(JSON.stringify(hash, null, "  ") + "\n" + str);
            // Trap the most common errors: missing semicolon
            str = str.replace(
              new RegExp(
                "Expecting " +
                "'\\(', '\\)', '[[]', ']', " +
                "'[.]', 'PTR_OP', " +
                "'INC_OP', 'DEC_OP', " + 
                "',', '\\&', '\\*', '\\+', '\\-', '/', '%', " +
                "'LEFT_OP', 'RIGHT_OP', '<', '>', 'LE_OP', 'GE_OP', " +
                "'EQ_OP', 'NE_OP', '[^]', '[|]', 'AND_OP', 'OR_OP', " +
                "'\\?', ':', '=', " +
                "'MUL_ASSIGN', 'DIV_ASSIGN', 'MOD_ASSIGN', " +
                "'ADD_ASSIGN', 'SUB_ASSIGN', 'LEFT_ASSIGN', 'RIGHT_ASSIGN', " +
                "'AND_ASSIGN', 'XOR_ASSIGN', 'OR_ASSIGN', ';', 'RBRACE', " +
                "got .*"),
              function(match)
              {
                hint = 
                  "Maybe you forgot a semicolon, other punctuation, " +
                  "or an operator?";
                return hint;
              });

                  
            str = str.replace(
              new RegExp(
                "Expecting " +
                "'\\)', ']', ',', ':', ';', " +
                "got .*"),
              function(match)
              {
                hint = 
                  "Maybe you forgot a semicolon or other punctuation?";
              });

            str = str.replace(
              new RegExp(
                "Expecting ';', got .*"),
              function(match)
              {
                hint = 
                  "Maybe you forgot a semicolon?";
              });

            // If this is a custom error message fron ansic.jison...
            if (hash.displayError)
            {
              // ... then use the error message as given
              hint = str;
            }

            // If there's no loc member of the hash, create one
            if (! hash.loc)
            {
              hash.loc =
                {
                  first_line   : hash.line + 1,
                  first_column : 0,
                  last_line    : hash.line + 1,
                  last_column  : 9999
                };
            }

            // If we haven't ascertained a hint yet...
            if (! hint)
            {
              // ... then assign a default one
              hint = "Unrecognized C syntax";
              
              // Get a list of expected tokens
              expected = [];
              
              (function(tokens)
               {
                 tokens.forEach(
                   function(token)
                   {
                     expected.push(
                       {
                         "'PTR_OP'"          : "->",
                         "'INC_OP'"          : "++",
                         "'DEC_OP'"          : "--",
                         "'SIZEOF'"          : "sizeof",
                         "'LEFT_OP'"         : "<<",
                         "'RIGHT_OP'"        : ">>",
                         "'LE_OP'"           : "<=",
                         "'GE_OP'"           : ">=",
                         "'EQ_OP'"           : "==",
                         "'NE_OP'"           : "!=",
                         "'AND_OP'"          : "&&",
                         "'OR_OP'"           : "||",
                         "'MUL_ASSIGN'"      : "*=",
                         "'DIV_ASSIGN'"      : "/=",
                         "'MOD_ASSIGN'"      : "%=",
                         "'ADD_ASSIGN'"      : "+=",
                         "'SUB_ASSIGN'"      : "-=",
                         "'LEFT_ASSIGN'"     : "<<=",
                         "'RIGHT_ASSIGN'"    : ">>=",
                         "'AND_ASSIGN'"      : "&=",
                         "'XOR_ASSIGN'"      : "^=",
                         "'OR_ASSIGN'"       : "|=",
                         "'TYPEDEF'"         : "typedef",
                         "'EXTERN'"          : "extern",
                         "'STATIC'"          : "static",
                         "'AUTO'"            : "auto",
                         "'REGISTER'"        : "register",
                         "'VOID'"            : "void",
                         "'CHAR'"            : "char",
                         "'SHORT'"           : "short",
                         "'INT'"             : "int",
                         "'LONG'"            : "long",
                         "'FLOAT'"           : "float",
                         "'DOUBLE'"          : "double",
                         "'SIGNED'"          : "signed",
                         "'UNSIGNED'"        : "unsigned",
                         "'STRUCT'"          : "struct",
                         "'UNION'"           : "union",
                         "'ENUM'"            : "enum",
                         "'CONST'"           : "const",
                         "'VOLATILE'"        : "volatile",
                         "'CASE'"            : "case",
                         "'DEFAULT'"         : "default",
                         "'IF'"              : "if",
                         "'ELSE'"            : "else",
                         "'SWITCH'"          : "switch",
                         "'WHILE'"           : "while",
                         "'DO'"              : "do",
                         "'FOR'"             : "for",
                         "'GOTO'"            : "goto",
                         "'CONTINUE'"        : "continue",
                         "'BREAK'"           : "break",
                         "'RETURN'"          : "return",
                         "'IDENTIFIER'"      : "(an identifier)",
                         "'TYPE_NAME'"       : "(a type name)",
                         "'CONSTANT_HEX'"    : "(a hexidecimal constant)",
                         "'CONSTANT_OCTAL'"  : "(an octal constant)",
                         "'CONSTANT_DECIMAL'": "(a decimal constant)",
                         "'CONSTANT_CHAR'"   : "(a character constant)",
                         "'CONSTANT_FLOAT'"  : "(a floating-point constant)",
                         "'STRING_LITERAL'"  : "(a string literal)",
                         "'ELLIPSIS'"        : "...",
                         "'LBRACE'"          : "{",
                         "'RBRACE'"          : "}"
                       }[token] || token);
                   });
               })(hash.expected || []);
               
              // Add some detail to the error message
              if (expected.length == 1)
              {
                // Only one expected token. Show it without the default hint.
                hint =
                  "\n" + "\tFound '" + hash.text + "' but expected " +
                  expected[0];
              }
              else if (expected.length > 1 && expected.length <= 4)
              {
                // A few expected tokens. Show them with the default hint.
                hint +=
                  "\n" + "\tFound '" + hash.text + "' but expected one of:" +
                  expected.join(", ");
              }
              // Otherwise there are many expected tokens. Don't show them.
            }

            // If we have a previous position to display, then show it;
            // otherwise show the current position (if known), along with the
            // error description.
            if (! parser || ! parser.lexer || ! parser.lexer.matched)
            {
              errStr = "Error near line " + hash.loc.first_line + ":\n";
            }
            else
            {
              errStr =
                "Error: See arrow pointing to position of error near line " +
                hash.loc.first_line +
                ":\n" +
                (prevPosition || parser.lexer.showPosition()) +
                "\n";
            }

            if (str)
            {
              errStr += "\t" + hint + "\n\n";
            }

            // Send the error as a status report
            hash.displayError = errStr;
            playground.c.Main._statusReport(
              {
                type  : "error",
                error : JSON.stringify(hash, null, "  ")
              });

            playground.c.Main.output(errStr);
            
            // Show the error in the editor window
            try
            {
              qx.core.Init.getApplication().showError(hash.loc, hint, "error");
            }
            catch(e)
            {
              // fails in non-gui environment
            }
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

      // Re-initialize the environment
      playground.c.Main.reinit();

      // Function called upon each error encountered during parsing
      parser.yy.parseError = error.parseError;

      // Give the Node class access to the error object
      playground.c.lib.Node.setError(error);

      // Reset the symbol table to a clean state
      playground.c.lib.Symtab.reset();

      // Create the root-level symbol table
      new playground.c.lib.Symtab(null, null, 0);

      // If there was a prior stdin and/or stdout, cancel any of its pending
      // timers, and flush output.
      [ 
        "stdin",
        "stdout",
        "stderr"
      ].forEach(
        function(stream)
        {
          // If there's a prior instance of this stream...
          if (playground.c.Main[stream])
          {
            // ... then remove any pending listeners
            qx.event.Registration.removeAllListeners(playground.c.Main[stream]);

            // Reinitialize the stream
            playground.c.Main[stream].init();
          }
          else
          {
            // Get the singleton instance of this stream
            playground.c.Main[stream] = 
              playground.c.stdio[qx.lang.String.firstUp(stream)].getInstance();
          }
        });

      // Reset the includes and finalize lists
      playground.c.Main.includes = [];
      playground.c.Main.finalize = [];

      // Process the include files found by the preprocessor
      playground.c.lib.Preprocessor.includedFiles.forEach(
        function(inclFile)
        {
          var             include;
          var             finalize;
          var             includeError;
          var             file = inclFile.file;
          var             line = inclFile.line;

          if (! inclFile.is_global)
          {
            throw new playground.c.lib.RuntimeError(
              {
                line : line,
                toString : function()
                {
                  return file;
                }
              },
              "#include for local files (with quotes) " +
              "is not yet supported: \"" + file + "\"\n" +
              "If it's a system include file, you should use angle brackets " +
              "instead: " +
              "<" + file + ">");
          }

          switch(file)
          {
          case "learncs.h" :
            include = function()
            {
              return (playground.c.builtin.Learncs.include(file, line));
            };
            break;

          case "elevator.h" :
            include = function()
            {
              return (playground.c.builtin.Elevator.include(file, line));
            };
            break;

          case "draw.h" :
            include = function()
            {
              return (playground.c.builtin.Draw.include(file, line));
            };
            finalize = function()
            {
              playground.c.builtin.Draw.finalize();
            };
            break;

          case "ctype.h" :
            include = function()
            {
              return (playground.c.builtin.Ctype.include(file, line));
            };
            break;

          case "math.h" :
            include = function()
            {
              return (playground.c.builtin.Math.include(file, line));
            };
            break;

          case "stdio.h" :
            include = function()
            {
              return (playground.c.stdio.Stdio.include(file, line));
            };
            finalize = function()
            {
              playground.c.stdio.Stdio.finalize();
            };
            break;

          case "stdlib.h" :
            include = function()
            {
              return (playground.c.builtin.Stdlib.include(file, line));
            };
            finalize = function()
            {
              playground.c.builtin.Stdlib.finalize();
            };
            break;

          case "time.h" :
            include = function()
            {
              return (playground.c.builtin.Time.include(file, line));
            };
            break;

          default :
            playground.c.lib.Node.getError().parseError(
              "Include file not found (" + file + ")",
              { line : line, displayError : true }); 
            return;
          }

          // Add this include function to list of initializers
          // so it'll be re-included after parsing
          playground.c.Main.includes.push(include);

          // If there's a finalization function, save it too
          if (finalize)
          {
            playground.c.Main.finalize.push(finalize);
          }

          // Include it now, for continued parsing
          includeError = include();
          if (includeError)
          {
            playground.c.lib.Node.getError().parseError(
              includeError.message,
              { line : line, displayError : true });
            return;
          }
      });


      // Function to display rules as they are parsed
      parser.yy.R = function(rule)
      {
//        console.log("rule: " + rule);
      };
    },

    /**
     * @ignore(process.stdout)
     * @ignore(process.stdout.write)
     */
    output : function(str, bClear)
    {
      var             terminal;

      try
      {
        terminal = qx.core.Init.getApplication().getUserData("terminal");
        if (bClear)
        {
          terminal.clear();
        }

        terminal.addOutput(str);
      }
      catch(e)
      {
        process.stdout.write(str);
      }
    },

    /**
     * (Re-)initialize to run the user's program.
     */
    reinit : function()
    {
      var             application;
      var             editor;

      // 'try' will fail when not in GUI environment
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

      // Handle stdio clean-up
      playground.c.stdio.AbstractFile.onProgramEnd();

      // Turn off single-step mode, and reset previous line for
      // running the program again.
      playground.c.lib.Node._bStep = false;
      playground.c.lib.Node._prevLine = 0;                  
    },

    process : function(root, argv)
    {
      var             hint;
      var             line;
      var             button;
      var             message;
      var             developer = false;

      try
      {
        playground.c.Main._process(root, argv);
      }
      catch(error)
      {
        if (error instanceof playground.c.lib.RuntimeError)
        {
          line = error.node.line;
          hint = error.message;
          message =
            "Error near line " + line + ": " + hint + "\n";
        }
        else if (error instanceof playground.c.lib.NotYetImplemented)
        {
          line = playground.c.lib.Node._currentNode.line;
          hint =
            "This feature is not yet implemented in LearnCS!: " +
            error.thingNotImplemented;
          message = hint + "\n";
        }
        else
        {
          line = playground.c.lib.Node._currentNode.line;
          hint = error + "\n" + error.stack;
          message =
            "[2]Internal error near line " +
            playground.c.lib.Node._currentNode.line +
            ": " + hint + "\n";
          developer = true;
        }

        // Send the error message as a status report
        playground.c.Main._statusReport(
          {
            type       : "exit_crash",
            exit_crash : message,
            developer  : developer
          });

        // Show the error in the editor
        try
        {
          qx.core.Init.getApplication().showError(
            {
              first_line   : line,
              first_column : 0,
              last_line    : line,
              last_column  : 9999
            },
            message);
        }
        catch(e)
        {
          // fails in non-gui environment
        }

        // Output the error message
        playground.c.Main.output(message);
        playground.c.Main.output(
          ">>> Program had errors. It did not run to completion.\n");

        // Set the program state
        qx.core.Init.getApplication().setProgramState("crashed");

        if (typeof process != "undefined")
        {
          process.exit(1);
        }
      }
    },

    _statusReport : function(data)
    {
      try
      {
//        data.snapshot = qx.core.Init.getApplication().editor.getCode();
        playground.ServerOp.statusReport(data);
      }
      catch(e)
      {
        // ignore error; will fail when not in gui environment
      }
    },

    _process : function(root, argv)
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
      var             machine;
      var             entryNode;
      var             declarator;
      var             function_decl;
      var             cmdLine;
      var             Memory = playground.c.machine.Memory;
      var             mem = Memory.getInstance();

      // In case we'd run the program previously, clean up from last time
      completion();

      // Initialize memory
      mem.initAll();

      // Correct line numbers
      root.fixLineNumbers(true);

      // Display the abstract syntax tree
      if (playground.c.Main.debugFlags.ast)
      {
        root.display();
      }

      // Reset the symbol table to a clean state
      playground.c.lib.Symtab.reset();

      // Re-create the root-level symbol table
      new playground.c.lib.Symtab(null, null, 0);

      // Re-add any include files that were included
      playground.c.Main.includes.forEach(
        function(fInclude)
        {
          var             error;
          var             message;

          error = fInclude();
          if (error)
          {
            // Show the error in the editor
            try
            {
              qx.core.Init.getApplication().showError(
                {
                  first_line   : error.node.line,
                  first_column : 0,
                  last_line    : error.node.line,
                  last_column  : 9999
                },
                error.message);
            }
            catch(e)
            {
              // fails in non-gui environment
            }

            message =
              "Error near line " + error.node.line +
              ": " + error.message + "\n";
            playground.c.Main.output(message);

            // Send the error message as a status report
            playground.c.Main._statusReport(
              {
                type       : "exit_crash",
                exit_crash : message
              });
          }
        });

      // Initialize the machine singleton, which initializes the registers
      machine = playground.c.machine.Machine.getInstance();
      
      function completion(programState)
      {
        var             editor;
        var             memData;
        var             model;
        var             button;
        var             application = qx.core.Init.getApplication();

        // Set the program state
        application.setProgramState(programState || "idle");

        // Handle stdio clean-up
        playground.c.stdio.AbstractFile.onProgramEnd();

        // Display any requested debugging output
        if (playground.c.Main.debugFlags.rts)
        {
          mem.prettyPrint("Stack",
                          Memory.info.rts.start,
                          Memory.info.rts.length);
        }

        if (playground.c.Main.debugFlags.heap)
        {
          mem.prettyPrint("Stack",
                          Memory.info.heap.start,
                          Memory.info.heap.length);
        }

        if (playground.c.Main.debugFlags.gas)
        {
          mem.prettyPrint("Globals", 
                          Memory.info.gas.start, 
                          Memory.info.gas.length);
        }

        // 'try' will fail when not in GUI environment
        try
        {
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
        if (symtab)
        {
          symtab.restoreFramePointer();
        }

        // Restore the original stack pointer
        mem.setReg("SP", "unsigned int", origSp);

        if (programState != "crashed")
        {
          // We're finished with this activation record.
          mem.endActivationRecord();

          // Flush the arguments and any global variables from the memory view
          mem.removeSymbolInfo();
        }

        try
        {
          // We're stopped. Retrieve the data in memory, ...
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
      }

      function catchError(error)
      {
        var             line;
        var             hint;
        var             message;
        var             button;
        var             developer = false;

        // Was this actually an Exit request?
        if (error instanceof playground.c.lib.Exit)
        {
          // Run any finalization functions
          playground.c.Main.finalize.forEach(
            function(finalize)
            {
              finalize();
            });

          completion(error.exitCode === 127 ? "crashed" : "idle");

          // Show them their exit value
          playground.c.Main.output(
            ">>> " +
            "Program exited with exit code " + error.exitCode + "\n");

          // Send the exit code as a status report
          playground.c.Main._statusReport(
            {
              type      : "exit",
              exit_code : error.exitCode
            });

          if (typeof process != "undefined")
          {
            process.exit(error.exitCode);
          }

          return;
        }


        // Determine what type of error we encountered
        if (error instanceof playground.c.lib.Break)
        {
          line = error.node.line;
          hint =
            "Found 'break' not in a loop, nor immediately within a 'switch'\n";
          message =
            "Error near line " + line + ": " + hint;
        }
        else if (error instanceof playground.c.lib.Continue)
        {
          line = error.node.line;
          hint =
            "Found 'continue' not immediately within a loop\n";
          message =
            "Error near line " + line + ": " + hint;
        }
        else if (error instanceof playground.c.lib.RuntimeError)
        {
          line = error.node.line;
          hint = error.message;
          message =
            "Error near line " + line + ": " + hint + "\n";
        }
        else if (error instanceof playground.c.lib.NotYetImplemented)
        {
          line = playground.c.lib.Node._currentNode.line;
          hint =
            "This feature is not yet implemented in LearnCS!: " +
            error.thingNotImplemented;
          message = hint + "\n";
        }
        else
        {
          line = playground.c.lib.Node._currentNode.line;
          hint =
            error + "\n" + error.stack;
          message = 
            "[3]Internal error near line " + line + ": " + hint + "\n";
          developer = true;
        }
        
        // Show the error in the editor
        try
        {
          qx.core.Init.getApplication().showError(
            {
              first_line   : line,
              first_column : 0,
              last_line    : line,
              last_column  : 9999
            },
            hint);
        }
        catch(e)
        {
          // fails in non-gui environment
        }

        // Output the error message
        playground.c.Main.output(message);
        
        // Send the error message as a status report
        playground.c.Main._statusReport(
          {
            type       : "exit_crash",
            exit_crash : message,
            developer  : developer
          });

        // Set program state
        qx.core.Init.getApplication().setProgramState("crashed");

        playground.c.Main.output(
          ">>> Program had errors. It did not run to completion.\n");

        if (typeof process != "undefined")
        {
          process.exit(1);
        }
      };

      // Set program state
      qx.core.Init.getApplication().setProgramState("running");

      // Process the abstract syntax tree to create symbol tables
      root.process(
        data,
        false,
        function()
        {
          var             message;

          if (playground.c.Main.debugFlags.symtab)
          {
            playground.c.lib.Symtab.display();
          }

          intSize = Memory.typeSize["int"];
          ptrSize = Memory.typeSize["pointer"];

          // Get the symbol table entry for main, if it exists
          symtab = playground.c.lib.Symtab.getByName("*");
          entry = symtab.get("main", true);

          if (entry)
          {
            // If this entry's first specifier/declarator indicates it's a
            // function...
            declarator = entry.getSpecAndDecl()[0];
            if (declarator.getType() == "function")
            {
              // ... then that's our entry node
              entryNode = declarator.getFunctionNode();
            }
          }

          // Process the abstract syntax tree from the entry point, if it
          // exists, to run the program
          if (entryNode)
          {
            playground.c.Main.output("\n>>> Running program\n");

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

            // Retrieve the command line and push the arguments onto the stack. 
            try
            {
              // Get the raw command line from the text field
              cmdLine =
                qx.core.Init.getApplication().getUserData("cmdLine").getValue();
            }
            catch(e)
            {
              // Not a GUI environment
              cmdLine = playground.c.Main.commandLine;
            }
            
            // Replace each occurrence of backslash followed by a space with
            // the non-ASCII character code 0xff.
            cmdLine = (cmdLine || "").replace(/\\ /g, "\377");

            // Split the command line at remaining (non-escaped) spaces
            argv = cmdLine ? cmdLine.split(/\s+/) : [];

            // Map the 0xff markers back to spaces within each argument.
            argv = argv.map(
              function(arg)
              {
                return arg.replace(/\377/g, " ");
              });

            // Trim white space from all elements. (Applies to first/last)
            argv.map(
              function(arg)
              {
                return arg.trim();
              });
            
            if (argv.length > 0)
            {
              // Leading whitespace leaves an empty argument. Is it there?
              if (argv[0].length === 0)
              {
                // Yup. Remove it.
                argv.shift();
              }

              // Trailing whitespace leaves an empty argument. Is it there?
              if (argv[argv.length - 1].length === 0)
              {
                // Yup. Remove it.
                argv.pop();
              }
            }
            
            // Push the program name onto the argument list
            argv.unshift("a.out");

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
              "Stack: Activation Record 0: " + function_decl.children[0].value);

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
                getName         : function() { return "return to line #"; },
                getType         : function() { return "int"; },
                getUnsigned     : function() { return false; },
                getSize         : function() { return intSize; },
                getPointerCount : function() { return 0; },
                getArraySizes   : function() { return []; },
                getIsParameter  : function() { return false; }
              });

            // Set symbol info for the root symbol table's symbols
            playground.c.lib.Symtab.getByName("*").addSymbols();

            // Process main()
            try
            {
              entryNode.process(
                data,
                true,
                function(value)
                {
                  // Run any finalization functions
                  playground.c.Main.finalize.forEach(
                    function(finalize)
                    {
                      finalize();
                    });

                  completion(value.value === 127 ? "crashed" : "idle");
                  
                  // Show them their exit value
                  playground.c.Main.output(
                    ">>> " +
                    "Program exited with exit code " + value.value + "\n");

                  // Send the error message as a status report
                  playground.c.Main._statusReport(
                    {
                      type      : "exit",
                      exit_code : value.value
                    });

                    if (typeof process != "undefined")
                    {
                      process.exit(value.value);
                    }
                  }.bind(entryNode),
                  function(e)
                  {
                    catchError(e);
                  });
              }
              catch(e)
              {
                catchError(e);
              }
          }
          else
          {
            message = "Missing main() function\n";
            
            // Output the error message
            playground.c.Main.output(message);

            // Send the error message as a status report
            playground.c.Main._statusReport(
              {
                type       : "exit_crash",
                exit_crash : message
              });

            // Set program state
            qx.core.Init.getApplication().setProgramState("idle");

            if (typeof process != "undefined")
            {
              process.exit(1);
            }
          } 
        }.bind(root),
        catchError);
    }
  }
});
