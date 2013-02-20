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
        Char     : 0,           // all initialized in defer()
        Short    : 0,
        Int      : 0,
        Long     : 0,
        LongLong : 0,
        Float    : 0,
        Double   : 0,
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
      var             TF  = learncs.lib.SymtabEntry.TypeFlags;
      var             SIB = learncs.lib.SymtabEntry.SizeInBytes;

console.log("getAddr: name=" + this.__name);

      // If it's a function, its node is stored specially
      if (this.__typeFlags & TF.Function)
      {
console.log("getAddr: Return node for function");
        return this.__node;
      }
      
      ret = this.__symtab.getFramePointer() + this.__offset;
console.log("getAddr: returning address " + ret.toString(16));
      return ret;




      // First, determine if this is a global/static, or an automatic variable.
      // We know it's a global/static if it's in the root symbol table, which
      // has no parent.
      bGlobal = (! this.__symtab.getParent());
      
      // If it's global, then the address is the entry's offset.
      if (bGlobal)
      {
console.log("getAddr: Return global offset " + this.__offset);
        return this.__offset;
      }
      
      // It's not global, so its address is based on the frame
      // pointer. Find the appropriate frame pointer for this symbol table.
      for (i = 0, symtab = this.__symtab.getParent(); 
           symtab; 
           ++i, symtab = symtab.getParent())
      {
        // nothing to do; just looping until we hit the end of the symtab list.
      }

      // We know which frame pointer to use now. Retrieve it.
      fp = learncs.lib.Symtab.framePointers[i];
(function()
 {
   var x = 0;
   for (x = learncs.lib.Symtab._symtabStack.length - 1; x >= 0; x--)
   {
     console.log("symtabStack[" + x + "] = " + learncs.lib.Symtab._symtabStack[x].getName());
   }
   for (x = 0; x < learncs.lib.Symtab.framePointers.length; x++)
   {
     console.log("framePointers[" + x + "] = " + learncs.lib.Symtab.framePointers[x].toString(16));
   }
 })();
console.log("getAddr: found i=" + i + ", fp=" + fp.toString(16) + ", offset=" + this.__offset);

      // Return the now-fully-qualified offset from the current frame pointer
      ret = fp + this.__offset;
console.log("getAddr: returning address " + ret.toString(16));
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

    getTypes : function()
    {
      return this.__typeFlags;
    },

    getType : function()
    {
      var             types = this.__typeFlags;
      var             typeList = [];
      var             TF = learncs.lib.SymtabEntry.TypeFlags;

      if (types & TF.Unsigned)
      {
        typeList.push("unsigned");
      }

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

      if (types & TF.LongLong)
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
      // Every new symbol begins on a multiple of WORDSIZE bytes, for easy
      // display.
      this.__symtab.nextOffset += 
        this.__size + ((SIB.Word - this.__size) % SIB.Word);
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
    statics.__mem = learncs.machine.Memory.getInstance();

    statics.SizeInBytes.Char =
      learncs.machine.Memory.typeSize["char"];
    statics.SizeInBytes.Short = 
      learncs.machine.Memory.typeSize["short"];
    statics.SizeInBytes.Int = 
      learncs.machine.Memory.typeSize["int"];
    statics.SizeInBytes.Long = 
      learncs.machine.Memory.typeSize["long"];
    statics.SizeInBytes.LongLong = 
      learncs.machine.Memory.typeSize["long long"];
    statics.SizeInBytes.Float = 
      learncs.machine.Memory.typeSize["float"];
    statics.SizeInBytes.Double = 
      learncs.machine.Memory.typeSize["double"];
    statics.SizeInBytes.Word = 
      learncs.machine.Memory.WORDSIZE;
  }
});
