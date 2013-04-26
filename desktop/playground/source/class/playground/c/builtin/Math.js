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
     * Determine the sine of a number
     */
    sin : function(success, failure, value)
    {
      var             converted;
      var             specOrDecl;
      
      converted = Math.sin(value);

      if (isNaN(converted))
      {
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "sin() called with invalid argument: " + value));
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
     * Determine the square root of a number
     */
    sqrt : function(success, failure, value)
    {
      var             converted;
      var             specOrDecl;
      
      converted = Math.sqrt(value);

      if (isNaN(converted))
      {
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "sqrt() called with invalid argument: " + value));
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
    }
  }
});
