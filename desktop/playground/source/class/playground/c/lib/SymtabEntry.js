/**
 * Symbol Table  Entry
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
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 */
if (typeof qx === 'undefined')
{
  var qx = require("qooxdoo");
  require("../machine/Memory");
}

qx.Class.define("playground.c.lib.SymtabEntry",
{
  extend : qx.core.Object,
  
  construct : function(name, bIsType, bIsParameter, symtab, line)
  {
    this.base(arguments);

    // this symbol's name
    this.__name = name;

    // identifier for this entry
    this.id = playground.c.lib.SymtabEntry.__nextEntryId++;

    // whether this entry is a type definition
    this.__bIsType = bIsType;

    // whether this entry represents a parameter to a function
    this.__bIsParameter = bIsParameter;

    // See TypeFlags statics
    this.__typeFlags = 0;

    // user-defined type name, if bIsType
    this.__typeName = null;

    // symbol table containing structure entries
    this.__structSymtab = null,

    // the symbol table of this entry
    this.__symtab = symtab;

    // offset from the base pointer (in activation record, at the beginning
    // of automatic local variable portion)
    this.__offset = symtab.nextOffset;

    // specifier/declarator list
    this.__specAndDecl = null;

    // node to process, for functions
    this.__node = null;

    // line number on which this symbol was defined
    this.__line = line;
  },
  
  statics :
  {
    /** Next entry id, assigned to every symbol table entry */
    __nextEntryId : 0,

    /** Retained reference to memory (initialized in defer()) */
    __mem : null,

    /** Size, in bytes, of each type */
    SizeInBytes :
      {
        Char     : 0,           // all initialized in defer()
        Short    : 0,
        Int      : 0,
        Long     : 0,
        LongLong : 0,
        Float    : 0,
        Double   : 0,
        Pointer  : 0,
        Word     : 0
      },

    getInfo : function(specAndDecl)
    {
      var             i;
      var             type;
      var             count;
      var             size = 1;
      var             component;
      var             bSizeDone = false;
      var             parts = [];
      var             sd;
      var             SIB = playground.c.lib.SymtabEntry.SizeInBytes;

      // Traverse this provided specifier/declarator list, calculating its
      // textual type representation and its size.
      for (i = 0; i < specAndDecl.length; i++)
      {
        // Get the current specifier or declarator
        sd = specAndDecl[i];
        
        // Set the size and add to the parts of the type
        switch(type = sd.getType())
        {
          //
          // Specifier types
          //

        case "int" :
          // The size of an int is determined by the getSize() propery
          switch(sd.getSize())
          {
          case "short" :
            if (! bSizeDone)
            {
              size *= SIB.Short;
            }

            // Stop calculating size
            bSizeDone = true;
            
            parts.push("short");
            break;

          case "long" :
            if (! bSizeDone)
            {
              size *= SIB.Long;
            }

            // Stop calculating size
            bSizeDone = true;
            
            parts.push("long");
            break;

          case "long long" :
            if (! bSizeDone)
            {
              size *= SIB.LongLong;
            }

            // Stop calculating size
            bSizeDone = true;
            
            parts.push("long long");
            break;

          case null :
            if (! bSizeDone)
            {
              size *= SIB.Int;
            }

            // Stop calculating size
            bSizeDone = true;
            
            parts.push("int");
            break;

          default :
            throw new Error("Internal Error: " +
                            "Unexpected specifier size: " + sd.getSize());
            break;
          }
          break;

        case "float" :
          if (! bSizeDone)
          {
            size *= SIB.Float;
          }

          // Stop calculating size
          bSizeDone = true;

          parts.push("float");
          break;

        case "double" :
          if (! bSizeDone)
          {
            size *= SIB.Double;
          }

          // Stop calculating size
          bSizeDone = true;

          parts.push("double");
          break;

        case "char" :
          if (! bSizeDone)
          {
            size *= SIB.Char;
          }

          // Stop calculating size
          bSizeDone = true;

          parts.push("char");
          break;

        case "void" :
          throw new Error("Don't yet know type/size of void");
          break;

        case "struct" :
          throw new Error("Don't yet know type/size of struct");
          break;

        case "union" :
          throw new Error("Don't yet know type/size of label");
          break;

        case "enum" :
          throw new Error("Don't yet know type/size of label");
          break;

        case "label" :
          throw new Error("Don't yet know how to get type/size of label");
          break;


          //
          // Declarator types
          //

        case "array" :
          count = sd.getArrayCount() || 0;
          size *= count;

          parts.push("array[" + (count || "") + "] of ");
          break;

        case "function" :
          // Stop calculating size
          bSizeDone = true;
          
          parts.push("function");
          break;

        case "pointer" :
          size *= SIB.Pointer;

          // Stop calculating size
          bSizeDone = true;

          parts.push("ptr to ");
          break;

        case "builtIn" :
          // Stop calculating size
          bSizeDone = true;
          break;


          //
          // Some unrecognized type. Programmer error.
          //

        default :
          throw new Error("Internal error: " +
                          "Unexpected specifier type: " + sd.getType());
          break;
        }
        
        // If we hit a function or builtIn declarator...
        if (type == "function" || type == "builtIn")
        {
          // ... traverse no farther.
          break;
        }
      }
      
      component = specAndDecl[0].getType();
      if (component == "array")
      {
        component += "[" + (specAndDecl[0].getArrayCount() || "") + "]";
      }

      return (
        {
          description : parts.join(""),
          size        : size,
          component   : component
        });
    }
  },
  
  members :
  {
    __cache : null,

    getAddr : function()
    {
      var             i;
      var             fp;
      var             ret;
      var             offset;
      var             bGlobal;
      var             symtab;
      var             message;
      var             firstSpecOrDecl;
      var             TF  = playground.c.lib.SymtabEntry.TypeFlags;
      var             SIB = playground.c.lib.SymtabEntry.SizeInBytes;

      // If there is no specifier/declarator list yet...
      if (! this.__specAndDecl || this.__specAndDecl.length == 0)
      {
        // ... then we're being prematurely asked for the symbol's address
        message =
          "Error: line " + this.__line + ": " + 
          "The address of symbol " + this.__name + " was requested, " +
          "but the address is not yet known.";
        throw new playground.c.lib.RuntimeError(this, message);
      }
      
      // Look at the first element of the specAndDecl list. 
      firstSpecOrDecl = this.__specAndDecl[0];

      // If it's a function, its node is stored specially.
      // If it's a built-in function, its JS function reference is stored.
      switch(firstSpecOrDecl.getType())
      {
      case "function" :
        return firstSpecOrDecl.getFunctionNode();
        
      case "builtIn" :
        return firstSpecOrDecl.getBuiltIn();
        
      default:
        // Calculate the address of this symbol from its symbol table's frame
        // pointer and its own offset.
        ret = this.__symtab.getFramePointer() + this.__offset;
        return ret;
      }
    },

    getName : function()
    {
      return this.__name;
    },

    getId : function()
    {
      return this.id;
    },

    getIsType : function()
    {
      return this.__bIsType;
    },

    setIsType : function(bIsType)
    {
      this.__bIsType = bIsType;
    },

    setSpecAndDecl : function(specAndDecl)
    {
      this.__specAndDecl = specAndDecl;
    },
    
    getSpecAndDecl : function()
    {
      if (! this.__specAndDecl)
      {
        return null;
      }
      
      // Return a shallow clone of the array, so it can be altered as necessary
      return this.__specAndDecl.slice(0);
    },

    getSymtab : function()
    {
      return this.__symtab;
    },

    setStructSymtab : function(symtab)
    {
      this.__structSymtab = symtab;
    },

    getStructSymtab : function()
    {
      return this.__structSymtab;
    },

    getIsParameter : function()
    {
      return this.__bIsParameter;
    },

    getType : function()
    {
      // Have we already determined this symbol's type?
      if (typeof this.__type != "undefined")
      {
        // Yup. Just return it.
        return this.__type;
      }
      
      // Calculate this symbol's type and size by traversing the symbol's
      // specifier/declarator list.
      playground.lib.c.SymtabEntry.getInfo(this.__specAndDecl);
      
      // Give 'em what they came for
      return this.__type;
    },

    getSize : function()
    {
      // Have we already determined this symbol's size?
      if (typeof this.__size != "undefined")
      {
        // Yup. Just return it.
        return this.__size;
      }
      
      // Calculate this symbol's type and size by traversing the symbol's
      // specifier/declarator list.
      playground.lib.c.SymtabEntry.getInfo(this.__specAndDecl);
      
      // Give 'em what they came for
      return this.__size;
    },

    getLine : function()
    {
      return this.__line;
    },

    error : function(message)
    {
      console.log("Error: line " + this.__line + ": " + message + "\n");
      ++playground.c.lib.Node.getError().errorCount;
    },

    display : function()
    {
      var             key;

      console.log("");

      for (key in this)
      {
        if (this.hasOwnProperty(key) && 
            ! key.match(/^\$\$/) &&
            typeof this[key] != "function")
        {
          if (key == "__specAndDecl" && this[key])
          {
            this[key].forEach(
              function(specOrDecl, i)
              {
                if (specOrDecl)
                {
                  specOrDecl.display();
                }
                else
                {
                  console.log("\t__specOrDecl[" + i + "] = null");
                }
              });
            console.log(
              JSON.stringify(
                playground.c.lib.SymtabEntry.getInfo(this[key])));
          }
          else
          {
            console.log("\t" + key + " = " + this[key]);
          }
        }
      }
    }
  },
  
  defer : function(statics)
  {
    statics.__mem = playground.c.machine.Memory.getInstance();

    statics.SizeInBytes.Char =
      playground.c.machine.Memory.typeSize["char"];
    statics.SizeInBytes.Short = 
      playground.c.machine.Memory.typeSize["short"];
    statics.SizeInBytes.Int = 
      playground.c.machine.Memory.typeSize["int"];
    statics.SizeInBytes.Long = 
      playground.c.machine.Memory.typeSize["long"];
    statics.SizeInBytes.LongLong = 
      playground.c.machine.Memory.typeSize["long long"];
    statics.SizeInBytes.Float = 
      playground.c.machine.Memory.typeSize["float"];
    statics.SizeInBytes.Double = 
      playground.c.machine.Memory.typeSize["double"];
    statics.SizeInBytes.Pointer =
      playground.c.machine.Memory.typeSize["pointer"];
    statics.SizeInBytes.Word = 
      playground.c.machine.Memory.WORDSIZE;
  }
});
