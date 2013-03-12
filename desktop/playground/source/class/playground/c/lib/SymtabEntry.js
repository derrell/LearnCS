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
  
  construct : function(name, bIsType, symtab, line)
  {
    this.base(arguments);

    // this symbol's name
    this.__name = name;

    // identifier for this entry
    this.id = playground.c.lib.SymtabEntry.__nextEntryId++;

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

    // array sizes. null indicates no size specified
    this.__arraySizes = [];

    // calculated size, based on the typeFlags
    this.__size = 0;

    // number of elements (i.e., of an array)
    this.__count = 1;

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

        Function : 1 << 8,
        BuiltIn  : 1 << 9       // a built-in function, e.g., printf
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
      var             TF  = playground.c.lib.SymtabEntry.TypeFlags;
      var             SIB = playground.c.lib.SymtabEntry.SizeInBytes;

      // If it's a function, its node is stored specially.
      // If it's a built-in function, its JS function reference is stored.
      if ((this.__typeFlags & TF.Function) ||
          (this.__typeFlags & TF.BuiltIn))
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

    getTypes : function()
    {
      return this.__typeFlags;
    },

    getType : function()
    {
      var             types = this.__typeFlags;
      var             typeList = [];
      var             TF = playground.c.lib.SymtabEntry.TypeFlags;

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
      
      if (types & TF.Function)
      {
        typeList.push("function");
      }
      
      if (types & TF.BuiltIn)
      {
        typeList.push("built-in");
      }

      // Give 'em a string listing all of those, and the new type
      return typeList.join(" ");
    },

    setType : function(type, node)
    {
      var             TF  = playground.c.lib.SymtabEntry.TypeFlags;
      var             SIB = playground.c.lib.SymtabEntry.SizeInBytes;

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
      //
      // Every new symbol begins on a multiple of WORDSIZE bytes, for easy
      // display.
      if ((this.__typeFlags & (TF.Function | TF.BuiltIn)) === 0)
      {
        this.__symtab.nextOffset += 
          (this.__size * this.__count) + ((SIB.Word - this.__size) % SIB.Word);
      }
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

    getCount : function()
    {
      return this.__count;
    },
    
    setCount : function(count)
    {
      this.__count = count;
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

    getArraySizes : function()
    {
      return this.__arraySizes;
    },
    
    addArraySize : function(size)
    {
      this.__arraySizes.push(size);
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
          console.log("\t" + key + " = " + this[key]);
        }
      }
    },
    
    __types : function(checkTypes, thisType, otherTypes)
    {
      var             typeList = [];
      var             TF = playground.c.lib.SymtabEntry.TypeFlags;

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
    statics.SizeInBytes.Word = 
      playground.c.machine.Memory.WORDSIZE;
  }
});
