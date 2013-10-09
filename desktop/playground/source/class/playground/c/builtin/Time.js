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

qx.Class.define("playground.c.builtin.Time",
{
  type   : "static",
  
  statics :
  {
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
            name : "time",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Time.time.apply(null, args);
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
/*
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
*/
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

        // Define types
        [
          {
            name : "time_t",
            func : function(entry, node)
            {
              var             specifier;
              specifier = new playground.c.lib.Specifier(node, "int");
              specifier.setSize("long");
              specifier.setSigned("unsigned");
              specifier.setStorage("typedef");

              entry.setSpecAndDecl(
                [
                  specifier
                ]);
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

            // Create the symbol table entry for this typedef
            entry = rootSymtab.add(info.name, 0, true, false, false);
            if (! entry)
            {
              throw new playground.c.lib.RuntimeError(
                node,
                info.name + " being redefined. " +
                  "Is stdio.h included multiple times?");
            }

            // Call the provided function to initialize the value and create and
            // set she specifier/declarator list in the symbol table entry
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
    finalize : function()
    {
    },
*/

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

      if (! retType)
      {
        throw new Error("Internal error: return type not provided");
      }

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
     * Get the current time, in seconds since the epoch (Midnight, 1 Jan 1970)
     */
    time : function(success, failure, pTime)
    {
      playground.c.builtin.Time._commonFunction(
        function(v)
        {
          // Change type from int to unsigned long
          v.specAndDecl[0].setSize("long");
          v.specAndDecl[0].setSigned("unsigned");
          success(v);
        },
        failure,
        function()
        {
          var             mem;
          var             t;
          
          // Get the number of seconds since the epoch (ignore milliseconds)
          t = (new Date()).getTime() / 1000;

          // If we were asked to store the time value...
          if (pTime != 0)
          {
            // Get the memory singleton instance
            mem = playground.c.machine.Memory.getInstance();
            
            // Store the time value at the specified location
            mem.set(pTime, "unsigned long", t);
          }
          
          // Give 'em the current time, as seconds since the epoch
          return t;
        },
        "Internal error: time() failed",
        "int");                // changed to unsigned long in success handler
    }
  }
});
