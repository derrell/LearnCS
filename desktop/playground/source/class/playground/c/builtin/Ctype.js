/**
 * Character type functions, provided by ctype.h
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
 * @lint ignoreUndefined(require)
 * @lint ignoreUndefined(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
}

qx.Class.define("playground.c.builtin.Ctype",
{
  type   : "static",
  
  statics :
  {
    include : function(name, line)
    {
      var             rootSymtab;
      
      try
      {
        // Get the root symbol table
        rootSymtab = playground.c.lib.Symtab.getByName("*");

        //
        // ... then add built-in functions.
        //
        [
          {
            name : "toupper",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.toupper.apply(null, args);
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

            // Add printf
            entry = rootSymtab.add(info.name, 0, false);
            if (! entry)
            {
              throw new playground.c.lib.RuntimeError(
                node,
                info.name + " being redefined. " +
                  "Is ctype.h included multiple times?");
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
      }
      catch(e)
      {
        return e;
      }
      
      return null;
    },

    /**
     * Convert a character to its upper-case equivalent, if such exists
     */
    toupper : function(success, failure, c)
    {
      var             converted;
      var             specOrDecl;
      
      if (typeof c != "number")
      {
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "toupper() called with something other than a number"));
        return;
      }

      // Is the character is currently lower case?
      if (c >= 0x61 && c <= 0x7a)
      {
        // Yup. Convert it to upper case.
        c &= ~0x20;
      }

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      success(
        {
          value       : c,
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Convert a number in a character string to a double
     * 
     * @param str {String}
     *   The string to be convered to an integer
     */
    atof : function(success, failure, str)
    {
      var             i;
      var             memBytes;
      var             jStr = [];
      var             converted;
      var             specOrDecl;

      // Get memory as an array
      this._mem = playground.c.machine.Memory.getInstance();
      memBytes = this._mem.toArray(0);

      // Copy the null-terminated format string (which is represented as the
      // ASCII character codes of each character) from the given address, one
      // character at a time, into an array.
      for (i = str; memBytes[i] != 0 && i < memBytes.length; i++)
      {
        jStr.push(memBytes[i]);
      }
      
      // Convert the string into an integer
      converted = parseFloat(String.fromCharCode.apply(null, jStr));

      if (isNaN(converted))
      {
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "atof() called with something other than " +
                    "a string containing a number"));
      }
      else
      {
        // Create a specifier for the return value
        specOrDecl = new playground.c.lib.Specifier(
          playground.c.lib.Node._currentNode,
          "double");

        success(
          {
            value       : converted,
            specAndDecl : [ specOrDecl ]
          });
      }
    },


    /**
     * Convert a number in a character string to an integer
     * 
     * @param str {String}
     *   The string to be convered to an integer
     */
    atoi : function(success, failure, str)
    {
      var             i;
      var             memBytes;
      var             jStr = [];
      var             converted;
      var             specOrDecl;

      // Get memory as an array
      this._mem = playground.c.machine.Memory.getInstance();
      memBytes = this._mem.toArray(0);

      // Copy the null-terminated format string (which is represented as the
      // ASCII character codes of each character) from the given address, one
      // character at a time, into an array.
      for (i = str; memBytes[i] != 0 && i < memBytes.length; i++)
      {
        jStr.push(memBytes[i]);
      }
      
      // Convert the string into an integer
      converted = parseInt(String.fromCharCode.apply(null, jStr), 10);

      if (isNaN(converted))
      {
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "atoi() called with something other than " +
                    "a string containing a number"));
      }
      else
      {
        // Create a specifier for the return value
        specOrDecl = new playground.c.lib.Specifier(
          playground.c.lib.Node._currentNode,
          "int");

        success(
          {
            value       : converted,
            specAndDecl : [ specOrDecl ]
          });
      }
    }
  }
});
