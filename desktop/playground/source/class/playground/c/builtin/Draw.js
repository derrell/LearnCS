/**
 * Built-in functions to support including draw.h
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

qx.Class.define("playground.c.builtin.Draw",
{
  type   : "static",
  
  statics :
  {
    _drawCanvas     : null,

    include : function(name, line)
    {
      var             rootSymtab;
      var             mem;
      var             terminal;
      var             graphicsCanvas;
      var             clazz = playground.c.builtin.Draw;
      
      try
      {
        // Get the memory singleton instance
        mem = playground.c.machine.Memory.getInstance();

        // Get the root symbol table
        rootSymtab = playground.c.lib.Symtab.getByName("*");

        // Show the graphics canvas. Save the graphics canvas for later use.
        terminal = qx.core.Init.getApplication().getUserData("terminal");
        graphicsCanvas = terminal.getGraphicsCanvas();
        graphicsCanvas.show();
        
        clazz._drawCanvas = new qx.ui.embed.Canvas().set(
          {
            syncDimension : true
          });
        graphicsCanvas.add(clazz._drawCanvas, { edge : 0 } );

        //
        // ... then add built-in functions.
        //
        [
          {
            name : "draw_begin",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Draw.draw_begin.apply(null, args);
            }
          },
          {
            name : "draw_finish",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Draw.draw_finish.apply(null, args);
            }
          },
          {
            name : "draw_moveTo",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Draw.draw_moveTo.apply(null, args);
            }
          },
          {
            name : "draw_lineTo",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Draw.draw_lineTo.apply(null, args);
            }
          },
          {
            name : "draw_setColor",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Draw.draw_setColor.apply(null, args);
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
    
    /**
     * Begin drawing an object
     */
    draw_begin : function(success, failure)
    {
      var             clazz = playground.c.builtin.Draw;
      var             context = clazz._drawCanvas.getContext2d();
      var             specOrDecl;

      // Begin a path
      context.beginPath();

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");
      
      // Return 0, although the return value is intended to be ignored
      success(
        {
          value       : 0,
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Finish drawing an object
     */
    draw_finish : function(success, failure, bFill)
    {
      var             clazz = playground.c.builtin.Draw;
      var             context = clazz._drawCanvas.getContext2d();
      var             specOrDecl;

      // Either fill or stroke, as requested
      if (bFill)
      {
        context.fill();
      }
      else
      {
        context.stroke();
      }

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");
      
      // Return 0, although the return value is intended to be ignored
      success(
        {
          value       : 0,
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Move the pen to the specified location
     */
    draw_moveTo : function(success, failure, x, y)
    {
      var             clazz = playground.c.builtin.Draw;
      var             context = clazz._drawCanvas.getContext2d();
      var             specOrDecl;

      // Move to the specified coordinates
      context.moveTo(x, y);

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");
      
      // Return 0, although the return value is intended to be ignored
      success(
        {
          value       : 0,
          specAndDecl : [ specOrDecl ]
        });
    },
    
    draw_lineTo : function(success, failure, x, y)
    {
      var             clazz = playground.c.builtin.Draw;
      var             context = clazz._drawCanvas.getContext2d();
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");
      
      // Draw a line from the current coordinates to the given coordinates
      context.lineTo(x, y);

      // Return 0, although the return value is intended to be ignored
      success(
        {
          value       : 0,
          specAndDecl : [ specOrDecl ]
        });
    },
    
    draw_setColor : function(success, failure, color)
    {
      var             clazz = playground.c.builtin.Draw;
      var             context = clazz._drawCanvas.getContext2d();
      var             specOrDecl;
      var             i;
      var             memBytes;
      var             jStr;

      // Get memory as an array
      if (! this._mem)
      {
        this._mem = playground.c.machine.Memory.getInstance();
      }

      memBytes = this._mem.toArray(0);

      // Convert the ASCII color string to a JavaScript string
      for (jStr = [], i = color; memBytes[i] != 0 && i < memBytes.length; i++)
      {
        jStr.push(memBytes[i]);
      }
      color = String.fromCharCode.apply(null, jStr);
            
      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");
      
      // Set the stroke (line) and fill colors
      context.strokeStyle = color;
      context.fillStyle = color;

      // Return 0, although the return value is intended to be ignored
      success(
        {
          value       : 0,
          specAndDecl : [ specOrDecl ]
        });
    }
  }
});
