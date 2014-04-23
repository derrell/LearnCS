/**
 * Built-in functions to support including elevator.h
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

qx.Class.define("playground.c.builtin.Elevator",
{
  type   : "static",
  
  statics :
  {
    Event :
    {
      NONE         : 0,                // no button has been pressed

      UP           : 1,
      DOWN         : 2,
      OPEN         : 3,
      CLOSE        : 4,
      
      AT_TOP       : 5,
      AT_BOTTOM    : 6,
      
      DOORS_OPEN   : 7,
      DOORS_CLOSED : 8,

      TIMER        : 100
    },

    _graphicsCanvas : null,
    _elevator       : null,
    _opening        : null,
    _butUp          : null,
    _butDown        : null,
    _butOpen        : null,
    _butClose       : null,
    _state          : null,
    _timer          : null,
    _eventQueue     : null,
    _lastTime       : 0,

    include : function(name, line)
    {
      var             rootSymtab;
      var             mem;
      var             terminal;
      
      try
      {
        // Get the memory singleton instance
        mem = playground.c.machine.Memory.getInstance();

        // Get the root symbol table
        rootSymtab = playground.c.lib.Symtab.getByName("*");

        // Show the graphics canvas. Save the graphics canvas for later use.
        terminal = qx.core.Init.getApplication().getUserData("terminal");
        this._graphicsCanvas = terminal.getGraphicsCanvas();
        this._graphicsCanvas.show();
        
        // Show the elevator and buttons in the graphics canvas
        this._initAll();

        //
        // ... then add built-in functions.
        //
        [
          {
            name : "elevatorDown",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Elevator.elevatorDown.apply(null, args);
            }
          },
          {
            name : "elevatorUp",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Elevator.elevatorUp.apply(null, args);
            }
          },
          {
            name : "elevatorOpenDoors",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Elevator.elevatorOpenDoors.apply(null, args);
            }
          },
          {
            name : "elevatorCloseDoors",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Elevator.elevatorCloseDoors.apply(null, 
                                                                     args);
            }
          },
          {
            name : "elevatorGetEvent",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Elevator.elevatorGetEvent.apply(null, args);
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
     * Show the elevator and buttons, in their initial location
     */
    _initAll : function()
    {
      var             door1;
      var             door2;
      var             clazz = playground.c.builtin.Elevator;
      
      // Get the current time, so we know if it's time for a timer event
      clazz._lastTime = new Date();

      // Initialize the state
      clazz._state = "doors-closed";

      // Initialize the event queue
      clazz._eventQueue = [];

/* already removed by terminal.resetGraphicsCanvas()
      // If the elevator exists, dispose of it and the buttons
      if (clazz._elevator)
      {
        clazz._graphicsCanvas.remove(clazz._elevator);
        clazz._graphicsCanvas.remove(clazz._butUp);
        clazz._graphicsCanvas.remove(clazz._butDown);
        clazz._graphicsCanvas.remove(clazz._butOpen);
        clazz._graphicsCanvas.remove(clazz._butClose);
      }
*/

      //
      // Add the elevator
      //

      // Create the elevator container
      clazz._elevator = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      clazz._elevator.set(
        {
          height : 100,
          width  : 100
        });

      // Add the left door
      door1 = new qx.ui.basic.Atom();
      door1.set(
        {
          width           : 5,
          minWidth        : 0,
          backgroundColor : "gray"
        });
      clazz._elevator.add(door1, { flex : 1 });

      // Add the opening between the doors
      clazz._opening = new qx.ui.basic.Atom();
      clazz._opening.set(
        {
          width           : 2,
          minWidth        : 0,
          backgroundColor : "blue"
        });
      clazz._elevator.add(clazz._opening);

      // Add the right door
      door2 = new qx.ui.basic.Atom();
      door2.set(
        {
          width           : 5,
          minWidth        : 0,
          backgroundColor : "gray"
        });
      clazz._elevator.add(door2, { flex : 1 });

      // Add the elevator to the graphics canvas
      clazz._graphicsCanvas.add(
        clazz._elevator,
        {
          left : 140,
          top  : 10
        });
      
      //
      // Add the buttons
      //

      clazz._butUp = new qx.ui.form.Button("2");
      clazz._graphicsCanvas.add(
        clazz._butUp,
        {
          left  : 20, 
          top   : 20
        });
      clazz._butUp.addListener(
        "execute",
        function(e)
        {
          clazz._eventQueue.push(clazz.Event.UP);
        });

      clazz._butDown = new qx.ui.form.Button("1");
      clazz._graphicsCanvas.add(
        clazz._butDown,
        {
          left  : 20, 
          top   : 50
        });
      clazz._butDown.addListener(
        "execute",
        function(e)
        {
          clazz._eventQueue.push(clazz.Event.DOWN);
        });

      clazz._butOpen = new qx.ui.form.Button("Open");
      clazz._graphicsCanvas.add(
        clazz._butOpen,
        {
          left  : 54, 
          top   : 20
        });
      clazz._butOpen.addListener(
        "execute",
        function(e)
        {
          clazz._eventQueue.push(clazz.Event.OPEN);
        });

      clazz._butClose = new qx.ui.form.Button("Close");
      clazz._graphicsCanvas.add(
        clazz._butClose,
        {
          left  : 54, 
          top   : 50
        });
      clazz._butClose.addListener(
        "execute",
        function(e)
        {
          clazz._eventQueue.push(clazz.Event.CLOSE);
        });
    },
    
    /**
     * Move the elevator up, from floor 1 to floor 2
     */
    elevatorUp : function(success, failure)
    {
      var             clazz = playground.c.builtin.Elevator;
      var             specOrDecl;
        
      // Ensure that we're in the correct state
      switch(clazz._state)
      {
      case "doors-closed" :
        break;
        
      case "doors-open" :
      case "doors-opening" :
      case "doors-closing" :
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "Request to move elevator up while " +
                  "elevator doors are open."));
        return;
        
      case "moving" :
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "Request to move elevator up while " +
                  "elevator is already moving."));
        return;
      }

      // Change state
      clazz._state = "moving";

      // Create a timer for the animation
      clazz._timer = new qx.event.Timer(15);

      // Handle each frame of the animation
      clazz._timer.addListener(
        "interval",
        function()
        {
          var   newTop;
            
          // Get the new top position of the elevator
          newTop = clazz._elevator.getLayoutProperties().top - 1;
          
          // Don't get any higher than the maximum
          if (newTop < 10)
          {
            newTop = 10;
          }

          // Cause the elevator to move in the canvas
          clazz._elevator.setLayoutProperties(
              {
                top : newTop
              });
          
          // Have we reached our ending point?
          if (newTop <= 10)
          {
            // Yup. Animation is complete
            clazz._timer.dispose();
            clazz._timer = null;

            // Change state
            clazz._state = "doors-closed";
            
            // Fire the event indicating that the elevator is at the top floor
            clazz._eventQueue.push(clazz.Event.AT_TOP);
          }
        },
        this);
      
      // Begin the animation
      clazz._timer.start();

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
     * Move the elevator down, from floor 2 to floor 1
     */
    elevatorDown : function(success, failure)
    {
      var             clazz = playground.c.builtin.Elevator;
      var             specOrDecl;
        
      // Ensure that we're in the correct state
      switch(clazz._state)
      {
      case "doors-closed" :
        break;
        
      case "doors-open" :
      case "doors-opening" :
      case "doors-closing" :
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "Request to move elevator down while " +
                  "elevator doors are open."));
        return;
        
      case "moving" :
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "Request to move elevator down while " +
                  "elevator is already moving."));
        return;
      }

      // Change state
      clazz._state = "moving";

      // Create a timer for the animation
      clazz._timer = new qx.event.Timer(15);

      // Handle each frame of the animation
      clazz._timer.addListener(
        "interval",
        function()
        {
          var   newTop;
            
          // Get the new top position of the elevator
          newTop = clazz._elevator.getLayoutProperties().top + 1;
          
          // Don't get any lower than the minimum
          if (newTop < 10)
          {
            newTop = 140;
          }

          // Cause the elevator to move in the canvas
          clazz._elevator.setLayoutProperties(
              {
                top : newTop
              });
          
          // Have we reached our ending point?
          if (newTop >= 140)
          {
            // Yup. Animation is complete
            clazz._timer.dispose();
            clazz._timer = null;

            // Change state
            clazz._state = "doors-closed";
            
            // Fire the event indicating that the elevator is at the top floor
            clazz._eventQueue.push(clazz.Event.AT_BOTTOM);
          }
        },
        this);
      
      // Begin the animation
      clazz._timer.start();

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
     * Open the elevator doors
     */
    elevatorOpenDoors : function(success, failure)
    {
      var             clazz = playground.c.builtin.Elevator;
      var             specOrDecl;
        
      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Ensure that we're in the correct state
      switch(clazz._state)
      {
      case "doors-closed" :
        break;
        
      case "doors-closing" :
        // Stop the animation of the doors closing
        clazz._timer.dispose();
        clazz._timer = null;
        break;

      case "doors-open" :
      case "doors-opening" :
        // Already open or opening, so ignore this request
        // Return 0, although the return value is intended to be ignored
        success(
          {
            value       : 0,
            specAndDecl : [ specOrDecl ]
          });
        return;
        
      case "moving" :
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "Request to open doors while elevator is moving."));
        return;
      }

      // Change state
      clazz._state = "doors-opening";

      // Create a timer for the animation
      clazz._timer = new qx.event.Timer(15);

      // Handle each frame of the animation
      clazz._timer.addListener(
        "interval",
        function()
        {
          var   newWidth;
            
          // Get the new width of the open area
          newWidth = clazz._opening.getWidth() + 2;
          
          // Don't get any more open than the maximum
          if (newWidth > 90)
          {
            newWidth = 90;
          }

          // Cause doors to appear to move
          clazz._opening.set(
              {
                width    : newWidth,
                maxWidth : newWidth
              });
          
          // Have we reached our ending point?
          if (newWidth >= 90)
          {
            // Yup. Animation is complete
            clazz._timer.dispose();
            clazz._timer = null;

            // Change state
            clazz._state = "doors-open";
            
            // Fire the event indicating that elevator doors are fully open
            clazz._eventQueue.push(clazz.Event.DOORS_OPEN);
          }
        },
        this);
      
      // Begin the animation
      clazz._timer.start();

      // Return 0, although the return value is intended to be ignored
      success(
        {
          value       : 0,
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Close the elevator doors
     */
    elevatorCloseDoors : function(success, failure)
    {
      var             clazz = playground.c.builtin.Elevator;
      var             specOrDecl;
        
      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Ensure that we're in the correct state
      switch(clazz._state)
      {
      case "doors-closed" :
      case "doors-closing" :
        // Already closed or closing, so ignore this request
        // Return 0, although the return value is intended to be ignored
        success(
          {
            value       : 0,
            specAndDecl : [ specOrDecl ]
          });
        return;

      case "doors-open" :
       break;

      case "doors-opening" :
        // Stop the animation of the doors opening
        clazz._timer.dispose();
        clazz._timer = null;
        break;
        
      case "moving" :
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "Request to close doors while elevator is moving."));
        return;
      }

      // Change state
      clazz._state = "doors-closing";

      // Create a timer for the animation
      clazz._timer = new qx.event.Timer(15);

      // Handle each frame of the animation
      clazz._timer.addListener(
        "interval",
        function()
        {
          var   newWidth;
            
          // Get the new width of the open area
          newWidth = clazz._opening.getWidth() - 2;
          
          // Don't get any more closed than the minimum
          if (newWidth < 2)
          {
            newWidth = 2;
          }

          // Cause doors to appear to move
          clazz._opening.set(
              {
                width    : newWidth,
                maxWidth : newWidth
              });
          
          // Have we reached our ending point?
          if (newWidth <= 2)
          {
            // Yup. Animation is complete
            clazz._timer.dispose();
            clazz._timer = null;

            // Change state
            clazz._state = "doors-closed";
            
            // Fire the event indicating that elevator doors are fully closed
            clazz._eventQueue.push(clazz.Event.DOORS_CLOSED);
          }
        },
        this);
      
      // Begin the animation
      clazz._timer.start();

      // Return 0, although the return value is intended to be ignored
      success(
        {
          value       : 0,
          specAndDecl : [ specOrDecl ]
        });
    },
    
    /**
     * Get the next queued button press
     */
    elevatorGetEvent : function(success, failure)
    {
      var             clazz = playground.c.builtin.Elevator;
      var             specOrDecl;
      var             event;
      var             now;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Get the current times
      now = new Date();
      
      // Get the first event on the queue
      event = clazz._eventQueue.shift();
      
      // Was there an event there?
      if (event)
      {
        // Yup. Nothing else to do.
      }
      else if (now.getTime() > clazz._lastTime.getTime() + 1000)
      {
        // There was no event waiting, but it's been more than one second
        // since the last timer event was fired. Fire one now.
        clazz._lastTime = now;
        
        // ... and generate a Timer event
        event = clazz.Event.TIMER;
      }
      else
      {
        // There are no queued events, and it hasn't been one second yet. We
        // have no event to provide to the user.
         event = clazz.Event.NONE;
      }

      // Return the first button value from the button queue, or NONE
      success(
        {
          value       : event,
          specAndDecl : [ specOrDecl ]
        });
    }
  }
});
