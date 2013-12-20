/**
 * Symbol Table  Entry
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
@ignore(require)
@ignore(qx.bConsole)
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @ignore(require)
 * @ignore(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
  qx.bConsole = true;
  require("../machine/Memory");
}

qx.Class.define("playground.c.lib.SymtabEntry",
{
  extend : qx.core.Object,
  
  construct : function(name, bIsType, bIsParameter, bIsDefine, symtab, line)
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

    // save whether this is a #define
    this.__bIsDefine = bIsDefine;

    // offset from the base pointer (in activation record, at the beginning
    // of automatic local variable portion)
    this.__offset = bIsDefine ? symtab.nextDefine : symtab.nextOffset;

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
    
    getInfo : function(specAndDecl, obj)
    {
      var             i;
      var             type;
      var             bUnsigned = false;
      var             description;
      var             count;
      var             parts = [];
      var             arraySizes = [];
      var             pointerCount = 0;
      var             bDone = false;
      var             sd;

      // Traverse this provided specifier/declarator list, calculating its
      // textual type representation and its size.
      for (i = 0; i < specAndDecl.length && ! bDone; i++)
      {
        // Get the current specifier or declarator
        sd = specAndDecl[i];
        
        // Add to the parts of the type
        switch(type = sd.getType())
        {
          //
          // Specifier types
          //

        case "int" :
          // Add unsigned, if needed
          if (sd.getSigned() === "unsigned")
          {
            bUnsigned = true;
            parts.push("unsigned");
          }

          // The type and size of any int is determined by the getSize()
          // property
          type = sd.getSize() || "int";
          parts.push(type);
          
          // No need to loop further
          bDone = true;
          break;

        case "float" :
        case "double" :
          parts.push(type);
          
          // No need to loop further
          bDone = true;
          break;

        case "void" :
        case "struct" :
        case "union" :
        case "enum" :
          parts.push(type);
          break;

        case "label" :
          throw new Error("Don't yet know how to get type/size of label");
          break;


          //
          // Declarator types
          //

        case "array" :
          count = sd.getArrayCount() || -1;
          parts.push("array[" + count + "] of");

          arraySizes.push(count);
          break;

        case "function" :
          parts.push("function");
          
          // No need to loop further
          bDone = true;
          break;

        case "pointer" :
          parts.push("pointer to ");
          ++pointerCount;
          break;

        case "builtIn" :
          parts.push("builtIn");

          // No need to loop further
          bDone = true;
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
      
      // Calculate the complete type
      description = parts.join(" ");

      // If so requested, cache the type so it needn't be re-calculated
      if (obj)
      {
        obj.__type = type;
        obj.__bUnsigned = bUnsigned;
        obj.__pointerCount = pointerCount;
        obj.__arraySizes = arraySizes;
      }

      return (
        {
          type         : type,
          bUnsigned    : bUnsigned,
          pointerCount : pointerCount,
          arraySizes   : arraySizes,
          description  : description
        });
    }
  },
  
  members :
  {
    __node          : null,
    __size          : null,
    __type          : null,
    __pointerCount  : null,
    __arraySizes    : null,
    __structSymtab  : null,
    __typeFlags     : null,
    __typeName      : null,
    __line          : null,
    __name          : null,
    __symtab        : null,
    __specAndDecl   : null,
    __offset        : 0,
    __arrayCount    : 0,
    __bIsType       : false,
    __bIsDefine     : false,
    __bIsParameter  : false,
    __bUnsigned     : false,

    calculateOffset : function(bIsUnion)
    {
      var             byteCount = 0;
      var             remainder;
      var             specAndDecl;
      var             SIB = playground.c.lib.SymtabEntry.SizeInBytes;

      // Retrieve the specifier/declarator list
      specAndDecl = this.__specAndDecl;
      
      // We are supposed to have a list by now. Ensure we do.
      if (! specAndDecl)
      {
        throw new Error("Internal error: " +
                        "Expected specifier/declarator list to exist");
      }
      
      // Calculate the number of bytes consumed by the specifier or declarator
      // and possibly (recursively) its successors
      byteCount = specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
      
      // Calculate the remainder to add to the byte count, such that the next
      // offset will be on a word boundary.
      remainder = byteCount % SIB.Word;

      // Now we can update the offset of the next symbol in this symbol table
      if (this.__bIsDefine)
      {
        this.__symtab.nextDefine -= 
          (remainder === 0
           ? byteCount
           : byteCount + SIB.Word - remainder);
      }
      else if (! bIsUnion)
      {
        this.__symtab.nextOffset += 
          (remainder === 0
           ? byteCount
           : byteCount + SIB.Word - remainder);
      }
      
      // Save this symbol table entry's size
      this.__size = byteCount;
    },

    getAddr : function()
    {
      var             ret;
      var             message;
      var             firstSpecOrDecl;

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

    getOffset : function()
    {
      return this.__offset;
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

    getType : function(bMemAccess)
    {
      // Have we already determined this symbol's info?
      if (this.__type === null)
      {
        // Calculate this symbol's info by traversing the symbol's
        // specifier/declarator list.
        playground.c.lib.SymtabEntry.getInfo(this.__specAndDecl, this);
      }
      
      // Give 'em what they came for
      if (bMemAccess)
      {
        if (this.__pointerCount)
        {
          return "pointer";
        }
        
        if (this.__bIsParameter && this.__arrayCount)
        {
          return "pointer";
        }
      }
      
      return this.__type;
    },

    getUnsigned : function()
    {
      // Have we already determined this symbol's info?
      if (this.__type === null)
      {
        // Calculate this symbol's info by traversing the symbol's
        // specifier/declarator list.
        playground.c.lib.SymtabEntry.getInfo(this.__specAndDecl, this);
      }
      
      return this.__bUnsigned;
    },

    getSize : function()
    {
      // Have we already determined this symbol's size?
      if (this.__size === null)
      {
        // We should probably never get here, as the size should have been
        // calculated via a call to calculateOffset(). Just in case, though...
        // 
        // Calculate the number of bytes consumed by the specifier or
        // declarator and possibly (recursively) its successors
        this.__size = 
          this.__specAndDecl[0].calculateByteCount(1, this.__specAndDecl, 0);
      }
      
      // Give 'em what they came for
      return this.__size;
    },

    getPointerCount : function()
    {
      // Have we already determined this symbol's info?
      if (this.__pointerCount === null)
      {
        // Calculate this symbol's info by traversing the symbol's
        // specifier/declarator list.
        playground.c.lib.SymtabEntry.getInfo(this.__specAndDecl, this);
      }
      
      // Give 'em what they came for
      return this.__pointerCount;
    },
    
    getArraySizes : function()
    {
      // Have we already determined this symbol's info?
      if (this.__arraySizes === null)
      {
        // Calculate this symbol's info by traversing the symbol's
        // specifier/declarator list.
        playground.c.lib.SymtabEntry.getInfo(this.__specAndDecl, this);
      }
      
      // Give 'em what they came for
      return this.__arraySizes;
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
              "\tDescription: " + 
                playground.c.lib.SymtabEntry.getInfo(
                  this.__specAndDecl).description);
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
