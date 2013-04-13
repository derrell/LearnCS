/**
 * Symbol table functionality
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
#ignore(require)
#ignore(qx.bConsole)
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 * @lint ignoreUndefined(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
  qx.bConsole = true;
  require("./SymtabEntry");
  require("../Stdio");
}

qx.Class.define("playground.c.lib.Symtab",
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
    var             declarator;

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
    this.__framePointer = [ playground.c.machine.Memory.info.gas.start ];

    // Next offset for a symbol, manipulated by class SymtabEntry
    this.nextOffset = 0;

    // Allow finding a symbol table by its name
    playground.c.lib.Symtab._symtabs[name] = this;

    // Push it onto the appropriate stack
    if (name.match(/^struct#/))
    {
      playground.c.lib.Symtab._symtabStackStruct.push(this);
    }
    else
    {
      playground.c.lib.Symtab._symtabStack.push(this);
    }
    
    // If this is the root symbol table...
    if (! parent)
    {
      // ... then add built-in functions.
      entry = this.add("printf", 0, false);
      declarator = new playground.c.lib.Declarator(
        {
          line : line,
          toString : function()
          {
            return "printf";
          }
        });
      declarator.setBuiltIn(
        function()
        {
          var str = playground.c.Stdio.printf.apply(null, arguments);
          
          // We'll be outputting the string using console.log, which appends a
          // newline. If the string to be output has a trailing newline, get
          // rid of it.
          if (str.charAt(str.length - 1) == "\n")
          {
            str = str.substr(0, str.length - 1);
          }
          
          console.log(str);
          return { value : str, type : "pointer" };
        });
      
      // Add the declarator to the symbol table entry
      entry.setSpecAndDecl( [ declarator ]);
      
      // Save this root symbol table for ready access
      playground.c.lib.Symtab._root = this;
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
    allocGlobalSpace : function(numBytes, type, line)
    {
      var             symtab = playground.c.lib.Symtab._root;
      var             startOffset;
      var             memory;
      var             mod;
      var             SIB = playground.c.lib.SymtabEntry.SizeInBytes;

      // Save the current next offset in this symbol table
      startOffset = symtab.nextOffset;

      // Increase the next offset by the requested number of bytes
      symtab.nextOffset += numBytes;
      mod = numBytes % SIB.Word;
      if (mod !== 0)
      {
        symtab.nextOffset += SIB.Word - mod;
      }
      
      memory = playground.c.machine.Memory.getInstance();
      memory.setSymbolInfo(
        playground.c.machine.Memory.info.gas.start + startOffset,
        {
          getName         : function() { return type + " at line " + line; },
          getType         : function() { return "char"; },
          getUnsigned     : function() { return false; },
          getSize         : function() { return numBytes; },
          getPointerCount : function() { return 0; },
          getArraySizes   : function() { return [ numBytes ]; },
          getIsParameter  : function() { return false; }
        });

      // Return the address of the allocated space
      return playground.c.machine.Memory.info.gas.start + startOffset;
    },

    /**
     * Add the information for a symbol to Memory's record, for later display
     * 
     * @param symbol {playground.c.lib.SymtabEntry}
     */
    _addSymbolInfo : function(symbol)
    {
      var             addr;
      var             memory;

      // Get this symbol's address
      addr = symbol.getAddr();

      // Ensure that it's a real address and not a built-in function node
      if (addr instanceof playground.c.lib.Node)
      {
        // It's a node. Ignore it
        return;
      }

      // Get a reference to the Memory singleton
      memory = playground.c.machine.Memory.getInstance();

      // Specify the name and type for this address
      memory.setSymbolInfo(addr, symbol);
    },

    /**
     * Push a frame pointer onto its own stack
     * 
     * @param fp {Number}
     *   The frame pointer to be pushed
     */
    pushFramePointer : function(fp)
    {
      var             fpPrev;
      var             symtab;
      var             Symtab = playground.c.lib.Symtab;
      
      // Retrieve the frame pointer before pushing the new one onto the stack
      fpPrev = playground.c.lib.Symtab.framePointers[0];
      
      // Push the new frame pointer onto the stack
      Symtab.framePointers.unshift(fp);
      
      // Get the current symbol table
      symtab = Symtab.getCurrent();
      
      // Add each symbol in this symbol table to memory, for later display
      symtab.__symbolOrder.forEach(this._addSymbolInfo);
    },
    
    /**
     * Pop a frame pointer from its own stack
     * 
     * @return {Number}
     *   The frame pointer just popped
     */
    popFramePointer : function()
    {
      var             fp = playground.c.lib.Symtab.framePointers.shift();
      
      return fp;
    },

    /**
     * Push a symbol table onto the stack
     */
    pushStack : function(symtab)
    {
      playground.c.lib.Symtab._symtabStack.push(symtab);
    },

    /**
     * Remove the top symbol table from the stack, and return it.
     * 
     * @return {symtab}
     *   The previously-current symbol table, just removed from the stack.
     */
    popStack : function()
    {
      var             symtab = playground.c.lib.Symtab._symtabStack.pop();
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
      var statics = playground.c.lib.Symtab;

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
     * @return {playground.c.lib.Symtab|null}
     *   The symbol table with the given name, if it is found;
     *   null otherwise.
     */
    getByName : function(name)
    {
      return playground.c.lib.Symtab._symtabs[name] || null;
    },

    /**
     * Retrieve a unique id for a symbol table name
     */
    getUniqueId : function()
    {
      return playground.c.lib.Symtab.__nextUniqueId++;
    },

    /**
     * Prepare for processing by resetting the name creation of symbol tables.
     */
    reset : function()
    {
      playground.c.lib.Symtab._symtabs = {};
      playground.c.lib.Symtab._symtabStack = [];
      playground.c.lib.Symtab._symtabStackStruct = [];
      playground.c.lib.Symtab.__nextUniqueId = 0;
    },

    display : function(message)
    {
      var             i;
      var             entry;
      var             symtab;
      var             symtabName;
      var             symbolName;
      var             sym;
      var             parts = [];
      var             TF = playground.c.lib.SymtabEntry.TypeFlags;

      console.log("");
      if (message)
      {
        console.log(message);
      }

      for (symtabName in playground.c.lib.Symtab._symtabs)
      {
        symtab = playground.c.lib.Symtab._symtabs[symtabName];
        console.log("Symbol table " + symtab + " (" + symtab.__name + ")...");

        for (symbolName in symtab.__symbols)
        {
          // Get quick reference to this symbol table entry
          entry = symtab.__symbols[symbolName];
          entry.display();
          console.log("");
        }
      }
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
     * @param bIsParameter
     *   Whether this is a parameter to a function
     *
     * @return {Map|null}
     *   The symbol table entry, if the symbol was successfully added to the
     *   symbol table;
     *   null otherwise, i.e., the symbol was already in the symbol table
     *
     */
    add : function(symName, line, bIsType, bIsParameter)
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
      entry = new playground.c.lib.SymtabEntry(symName,
                                               bIsType || false, 
                                               bIsParameter || false,
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
      var             memory;
      var             symtab;
      var             Symtab = playground.c.lib.Symtab;
      
      // Push the new frame pointer onto the stack
      this.__framePointer.unshift(fp);
      
      // Get a reference to the Memory singleton
      memory = playground.c.machine.Memory.getInstance();

      // For each symbol in the symbol table...
      this.__symbolOrder.forEach(
        function(symbol)
        {
          var             addr;
          
          // Get this symbol's address
          addr = symbol.getAddr();
          
          // Ensure that it's a real address and not a built-in function node
          if (addr instanceof playground.c.lib.Node)
          {
            // It's a node. Ignore it
            return;
          }
          
          // Specify the name and type for this address
          memory.setSymbolInfo(addr, symbol);
        });
    },
    
    /**
     * Retrieve the frame pointer for this symbol table
     */
    getFramePointer : function()
    {
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
     * @return {playground.c.lib.Symtab}
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
