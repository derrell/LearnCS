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
      }
  },
  
  members :
  {
    getAddr : function()
    {
      var             i;
      var             fp;
      var             ret;
      var             offset;
      var             bGlobal;
      var             symtab;
      var             message;
      var             firstSpecOrDeclType;
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
      firstSpecOrDeclType = this.__specAndDecl[0].getType();

      // If it's a function, its node is stored specially.
      // If it's a built-in function, its JS function reference is stored.
      if (firstSpecOrDeclType == "function" || firstSpecOrDeclType == "builtIn")
      {
        return this.__node;
      }
      
      // Calculate the address of this symbol from its symbol table's frame
      // pointer and its own offset.
      ret = this.__symtab.getFramePointer() + this.__offset;
      return ret;
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
console.log("  setSpecAndDecl(): entry=" + this + ", symtab=" + this.__symtab + ", specAndDecl.length=" + specAndDecl.length);
console.log("    specAndDecl[0]=" + specAndDecl[0]);

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

/*
    setType : function(type, node)
    {
      var             TF  = playground.c.lib.SymtabEntry.TypeFlags;
      var             SIB = playground.c.lib.SymtabEntry.SizeInBytes;
      var             product;
      var             mod;

      // Error checking
      switch(type)
      {
      case "char" :
      case "short" :
      case "float" :
      case "double" :
      case "long" :
        if (this.__typeFlags & (TF.Char | TF.Short | TF.Float | TF.Double))
        {
          this.error("Incompatible type combination: " +
                     this.__types(TF.Char | TF.Short | TF.Float | TF.Double,
                                  type, this.__typeFlags));
          return;
        }

        if ((type == "float" || type == "double") && 
            ((this.__typeFlags & TF.Long) || (this.__typeFlags & TF.Int)))
        {
          this.error("Incompatible type combination: " +
                     this.__types(TF.Float | TF.Double, type,
                                  this.__typeFlags));
          return;
        }
        break;

      case "unsigned" :
        if (this.__typeFlags & (TF.Float | TF.Double))
        {
          this.error("Incompatible type combination: " +
                     this.__types(TF.Float | TF.Double,
                                  type, this.__typeFlags));
          return;
        }
        break;

      case "int" :
        break;

      case "function" :
        break;

      case "built-in" :
        break;

      default:
        // We got a user-defined (typedef'ed) type
        this.__typeName = type;
        return;
      }

      // Now set the appropriate bit, the size, and the next offset
      switch(type)
      {
      case "char" :
        if (this.__typeFlags & TF.Char)
        {
          this.error("Type specified multiple times: " + type);
          return;
        }
        this.__typeFlags |= TF.Char;
        this.__size = SIB.Char;
        break;

      case "short" :
        if (this.__typeFlags & TF.Short)
        {
          this.error("Type specified multiple times: " + type);
          return;
        }
        this.__typeFlags |= TF.Short;
        this.__size = SIB.Short;
        break;

      case "float" :
        if (this.__typeFlags & TF.Float)
        {
          this.error("Type specified multiple times: " + type);
          return;
        }
        this.__typeFlags |= TF.Float;
        this.__size = SIB.Float;
        break;

      case "double" :
        if (this.__typeFlags & TF.Double)
        {
          this.error("Type specified multiple times: " + type);
          return;
        }
        this.__typeFlags |= TF.Double;
        this.__size = SIB.Double;
        break;

      case "int" :
        if (this.__typeFlags & TF.Int)
        {
          this.error("Type specified multiple times: " + type);
          return;
        }
        this.__typeFlags |= TF.Int;

        // this one may have already by set, e.g., short int
        if (this.__size === 0)
        {
          this.__size = SIB.Int;
        }
        break;

      case "long" :
        if (this.__typeFlags & TF.LongLong)
        {
          this.error("Type is too long: long long long");
          return;
        }
        this.__typeFlags |=
          (this.__typeFlags & TF.Long) ? TF.LongLong : TF.Long;
        this.__size =
          (this.__typeFlags & TF.LongLong) ? SIB.LongLong : SIB.Long;
        break;

      case "unsigned" :
        if (this.__typeFlags & TF.Unsigned)
        {
          this.error("Type specified multiple times: " + type);
          return;
        }
        this.__typeFlags |= TF.Unsigned;

        // Default to unsigned int, if not otherwise set; may get overridden
        if (this.__size === 0)
        {
          this.__size = SIB.Int;
        }
        break;

      case "function" :
        this.__typeFlags |= TF.Function;
        this.__size = 0;
        this.__node = node;     // save node to process when function is called
        break;

      case "built-in" :
        this.__typeFlags |= TF.BuiltIn;
        this.__size = 0;
        this.__node = node;    // save JavaSCript function reference
        break;
        
      default :
        throw new Error("Unexpected type: " + type);
        break;
      }

      // Specify the next symbol's (tentative) offset based on this one's size
      // (It's tentative, because this function can be called multiple times:
      // once for each modifier, e.g. for "unsigned long int" it will be called
      // three times.)
      if ((this.__typeFlags & (TF.Function | TF.BuiltIn)) === 0)
      {
        // Is it a pointer?
        if (this.__pointerCount)
        {
          // Yup. Set its size.
          this.__size = SIB.Pointer;
        }
        
        // Is it an array and a function parameter? That makes it a pointer.
        else if (this.__arraySizes.length !== 0 && this.__bIsParameter)
        {
          // Yup. Set its size.
          this.__size = SIB.Pointer;
        }
        
        // It's not a pointer of any type. Calculate its size.
        else
        {
          // Assume it's not an array, so we'll use the type's size
          product = 1;

          // Is it an array?
          if (this.__arraySizes.length)
          {
            // Yup. Calculate the number of elements.
            this.__arraySizes.forEach(
              function(size)
              {
                product *= size;
              });

            // Store the new size
            this.__size *= product;
          }
        }
        
        // Calculate the next symbol's offset. Every new symbol begins on a
        // multiple of WORDSIZE bytes, for easy display.
        this.__symtab.nextOffset += this.__size;
        mod = this.__size % SIB.Word;
        if (mod !== 0)
        {
          this.__symtab.nextOffset += SIB.Word - mod;
        }

        // If we're in the global symbol table...
        if (this.__symtab.getParent() == null)
        {
          // ... then add this symbol to memory, for later display
          playground.c.lib.Symtab._addSymbolInfo(this);
        }
      }
    },
*/

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

    getSize : function()
    {
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
