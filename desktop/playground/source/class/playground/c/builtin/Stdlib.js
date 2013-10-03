/**
 * Standard library functions provided by stdlib.h
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

qx.Class.define("playground.c.builtin.Stdlib",
{
  type   : "static",
  
  statics :
  {
    // The maximum random number returned by rand(). Allow adding 1 without
    // overflow, so that the return value from rand() can be [0, _RandMax]
    // (inclusive).
    _RandMax : 0x7ffffffe,

    __freeBlocks : [],
    __usedBlocks : [],

    include : function(name, line)
    {
      var             mem;
      var             rootSymtab;
      
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
            name : "abs",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.abs.apply(null, args);
            }
          },
          {
            name : "atoi",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.atoi.apply(null, args);
            }
          },
          {
            name : "atof",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.atof.apply(null, args);
            }
          },
          {
            name : "calloc",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.calloc.apply(null, args);
            }
          },
          {
            name : "exit",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.exit.apply(null, args);
            }
          },
          {
            name : "free",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.free.apply(null, args);
            }
          },
          {
            name : "labs",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.labs.apply(null, args);
            }
          },
          {
            name : "malloc",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.malloc.apply(null, args);
            },
            init : function()
            {
              // Create the table of available heap blocks.
              // Initially, the entire heap is one free block.
              playground.c.builtin.Stdlib.__freeBlocks = 
                [
                  {
                    start : playground.c.machine.Memory.info.heap.start,
                    size  : playground.c.machine.Memory.info.heap.length
                  }
                ];
              
              // Initially, there's nothing on the used block list
              playground.c.builtin.Stdlib.__usedBlocks = [];
            }
          },
          {
            name : "rand",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.rand.apply(null, args);
            }
          },
          {
            name : "srand",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Stdlib.srand.apply(null, args);
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

            // Add symbol to symbol table
            entry = rootSymtab.add(info.name, 0, false);
            if (! entry) 
            {
              throw new playground.c.lib.RuntimeError(
                node,
                info.name + " being redefined. " +
                  "Is stdlib.h included multiple times?");
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
            name : "RAND_MAX",
            func : function()
            {
              return (
                {
                  type  : "int",
                  value : playground.c.builtin.Stdlib._RandMax
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
                  "Is stdlib.h included multiple times?");
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

    finalize : function()
    {
      if (playground.c.builtin.Stdlib.__usedBlocks.length > 0)
      {
        playground.c.builtin.Stdlib.__usedBlocks.forEach(
          function(block)
          {
            playground.c.Main.output(
              "*** Unfreed memory allocated at line " + block.line + ": " + 
                block.size + " bytes, at address " +
                (playground.view.c.MemoryWord.addrBase == 16 ? "0x" : "") +
                block.start.toString(playground.view.c.MemoryWord.addrBase) + 
                "\n");
          });
      }
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
        // If stdlib debugging is enabled...
        if (playground.c.lib.Preprocessor.pragma.debugFlags.stdlib)
        {
          // Could not do the specified conversion with the provided arguments.
          failure(new playground.c.lib.RuntimeError(
                    playground.c.lib.Node._currentNode,
                    errorStr));
          return;
        }
        
        // Debugging is not enabled. Just ignore the error.
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

    /**
     * Determine the absolute value of a number
     */
    abs : function(success, failure, value)
    {
      playground.c.builtin.Stdlib._commonFunction(
        success,
        failure,
        function()
        {
          return Math.abs(value);
        },
        "Internal error: abs() failed");
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
      if (! this._mem)
      {
        this._mem = playground.c.machine.Memory.getInstance();
      }

      memBytes = this._mem.toArray(0);

      // Copy the null-terminated format string (which is represented as the
      // ASCII character codes of each character) from the given address, one
      // character at a time, into an array.
      for (i = str; memBytes[i] != 0 && i < memBytes.length; i++)
      {
        jStr.push(memBytes[i]);
      }
      
      playground.c.builtin.Stdlib._commonFunction(
        success,
        failure,
        function()
        {
          return parseFloat(String.fromCharCode.apply(null, jStr));
        },
        "atof() called with something other than " +
        "a string containing a number");
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
      if (! this._mem)
      {
        this._mem = playground.c.machine.Memory.getInstance();
      }

      memBytes = this._mem.toArray(0);

      // Copy the null-terminated format string (which is represented as the
      // ASCII character codes of each character) from the given address, one
      // character at a time, into an array.
      for (i = str; memBytes[i] != 0 && i < memBytes.length; i++)
      {
        jStr.push(memBytes[i]);
      }
      
      playground.c.builtin.Stdlib._commonFunction(
        success,
        failure,
        function()
        {
          return parseInt(String.fromCharCode.apply(null, jStr), 10);
        },
        "atoi() called with something other than " +
        "a string containing a number");
    },
    
    calloc : function(success, failure, numElem, elemSize)
    {
      var             numBytes = numElem * elemSize;

      // First, allocate the requested number of bytes
      playground.c.builtin.Stdlib.malloc(
        function(value)
        {
          var             i;
          var             addr = value.value;

          // Get memory as an array
          if (! this._mem)
          {
            this._mem = playground.c.machine.Memory.getInstance();
          }

          // Fill each byte with null
          for (i = 0; i < numBytes; i++)
          {
            this._mem.set(addr++, "char", 0);
          }
          
          // Return the value provided by malloc()
          success(value);
        },
        failure,
        numBytes);
    },

    exit : function(success, failure, exitCode)
    {
      failure(new playground.c.lib.Exit(exitCode));
    },

    free : function(success, failure, addr)
    {
      var             j;
      var             usedlist = playground.c.builtin.Stdlib.__usedBlocks;

      // Find the address to be freed in the used block list
      for (j = 0; j < usedlist.length; j++)
      {
        // Did we find the block being freed?
        if (usedlist[j].start === addr)
        {
          // No need to search further
          break;
        }
      }
      
      // Did we find the block being freed?
      if (j == usedlist.length)
      {
        // Nope. Fail the request.
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "Attempting to free() address " + 
                    (playground.view.c.MemoryWord.addrBase == 16 ? "0x" : "") +
                    addr.toString(playground.view.c.MemoryWord.addrBase) +
                    " which is not currently malloced."));
        return;
      }
      
      // Get the memory singleton
      if (! this._mem)
      {
        this._mem = playground.c.machine.Memory.getInstance();
      }

      // Remove the symbol info from the memory template view
      this._mem.setSymbolInfo(
        addr,
        {
          getName         : function() 
          {
            return "free at line " + playground.c.lib.Node._currentNode.line;
          },
          getType         : function() { return "char"; },
          getUnsigned     : function() { return true; },
          getSize         : function() { return 1; },
          getPointerCount : function() { return 0; },
          getArraySizes   : function() { return [ usedlist[j].origNumBytes ]; },
          getIsParameter  : function() { return false; }
        });

      // Remove this block from the used list
      usedlist.splice(j, 1);
          
      // We successfully freed the block
      success();
    },
    
    labs : null,                // initialized in defer to use abs

    malloc : function(success, failure, numBytes)
    {
      var             i;
      var             j;
      var             start = 0; // null
      var             origNumBytes = numBytes;
      var             usedBlock;
      var             specAndDecl = [];
      var             freelist = playground.c.builtin.Stdlib.__freeBlocks;
      var             usedlist = playground.c.builtin.Stdlib.__usedBlocks;
      var             WORDSIZE = playground.c.machine.Memory.WORDSIZE;

      // Ensure that blocks are always allocated on word boundaries by
      // enlarging each request to be a multiple of WORDSIZE bytes.
      if (numBytes % WORDSIZE !== 0)
      {
        numBytes += WORDSIZE - numBytes % WORDSIZE;
      }

      // Find the first free block that's large enough for the required number
      // of bytes.
      for (i = 0; i < freelist.length; i++)
      {
        // Is there room in this block?
        if (freelist[i].size > numBytes)
        {
          // Yup. Save this address
          start = freelist[i].start;
          
          // Reduce this block's size by the number of bytes being allocated
          freelist[i].size -= numBytes;
          
          // Increase its starting address too
          freelist[i].start += numBytes;
          
          // Create a used block entry
          usedBlock =
            {
              start        : start,
              size         : numBytes,
              origNumBytes : origNumBytes,
              line         : playground.c.lib.Node._currentNode.line
            };

          // Add a 'used' block to the used block list. See where to insert it.
          for (j = 0; j < usedlist.length - 1; j++)
          {
            // Does it fit here?
            if (usedlist[j].start < start && usedlist[j + 1].start > start)
            {
              // Yes. Insert it
              usedlist.splice(j + 1, 0, usedBlock);
              
              // Note that we've inserted it
              usedBlock = null;
              
              // No need to search further
              break;
            }
          }
          
          // Did we insert the used block?
          if (usedBlock)
          {
            // No. It must go at the very end
            usedlist.push(usedBlock);
          }
          
          // Get the memory singleton
          if (! this._mem)
          {
            this._mem = playground.c.machine.Memory.getInstance();
          }

          this._mem.setSymbolInfo(
            start,
            {
              getName         : function() 
              {
                return "malloc at line " +
                  playground.c.lib.Node._currentNode.line;
              },
              getType         : function() { return "char"; },
              getUnsigned     : function() { return true; },
              getSize         : function() { return 1; },
              getPointerCount : function() { return 0; },
              getArraySizes   : function() { return [ origNumBytes ]; },
              getIsParameter  : function() { return false; }
            });
        }
      }
      
      // If we get here, there is no memory of the required size
      // available. 'start' is still NULL. Regardless of whether we found, or
      // didn't find, a memory block to return, give 'em the current 'start'
      // pointer.
      specAndDecl.push(new playground.c.lib.Declarator(
                         playground.c.lib.Node._currentNode,
                         "pointer"));
      specAndDecl.push(new playground.c.lib.Specifier(
                         playground.c.lib.Node._currentNode,
                         "void"));

      success(
        {
          value       : start,
          specAndDecl : specAndDecl
        });
    },
    
    rand : function(success, failure)
    {
      playground.c.builtin.Stdlib._commonFunction(
        success,
        failure,
        function()
        {
          return Math.floor(
            Math.random() * (playground.c.builtin.Stdlib._RandMax + 1));
        },
        "Internal error: rand() failed");
    },

    srand : function(success, failure, x)
    {
      failure(new playground.c.lib.RuntimeError(
                playground.c.lib.Node._currentNode,
                "srand() is not supported in LearnCS! since the random " +
                "number generator is pre-seeded. If you would like to " +
                "make your program portable by retaining the call to " +
                "srand(), use it like this:\n" +
                "#ifndef LEARNCS\n" +
                "  srand(seedVal);\n" +
                "#endif"));
    }
  },
  
  defer : function(statics)
  {
    // use abs() on any call to labs()
    statics.labs = statics.abs;
  }
});
