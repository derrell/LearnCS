/**
 * Symbol Table  Entry
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var qx = require("qooxdoo");
require("../machine/Memory");

qx.Class.define("learncs.lib.SymtabEntry",
{
  extend : qx.core.Object,
  
  construct : function(name, bIsType, symtab, line)
  {
    this.base(arguments);

    // this symbol's name
    this.__name = name;

    // identifier for this entry
    this.id = learncs.lib.SymtabEntry.__nextEntryId++;

    // whether this entry is a type definition
    this.__bIsType = bIsType;

    // See TypeFlags statics
    this.__typeFlags = 0;

    // user-defined type name, if bIsType
    this.__typeName = null;

    // symbol table containing structure entries
    this.__structSymtab = null,

    // the symbol table of this entry
    this.__symtab = symtab;

    // number of asterisks
    this.__pointerCount = 0;

    // calculated size, based on the typeFlags
    this.__size = 0;

    // offset from the base pointer (in activation record, at the beginning
    // of automatic local variable portion)
    this.__offset = symtab.nextOffset;

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

    /** Bit fields in the typeFlags field of an Entry */
    TypeFlags :
      {
        Char     : 1 << 0,
        Short    : 1 << 1,
        Int      : 1 << 2,
        Long     : 1 << 3,
        LongLong : 1 << 4,

        Float    : 1 << 5,
        Double   : 1 << 6,

        Unsigned : 1 << 7,

        Function : 1 << 8
      },

    /** Bit fields in the storageFlags field of an Entry */
    StorageFlags :
      {
        Static   : 1 << 0,
        Const    : 1 << 1,
        Volatile : 1 << 2
      },

    /** Size, in bytes, of each type */
    SizeInBytes :
      {
        Char     : 1,
        Short    : 2,
        Int      : 4,
        Long     : 4,
        LongLong : 8,
        Float    : 4,
        Double   : 8
      }
  },
  
  members :
  {
    getAddr : function()
    {
      var             fp;
      var             bGlobal;
      var             TF  = learncs.lib.SymtabEntry.TypeFlags;

      // First, determine if this is a global/static, or an automatic variable.
      // We know it's a global/static if it's in the root symbol table, which
      // has no parent.
      bGlobal = (! this.__symtab.getParent());
      
      // If it's a function, its node is stored specially
      if (this.__typeFlags & TF.Function)
      {
        return this.__node;
      }
      
      // If it's global, then the address is the entry's offset.
      if (bGlobal)
      {
        return this.__offset;
      }
      
      // It's not global, so its address is based on the frame
      // pointer. Retrieve the frame pointer.
      fp = learncs.lib.SymtabEntry.__mem.getReg("FP", "unsigned int");
      
      // The frame pointer points to the return address. Therefore, the first
      // automatic local variable -- the one with offset 0 -- is actually at
      // four less than the frame pointer. Calculate and return the actual
      // address of this symbol, based on the frame pointer.
      return fp - (4 + this.__offset);
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

    getTypes : function()
    {
      return this.__typeFlags;
    },

    getType : function()
    {
      var             types = this.__typeFlags;
      var             typeList = [];
      var             TF = learncs.lib.SymtabEntry.TypeFlags;

      // List previously-added types
      if (types & TF.Char)
      {
        typeList.push("char");
      }

      if (types & TF.Short)
      {
        typeList.push("short");
      }

      if (types & TF.Long)
      {
        typeList.push("long");
      }

      if (types & TF.Int && ! (types & TF.Short) && ! (types & TF.Long))
      {
        typeList.push("int");
      }

      if (types & TF.Float)
      {
        typeList.push("float");
      }

      if (types & TF.Double)
      {
        typeList.push("double");
      }

      // Give 'em a string listing all of those, and the new type
      return typeList.join(" ");
    },

    setType : function(type, node)
    {
      var             TF  = learncs.lib.SymtabEntry.TypeFlags;
      var             SIB = learncs.lib.SymtabEntry.SizeInBytes;

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
      }

      // Specify the next symbol's (tentative) offset based on this one's size
      // (It's tentative, because this function can be called multiple times:
      // once for each modifier, e.g. for "unsigned long int" it will be called
      // three times.)
      //
      // Every new symbol begins on a multiple of 4 bytes, for easy display
      this.__symtab.nextOffset += this.__size + ((4 - this.__size) % 4);
    },

    getIsUnsigned : function()
    {
      // Return a true binary, not the null indicating that it's not yet set.
      return !!this.bUnsigned;
    },

    setIsUnsigned : function(bIsUnsigned)
    {
      // If signedness has not been specified yet...
      if (this.bUnsigned === null)
      {
        // ... then specify it.
        this.bUnsigned = bIsUnsigned;
        return;
      }

      // Can't set signedness multiple times.
      this.error("Signedness was previously specified");
    },

    getIsFloat : function()
    {
      // Return a true binary, not the null indicating that it's not yet set.
      return !!this.bUnsigned;
    },

    setIsFloat : function(bIsFloat)
    {
      // If floatedness has not been specified yet...
      if (this.bFloat === null)
      {
        // ... then specify it.
        this.bFloat = bIsFloat;
        return;
      }

      // Can't set signedness multiple times.
      if (this.bFloat)
      {
        this.error("Previously specified to be floating point");
      }
      else
      {
        this.error("Previously specified to be an integer");
      }
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

    getPointerCount : function()
    {
      return this.__pointerCount;
    },

    incrementPointerCount : function()
    {
      ++this.__pointerCount;
    },

    getLine : function()
    {
      return this.__line;
    },

    error : function(message)
    {
      sys.print("Error: line " + this.__line + ": " + message + "\n");
      ++error.errorCount;
    },

    display : function()
    {
      var             key;

      sys.print("\n");

      for (key in this)
      {
        if (this.hasOwnProperty(key) && 
            ! key.match(/^\$\$/) &&
            typeof this[key] != "function")
        {
          sys.print("\t" + key + " = " + this[key] + "\n");
        }
      }
    },
    
    __types : function(checkTypes, thisType, otherTypes)
    {
      var             typeList = [];
      var             TF = learncs.lib.SymtabEntry.TypeFlags;

      // List previously-added types
      if ((checkTypes & TF.Char) && (otherTypes & TF.Char))
      {
        typeList.push("char");
      }

      if ((checkTypes & TF.Short) && (otherTypes & TF.Short))
      {
        typeList.push("short");
      }

      if ((checkTypes & TF.Int) && (otherTypes & TF.Int))
      {
        typeList.push("int");
      }

      if ((checkTypes & TF.Long) && (otherTypes & TF.Long))
      {
        typeList.push("long");
      }

      if ((checkTypes & TF.Float) && (otherTypes & TF.Float))
      {
        typeList.push("float");
      }

      if ((checkTypes & TF.Double) && (otherTypes & TF.Double))
      {
        typeList.push("double");
      }

      // Give 'em a string listing all of those, and the new type
      return typeList.join(", ") + " with " + thisType;
    }
  },
  
  defer : function(statics)
  {
    learncs.lib.SymtabEntry.__mem = learncs.machine.Memory.getInstance();
  }
});
