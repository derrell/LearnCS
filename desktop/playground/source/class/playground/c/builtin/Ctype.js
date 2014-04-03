/**
 * Character type functions, provided by ctype.h
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

qx.Class.define("playground.c.builtin.Ctype",
{
  type   : "static",
  
  statics :
  {
    /** upper case letter's ascii values. Initialized in defer */
    _UPPER : null,

    /** lower case letter's ascii values. Initialized in defer */
    _LOWER : null,

    /** upper can lower case letter's ascii values. Initialized in defer */
    _ALPHA : null,

    /** control code ascii values. Initialized in defer */
    _CONTROL : null,

    /** digits' ascii values. Initialized in defer */
    _DIGIT : null,

    /** upper white space ascii values. Initialized in defer */
    _SPACE : null,

    /** printable characters' ascii values. Initialized in defer */
    _PRINT : null,

    /** punctuation characters' ascii values. Initialized in defer */
    _PUNCT : null,

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
            name : "isdigit",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.isdigit.apply(null, args);
            }
          },
          {
            name : "isspace",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.isspace.apply(null, args);
            }
          },
          {
            name : "isupper",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.isupper.apply(null, args);
            }
          },
          {
            name : "islower",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.islower.apply(null, args);
            }
          },
          {
            name : "isalpha",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.isalpha.apply(null, args);
            }
          },
          {
            name : "iscntrl",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.iscntrl.apply(null, args);
            }
          },
          {
            name : "isprint",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.isprint.apply(null, args);
            }
          },
          {
            name : "ispunct",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.builtin.Ctype.ispunct.apply(null, args);
            }
          },
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

            // Add the symbol
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
     * Determine if a character is a digit
     */
    isdigit : function(success, failure, c)
    {
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Return true if the character is a digit; false otherwise
      success(
        {
          value       : (c >= 0x30 && c <= 0x39) ? 1 : 0,
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Determine if a character is whitespace
     */
    isspace : function(success, failure, c)
    {
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Return true if the character is whitespace
      success(
        {
          value       : (playground.c.builtin.Ctype._SPACE.indexOf(c) != -1
                         ? 1 : 0),
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Determine if a character is an upper case letter
     */
    isupper : function(success, failure, c)
    {
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Return true if the character is an upper case letter
      success(
        {
          value       : (playground.c.builtin.Ctype._UPPER.indexOf(c) != -1 
                         ? 1 : 0),
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Determine if a character is a lower case letter
     */
    islower : function(success, failure, c)
    {
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Return true if the character is an upper case letter
      success(
        {
          value       : (playground.c.builtin.Ctype._LOWER.indexOf(c) != -1
                         ? 1 : 0),
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Determine if a character is alpha (an upper or lower case character)
     */
    isalpha : function(success, failure, c)
    {
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Return true if the character is an upper or lower case letter
      success(
        {
          value       : (playground.c.builtin.Ctype._ALPHA.indexOf(c) != -1
                         ? 1 : 0),
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Determine if a character is a control code
     */
    iscntrl : function(success, failure, c)
    {
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Return true if the character is an upper case letter
      success(
        {
          value       : (playground.c.builtin.Ctype._CONTROL.indexOf(c) != -1
                         ? 1 : 0),
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Determine if a character is printable
     */
    isprint : function(success, failure, c)
    {
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Return true if the character is an upper case letter
      success(
        {
          value       : (playground.c.builtin.Ctype._PRINT.indexOf(c) != -1
                         ? 1 : 0),
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Determine if a character is punctuation (printable, but not space or
     * alphanumeric)
     */
    ispunct : function(success, failure, c)
    {
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // Return true if the character is an upper case letter
      success(
        {
          value       : (playground.c.builtin.Ctype._PUNCT.indexOf(c) != -1
                         ? 1 : 0),
          specAndDecl : [ specOrDecl ]
        });
    },

    /**
     * Convert a character to its upper-case equivalent, if such exists
     */
    toupper : function(success, failure, c)
    {
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
    }
  },
  
  defer : function(statics)
  {
    // upper case letters
    statics._UPPER =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(
        function(c)
        {
          return c.charCodeAt(0);
        });

    // lower case letters
    statics._LOWER =
      "abcdefghijklmnopqrstuvwxyz".split("").map(
        function(c)
        {
          return c.charCodeAt(0);
        });

    // alphabetic: upper and lower case letters
    statics._ALPHA = statics._UPPER.slice(0);
    Array.prototype.push.apply(statics._ALPHA, statics._LOWER);

    // control codes
    statics._CONTROL = 
      [
         0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 
        22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127
      ];

    // digit characters
    statics._DIGIT =
      "0123456789".split("").map(
        function(c)
        {
          return c.charCodeAt(0);
        });

    // whitespace
    statics._SPACE =
      " \t\n\v\f\r".split("").map(
        function(c)
        {
          return c.charCodeAt(0);
        });

    // printable characters
    statics._PRINT = (
      function()
      {
        var             i;
        var             printable = [];
        
        // Add all printable characters to the array
        for (i = 0x20; i <= 0x7e; i++)
        {
          printable.push(i);
        }
        
        return printable;
      })();
    
    // punctuation
    statics._PUNCT = statics._PRINT.filter(
      function(c)
      {
        return (
          statics._SPACE.indexOf(c) == -1 &&
          statics._ALPHA.indexOf(c) == -1 &&
          statics._DIGIT.indexOf(c) == -1);
      });
  }
});
