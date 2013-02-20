/**
 * Symbol table functionality
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var qx = require("qooxdoo");
var printf = require("printf");
require("./SymtabEntry");

qx.Class.define("learncs.lib.Symtab",
{
  extend : qx.core.Object,
  
  /**
   * Create a new symbol table.
   *
   * @param parent {symtab|null}
   *   The parent symbol table. The root symbol table is indicated by a null
   *   parent.
   *
   * @param name {String?}
   *   The name of this symbol table. This might be, for example, the name of
   *   the enclosing function. If not provided, then the a name will be
   *   generated dynamically based on the parent's name.
   *
   * @param line {Integer}
   *   The line number at which this symbol table is created
   *
   * @return {Object}
   *   The opaque symbol table entry
   *
   */
  construct : function(parent, name, line)
  {
    var             symtab;
    var             entry;

    this.base(arguments);

    // Was a name provided?
    if (! name)
    {
      // Nope. Derive one from the parent's name and the number 
      if (! parent)
      {
        // Parent does not exist, so this is the root symbol table.
        name = "*";
      }
      else
      {
        // Derive name from parent and child identifier
        name = parent.__name + "/" + parent.__nextChild + "@L" + line;
        ++parent.__nextChild;
      }
    }
    else
    {
      // A local name was provided. Prepend the parent's name.
      if (parent && parent.__name)
      {
        name = parent.__name + "/" + parent.__nextChild + "-" + name;
        ++parent.__nextChild;
      }
    }

    // Create this new symbol table
    this.__name = name;
    this.__parent = parent;
    this.__symbols = {};
    this.__symbolOrder = [];
    this.__nextChild = 1;
    this.__line = line;
    
    // The frame pointer is assumed to be global
    this.__framePointer = [ learncs.machine.Memory.info.gas.start ];

    // Next offset for a symbol, manipulated by class SymtabEntry
    this.nextOffset = 0;

    // Allow finding a symbol table by its name
    learncs.lib.Symtab._symtabs[name] = this;

    // Push it onto the appropriate stack
    if (name.match(/^struct#/))
    {
      learncs.lib.Symtab._symtabStackStruct.push(this);
    }
    else
    {
      learncs.lib.Symtab._symtabStack.push(this);
    }
    
    // If this is the root symbol table...
    if (! parent)
    {
      // ... then add built-in functions.
      entry = this.add("printf", 0, false);
      entry.setType("built-in", printf);
      
      // Save this root symbol table for ready access
      learncs.lib.Symtab._root = this;
    }
  },
  
  statics :
  {
    /** Symbol tables, by name */
    _symtabs : {},
    
    /** Stack of symbol tables, during parsing */
    _symtabStack : [],
    
    /** Stack of local symbol tabales for a structure definition */
    _symtabStackStruct : [],
    
    /** Next id to assign when getUniqueId() is called */
    __nextUniqueId : 0,

    /** Stack of frame pointers */
    framePointers : [],

    /**
     * Allocate global space, e.g., for a literal string
     */
    allocGlobalSpace : function(numBytes)
    {
      var             symtab = learncs.lib.Symtab._root;
      var             startOffset;

      // Save the current next offset in this symbol table
      startOffset = symtab.nextOffset;

      // Increase the next offset by the requested number of bytes
      symtab.nextOffset += numBytes;
      
      // Return the address of the allocated space
      return learncs.machine.Memory.info.gas.start + startOffset;
    },

    /**
     * Push a frame pointer onto its own stack
     * 
     * @param fp {Number}
     *   The frame pointer to be pushed
     */
    pushFramePointer : function(fp)
    {
console.log("pushFramePointer: pushing fp=" + fp.toString(16));
      learncs.lib.Symtab.framePointers.unshift(fp);
    },
    
    /**
     * Pop a frame pointer from its own stack
     * 
     * @return {Number}
     *   The frame pointer just popped
     */
    popFramePointer : function()
    {
      var             fp = learncs.lib.Symtab.framePointers.shift();
      
console.log("popFramePointer: popped fp=" + fp.toString(16));
      return fp;
    },

    /**
     * Push a symbol table onto the stack
     */
    pushStack : function(symtab)
    {
console.log("pushStack: pushing symtab " + symtab.getName());
      learncs.lib.Symtab._symtabStack.push(symtab);
    },

    /**
     * Remove the top symbol table from the stack, and return it.
     * 
     * @return {symtab}
     *   The previously-current symbol table, just removed from the stack.
     */
    popStack : function()
    {
      var             symtab = learncs.lib.Symtab._symtabStack.pop();
console.log("popStack: popping symtab " + symtab.getName());
      return symtab;
    },

    /**
     * Get the symbol table at the top of the stack
     *
     * @return
     *   The symbol table at the top of the stack, if there is one;
     *   NULL if not.
     */
    getCurrent : function()
    {
      var statics = learncs.lib.Symtab;

      // Ensure there's something on the stack
      if (statics._symtabStack.length === 0)
      {
          // There's not!
          return null;
      }

      /* Give 'em what they came for! */
      return statics._symtabStack[statics._symtabStack.length - 1];
    },

    /**
     * Get a symbol table by its name
     * 
     * @param name {String}
     *   The name of the symbol table to retrieve
     * 
     * @return {learncs.lib.Symtab|null}
     *   The symbol table with the given name, if it is found;
     *   null otherwise.
     */
    getByName : function(name)
    {
      return learncs.lib.Symtab._symtabs[name] || null;
    },

    /**
     * Retrieve a unique id for a symbol table name
     */
    getUniqueId : function()
    {
      return learncs.lib.Symtab.__nextUniqueId++;
    },

    /**
     * Prepare for processing by resetting the name creation of symbol tables.
     */
    reset : function()
    {
      learncs.lib.Symtab._symtabs = {};
      learncs.lib.Symtab._symtabStack = [];
      learncs.lib.Symtab._symtabStackStruct = [];
      learncs.lib.Symtab.__nextUniqueId = 0;
    },

    display : function(message)
    {
      var             i;
      var             entry;
      var             symtab;
      var             symtabName;
      var             symbolName;
      var             sym;
      var             TF = learncs.lib.SymtabEntry.TypeFlags;

      sys.print("\n");
      if (message)
      {
        sys.print(message + "\n");
      }

      for (symtabName in learncs.lib.Symtab._symtabs)
      {
        symtab = learncs.lib.Symtab._symtabs[symtabName];
        sys.print("Symbol table " + symtab + " (" + symtab.__name + ")...\n");

        for (symbolName in symtab.__symbols)
        {
          // Get quick reference to this symbol table entry
          entry = symtab.__symbols[symbolName];

          sys.print("  '" + symbolName + "':");
          if (entry.getIsType())
          {
            sys.print(" type");
          }

          if (entry.typeFlags & TF.Function)
          {
            sys.print(" function");
          }
          if (entry.typeFlags & TF.Unsigned)
          {
            sys.print(" unsigned");
          }
          if (entry.typeFlags & TF.LongLong)
          {
            sys.print(" long");
          }
          if (entry.typeFlags & TF.Long)
          {
            sys.print(" long");
          }
          if (entry.typeFlags & TF.Short)
          {
            sys.print(" short");
          }
          if (entry.typeFlags & TF.Char)
          {
            sys.print(" char");
          }
          if (entry.typeFlags & TF.Int)
          {
            sys.print(" int");
          }
          if (entry.typeFlags & TF.Float)
          {
            sys.print(" float");
          }
          if (entry.typeFlags & TF.Double)
          {
            sys.print(" double");
          }
          if (entry.typeFlags === 0 && entry.typeName)
          {
            // This is a struct or an enum
            sys.print(" " + entry.typeName);
            // entry.display();
          }

          sys.print(" ");
          for (i = symtab.__symbols[symbolName].getPointerCount(); i > 0; i--)
          {
            sys.print("*");
          }

          entry.display();
          sys.print("\n");
        }
      }

    /*
      sys.print("Looking for symbol IntPtr...\n");
      sym = exports.get(exports.getCurrent(), "IntPtr");
      if (sym)
      {
        sys.print("Found symbol IntPtr, type=" + sym.type + "\n");
      }
      else
      {
        sys.print("Could not find symbol IntPtr\n");
      }
    */
    }
  },
  
  members :
  {
    /**
     * Add an entry to a symbol table.
     *
     * @param symName
     *   The symbol name
     *
     * @param line
     *   The line number at which this symbol is defined
     *
     * @param bIsType
     *   Whether this is a type (via typedef) or a variable
     *
     * @return {Map|null}
     *   The symbol table entry, if the symbol was successfully added to the
     *   symbol table;
     *   null otherwise, i.e., the symbol was already in the symbol table
     *
     */
    add : function(symName, line, bIsType)
    {
      var             value;
      var             entry;

      // See if this symbol already exists in the symbol table
      value = this.__symbols[symName];
      if (value)
      {
        // The symbol was already in the symbol table
        return null;
      }

      // Get a new, initialized symbol table entry
      entry = new learncs.lib.SymtabEntry(symName,
                                          bIsType || false, 
                                          this,
                                          line);

      // Add this symbol to the symbol table
      this.__symbols[symName] = entry;
      this.__symbolOrder.push(entry);

      // Successfully entered the symbol into the symbol table. Give it to 'em.
      return entry;
    },


    /**
     * Retrieve a symbol from a symbol table chain. If the symbol is not found
     * in the provided symbol table, the parent chain is followed until the
     * symbol is found or there are no further parents (we've reached the
     * root).
     *
     * @param symName {String}
     *   The symbol name to be searched for in the symbol table chain
     *
     * @param bCurrentOnly {Boolean}
     *   True if only the current symbol table is to be searched;
     *   False if the whole change of symbol tables is to be searched
     *
     * @return
     *   A pointer to the symbol table entry for the specified symbol, if found;
     *   NULL otherwise.
     */
    get : function(symName, bCurrentOnly)
    {
      var             entry;

      // Try to get the requested symbol from the current symbol table
      entry = this.__symbols[symName];

      // Did we find it here?
      if (entry)
      {
        // Yup. Give it to 'em.
        return entry;
      }
      
      // If we're only told to search the current symbol table...
      if (bCurrentOnly)
      {
        // ... then tell 'em we couldn't find the symbol
        return null;
      }
      
      // If this is no parent...
      if (! this.__parent)
      {
        // ... then tell 'em we couldn't find the symbol
        return null;
      }
      
      // Call recursively for the parent
      return this.__parent.get(symName, false);
    },
    
    /**
     * Set the frame pointer for this symbol table
     * 
     * @param fp {Number}
     *   The frame pointer to associated with this symbol table, for the
     *   current activation record.
     */
    setFramePointer : function(fp)
    {
console.log("setFramePointer: name=" + this.__name + ", fp=" + fp.toString(16));
      this.__framePointer.unshift(fp);
    },
    
    /**
     * Retrieve the frame pointer for this symbol table
     */
    getFramePointer : function()
    {
console.log("getFramePointer: name=" + this.__name + ", fp=" + this.__framePointer[0].toString(16));
      return this.__framePointer[0];
    },

    /**
     * Restore this symbol table to its prior frame pointer
     */
    restoreFramePointer : function()
    {
      this.__framePointer.shift();
    },

    /**
     * Provide the parent symbol table.
     * 
     * @return {learncs.lib.Symtab}
     *   The parent symbol table
     */
    getParent : function()
    {
      return this.__parent;
    },
    
    /**
     * Provide the name of this symbol table
     * 
     * @return {String}
     *   This symbol table's name
     */
    getName : function()
    {
      return this.__name;
    },
    
    /**
     * Provide the total byte count of this symbol table's symbols
     * 
     * @return {Number}
     *   The number of bytes consumed by this symbol table's symbols
     */
    getSize : function()
    {
      return this.nextOffset;
    }
  }
});
