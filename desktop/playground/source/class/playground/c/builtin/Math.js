/**
 * Built-in functions to support including math.h
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

qx.Class.define("playground.c.builtin.Math",
{
  type   : "static",
  
  statics :
  {
    include : function(name, line)
    {
      var             rootSymtab;
      var             mem;
      var             bLittleEndian;
      var             ul;
      var             data;
      
      try
      {
        // Get the memory singleton instance
        mem = playground.c.machine.Memory.getInstance();

        // Get the root symbol table
        rootSymtab = playground.c.lib.Symtab.getByName("*");

        // Determine the endianness of the machine
        // Play with the R1 register. Gain access to its bytes.
        data = mem._getByType("unsigned char",
                              playground.c.machine.Memory.register["R1"],
                              4);

        // Individually set the four bytes of R1 to determine endianness
        data[0] = 0x00;
        data[1] = 0x01;
        data[2] = 0x02;
        data[3] = 0x03;

        // Read those four bytes as an unsigned long
        ul = mem.getReg("R1", "unsigned long");

        // Return true if this machine is little endian; false otherwise
        bLittleEndian = (ul == 0x03020100);

        // Determine the value of NaN
        if (bLittleEndian)
        {
          // Set the individual bytes that represent 32-bit NaN
          data[0] = 0x00;
          data[1] = 0x00;
          data[2] = 0xc0;
          data[3] = 0x7f;
          
          // Read those four bytes as a double
          playground.c.builtin.Math._NaN = mem.getReg("R1", "double");
        }

        //
        // ... then add built-in functions.
        //
        [
          {
            name : "acos",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.acos.apply(null, args);
            }
          },
          {
            name : "pow",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.pow.apply(null, args);
            }
          },
          {
            name : "sin",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.sin.apply(null, args);
            }
          },
          {
            name : "sqrt",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.sqrt.apply(null, args);
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
                  "Is math.h included multiple times?");
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
          {
            name : "NAN",
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
              mem.set(entry.getAddr(),
                      "double",
                      playground.c.builtin.Math._NaN);
            }
          }
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

    /**
     * Utility function for use when the result can be calculated within a
     * provided function, and a double is returned.
     */
    _common : function(success, failure, fConvert, errorStr, retType)
    {
      var             converted;
      var             specOrDecl;
      
      // Call the provided conversion function
      converted = fConvert();

      if (isNaN(converted))
      {
        // If math debugging is enabled...
        if (playground.c.lib.Preprocessor.pragma.debugFlags.math)
        {
          // Could not do the specified conversion with the provided arguments.
          failure(new playground.c.lib.RuntimeError(
                    playground.c.lib.Node._currentNode,
                    errorStr));
          return;
        }
        
        // Debugging is not enabled. Just return NaN
        converted = playground.c.builtin.Math._NaN;
      }

      // If no return type was provided, use "double"
      retType = retType || "double";

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        retType);

      // We were successful!
      success(
        {
          value       : converted,
          specAndDecl : [ specOrDecl ]
        });
    },

    acos : function(success, failure, x)
    {
      playground.c.builtin.Math._common(
        success,
        failure,
        function()
        {
          return Math.acos(x);
        },
        "acos() called with invalid argument: " + x);
    },

    pow : function(success, failure, x, y)
    {
      playground.c.builtin.Math._common(
        success,
        failure,
        function()
        {
          return Math.pow(x, y);
        },
        "pow() called with invalid arguments: " + x + ", " + y);
    },

    sin : function(success, failure, x)
    {
      playground.c.builtin.Math._common(
        success,
        failure,
        function()
        {
          return Math.sin(x);
        },
        "sin() called with invalid argument: " + x);
    },

    sqrt : function(success, failure, x)
    {
      playground.c.builtin.Math._common(
        success,
        failure,
        function()
        {
          return Math.sqrt(x);
        },
        "sqrt() called with invalid argument: " + x);
    }
  }
});
