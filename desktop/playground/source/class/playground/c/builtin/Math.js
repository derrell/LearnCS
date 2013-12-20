/**
 * Built-in functions to support including math.h
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

        // Determine the value of NaN. Set the individual bytes that represent
        // 32-bit NaN, in the appropriate order based on endianness.
        if (bLittleEndian)
        {
          data[0] = 0x00;
          data[1] = 0x00;
          data[2] = 0xc0;
          data[3] = 0x7f;
        }
        else
        {
          data[0] = 0x7f;
          data[1] = 0xc0;
          data[2] = 0x00;
          data[3] = 0x00;
        }

        // Read those four bytes as a double to obtain our NaN value
        playground.c.builtin.Math._NaN = mem.getReg("R1", "double");

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
            name : "asin",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.asin.apply(null, args);
            }
          },
          {
            name : "atan",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.atan.apply(null, args);
            }
          },
          {
            name : "ceil",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.ceil.apply(null, args);
            }
          },
          {
            name : "cos",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.cos.apply(null, args);
            }
          },
          {
            name : "exp",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.exp.apply(null, args);
            }
          },
          {
            name : "fabs",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.fabs.apply(null, args);
            }
          },
          {
            name : "floor",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.floor.apply(null, args);
            }
          },
          {
            name : "log",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.log.apply(null, args);
            }
          },
          {
            name : "log2",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.log2.apply(null, args);
            }
          },
          {
            name : "log10",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.log10.apply(null, args);
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
          },
          {
            name : "tan",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Math.tan.apply(null, args);
            }
          }
        ].forEach(
          function(info)
          {
            var             entry;
            var             declarator;
            var             node;

            // If there's an initialization function...
            if (info.init)
            {
              // ... then call it
              info.init();
            }

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
            name : "M_E",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 2.7182818284590452354	// e
                });
            }
          },
          {
            name : "M_LOG2E",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 1.4426950408889634074	// log_2 e
                });
            }
          },
          {
            name : "M_LOG10E",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 0.43429448190325182765	// log_10 e
                });
            }
          },
          {
            name : "M_LN2",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 0.69314718055994530942	// log_e 2
                });
            }
          },
          {
            name : "M_LN10",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 2.30258509299404568402	// log_e 10
                });
            }
          },
          {
            name : "M_PI",
            func : function()
            {
              return (
                {
                  type  : "double", 
                  value : 3.14159265358979323846
                });
            }
          },
          {
            name : "M_PI_2",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 1.57079632679489661923	// pi/2
                });
            }
          },
          {
            name : "M_PI_4",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 0.78539816339744830962	// pi/4
                });
            }
          },
          {
            name : "M_1_PI",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 0.31830988618379067154	// 1/pi
                });
            }
          },
          {
            name : "M_2_PI",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 0.63661977236758134308	// 2/pi
                });
            }
          },
          {
            name : "M_2_SQRTPI",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 1.12837916709551257390	// 2/sqrt(pi)
                });
            }
          },
          {
            name : "M_SQRT2",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 1.41421356237309504880	// sqrt(2)
                });
            }
          },
          {
            name : "M_SQRT1_2",
	    func : function()
            {
              return (
                {
                  type  : "double",
                  value : 0.70710678118654752440	// 1/sqrt(2)
                });
            }
          },
          {
            name : "NAN",
            func : function()
            {
              return (
                {
                  type  : "double", 
                  value : playground.c.builtin.Math._NaN
                });
            }
          }
        ].forEach(
          function(info)
          {
            var             entry;
            var             node;
            var             def;
            var             specifier;

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

            // Get the type and value for the constant
            def = info.func();

            // Create a specifier for this constant
            specifier = new playground.c.lib.Specifier(node, def.type);
            specifier.setConstant("constant");

            // Add the specifier/declarator list to the symtab entry
            entry.setSpecAndDecl(
              [
                specifier
              ]);
            entry.calculateOffset();
            
            // Save the constant's value
            mem.set(entry.getAddr(), def.type, def.value);
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
     * provided function
     */
    _commonFunction : function(success, failure, fConvert, errorStr, retType)
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
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.acos(x);
        },
        "acos() called with invalid argument: " + x);
    },

    asin : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.asin(x);
        },
        "asin() called with invalid argument: " + x);
    },

    atan : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.atan(x);
        },
        "atan() called with invalid argument: " + x);
    },

    ceil : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.ceil(x);
        },
        "ceil() called with invalid argument: " + x);
    },

    cos : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.cos(x);
        },
        "cos() called with invalid argument: " + x);
    },

    exp : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.exp(x);
        },
        "exp() called with invalid argument: " + x);
    },

    fabs : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          if (isNaN(x))
          {
            return playground.c.builtin.Math._NaN;
          }
          
          if (x < 0.0)
          {
            return -x;
          }
          
          return x;
        },
        "fabs() called with invalid argument: " + x);
    },

    floor : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.floor(x);
        },
        "floor() called with invalid argument: " + x);
    },

    log : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.log(x);
        },
        "log() called with invalid argument: " + x);
    },

    log2 : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.LOG2E * Math.log(x);
        },
        "log2() called with invalid argument: " + x);
    },

    log10 : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.LOG10E * Math.log(x);
        },
        "log10() called with invalid argument: " + x);
    },

    pow : function(success, failure, x, y)
    {
      playground.c.builtin.Math._commonFunction(
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
      playground.c.builtin.Math._commonFunction(
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
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.sqrt(x);
        },
        "sqrt() called with invalid argument: " + x);
    },

    tan : function(success, failure, x)
    {
      playground.c.builtin.Math._commonFunction(
        success,
        failure,
        function()
        {
          return Math.tan(x);
        },
        "tan() called with invalid argument: " + x);
    }
  }
});
