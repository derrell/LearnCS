/**
 * Built-in functions to support including learncs.h
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
@ignore(require)
 */

/**
 * @ignore(require)
 * @ignore(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
}

qx.Class.define("playground.c.builtin.Learncs",
{
  type   : "static",
  
  statics :
  {
    include : function(name, line)
    {
      var             rootSymtab;
      var             mem;
      
      try
      {
        // Get the memory singleton instance
        mem = playground.c.machine.Memory.getInstance();

        // Get the root symbol table
        rootSymtab = playground.c.lib.Symtab.getByName("*");

        //
        // ... then add built-in functions.
        //
        [
          {
            name : "getInteger",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Learncs.getInteger.apply(null, args);
            }
          },
          {
            name : "getString",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Learncs.getString.apply(null, args);
            }
          }
        ].forEach(
          function(info)
          {
            var             entry;
            var             declarator;
            var             node;

            // Simulate a node, for the specifiers and declarators
            node =
              {
                line : line,
                toString : function()
                {
                  return info.name;
                }
              };

            // Add the symbol table entry
            entry = rootSymtab.add(info.name, 0, false);
            if (! entry)
            {
              throw new playground.c.lib.RuntimeError(
                node,
                info.name + " being redefined. " +
                  "Is learncs.h included multiple times?");
            }
            declarator = new playground.c.lib.Declarator(
              {
                line : line,
                toString : function()
                {
                  return info.name;
                }
              });
            declarator.setBuiltIn(info.func);

            // Add the declarator to the symbol table entry
            entry.setSpecAndDecl( [ declarator ]);
          },
          this);

        // Define constants
        [
/*
          {
            name : "M_PI",
            func : function(entry, node)
            {
              var             specifier;
              specifier = new playground.c.lib.Specifier(node, "double");
              specifier.setConstant("constant");

              entry.setSpecAndDecl(
                [
                  specifier
                ]);
              entry.calculateOffset();
              mem.set(entry.getAddr(), "double", 3.14159265358979323846);
            }
          }
*/
        ].forEach(
          function(info)
          {
            var             entry;
            var             node;

            // Simulate a node, for the specifiers and declarators
            node =
              {
                line : line,
                toString : function()
                {
                  return info.name;
                }
              };

            // Create the symbol table entry for this defined constant
            entry = rootSymtab.add(info.name, 0, false, false, true);
            if (! entry)
            {
              throw new playground.c.lib.RuntimeError(
                node,
                info.name + " being redefined. " +
                  "Is math.h included multiple times?");
            }

            // Call the provided function to initialize the value and create
            // and set she specifier/declarator list in the symbol table entry
            info.func(entry, node);
          });
      }
      catch(e)
      {
        return e;
      }
      
      return null;
    },

    /*
     * Reads a line of text from standard input and returns it as an int.
     */
    getInteger : function(success, failure)
    {
      var             ch;
      var             input = [];
      var             specOrDecl;
      var             INT_MAX = 2147483647;
      
      (function getNextChar()
       {
         playground.c.stdio.Stdio.fgetc(
           function(ret)
           {
             // Retrieve the character that was input
             ch = String.fromCharCode(ret.value);

             if (ret.value != playground.c.stdio.AbstractFile.EOF)
             {
               // Ignore leading white space
               if (input.length != 0 ||
                   (ch != '\n' && ch != '\r' && ch != ' ' && ch != '\t'))
               {
                 input.push(ch);
               }
             }

             if (ch == '\n' || ret.value == playground.c.stdio.AbstractFile.EOF)
             {
               // Was there any input at all?
               if (input.length === 0)
               {
                 failure(new playground.c.lib.RuntimeError(
                           playground.c.lib.Node._currentNode,
                           "\nExpected input to be an integer, but reached " +
                             "EOF before any digits (User input error)"));
                 return;
               }
               
               // Was the input valid, i.e., beginning with a digit?
               if (! input[0].match(/[-0-9]/))
               {
                 failure(new playground.c.lib.RuntimeError(
                           playground.c.lib.Node._currentNode,
                           "Expected input to be an integer, but got " +
                             input.join("") + " (User input error)"));
                 return;
               }

               // Create a specifier for the return value
               specOrDecl = new playground.c.lib.Specifier(
                 playground.c.lib.Node._currentNode,
                 "int");

               // Flush the input buffer of any trailing garbage
               playground.c.stdio.Stdin._inBuf = [];

               // Return the parsed integer value, truncated to 32 bits
               success(
                 {
                   value       : parseInt(input.join(""), 10),
                   specAndDecl : [ specOrDecl ]
                 });
               return;
             }
             
             // Retrieve the next character
             getNextChar();
           },
           failure,
           playground.c.Main.stdin);
       })();
    },
    
    /**
     * Reads a line of text from standard input. This function is exactly
     * equivalent to calling fgets() with stdin as the handle.
     */
    getString : function(success, failure, destAddr, size)
    {
      var             stdin;
      
      stdin = playground.c.stdio.Stdio._stdinFileHandle;
      playground.c.stdio.Stdio.fgets(success, failure, destAddr, size, stdin);
    }
  }
});
