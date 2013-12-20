/**
 * Symbol table functionality
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
  require("./SymtabEntry");
  require("../stdio/Stdio");
  require("../stdio/Printf");
  require("../stdio/Scanf");
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
        name = parent.__name + "/" + "@L" + line;
        ++parent.__nextChild;
      }
    }
    else
    {
      // A local name was provided. Prepend the parent's name.
      if (parent && parent.__name)
      {
        name = parent.__name + "/" + name;
        ++parent.__nextChild;
      }
    }

    // Create this new symbol table
    this.__name = name;
    this.__parent = parent || null;
    this.__symbols = {};
    this.__symbolOrder = [];
    this.__nextChild = 1;
    this.__line = line;
    
    // The frame pointer is assumed to be global
    this.__framePointer = [ playground.c.machine.Memory.info.gas.start ];

    // Next offset for a symbol, manipulated by class SymtabEntry
    this.nextOffset = 0;
    
    // If this is the root symbol table...
    if (! parent)
    {
      // ... then we also have an offset for defined constants. We use
      // negative offsets from the globals-and-statics area, which extends
      // into the definitions area.
      this.nextDefine = -4;
    }

    // Allow finding a symbol table by its name
    if (playground.c.lib.Symtab._symtabs[name])
    {
      throw new Error("Duplicate symbol table: " + name);
    }
    playground.c.lib.Symtab._symtabs[name] = this;

    // Push it onto the appropriate stack
    {
      playground.c.lib.Symtab._symtabStack.push(this);
    }
    
    // If this is the root symbol table...
    if (! parent)
    {
      // ... then save it ready access
      playground.c.lib.Symtab._root = this;
    }
  },
  
  statics :
  {
    /** Symbol tables, by name */
    _symtabs : {},
    
    /** Stack of symbol tables, during parsing */
    _symtabStack : [],
    
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
          getSize         : function() { return 1; },
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
      var             specAndDecl;
      var             specOrDecl;

      // Get this symbol's address
      addr = symbol.getAddr();

      // Ensure that it's a real address and not a built-in function node
      if (addr instanceof playground.c.lib.Node || addr instanceof Function)
      {
        // It's a built-in. Ignore it
        return;
      }

      // Ensure that it's not a typedef
      specAndDecl = symbol.getSpecAndDecl();
      specOrDecl = specAndDecl[specAndDecl.length - 1]; 
      if (specOrDecl instanceof playground.c.lib.Specifier &&
          specOrDecl.getStorage() == "typedef")
      {
        // It is a typedef. It takes no space, so nothing for us to do.
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
      symtab.addSymbols();
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
      // Push this symbol table onto the symbol table stack
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
      var             symtab;

      // Remove the top symbol table from the stack and return it
      symtab = playground.c.lib.Symtab._symtabStack.pop();
      
      // Restore this symbol table's frame pointer to its prior location
      symtab.restoreFramePointer();

      return symtab;
    },

    /**
     * Get the symbol table at the top of the stack
     *
     * @return {playground.c.lib.Symtab}
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
    getByName : function(name, parent)
    {
      if (parent)
      {
        name = parent.__name + "/" + name;
      }
      
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
      playground.c.lib.Symtab.__nextUniqueId = 0;
    },

    /**
     * Remove a symbol table.
     * 
     * CAUTION: It is the caller's responsibility to ensure that the symbol
     * table is not in use, i.e., it is not currently on the symbol table
     * stack.
     * 
     * @param symtab {playground.c.lib.Symtab}
     *   The symbol table to be removed.
     */
    remove : function(symtab)
    {
      // Remove this symbol table from the symbol table map
      delete playground.c.lib.Symtab._symtabs[symtab.__name];
    },

    display : function(message)
    {
      var             entry;
      var             symtab;
      var             symtabName;
      var             symbolName;

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
    __symbols      : null,
    __symbolOrder  : null,
    __parent       : null,
    __framePointer : null,
    __name         : null,
    __line         : null,
    __nextChild    : null,

    /**
     * Add an entry to a symbol table.
     *
     * @param symName {String}
     *   The symbol name
     *
     * @param line {Number}
     *   The line number at which this symbol is defined
     *
     * @param bIsType {Boolean}
     *   Whether this is a type (via typedef) or a variable
     *
     * @param bIsParameter {Boolean}
     *   Whether this is a parameter to a function
     * 
     * @param bIsDefine {Boolean}
     *   Whether this is a #define constant
     *
     * @return {Map|null}
     *   The symbol table entry, if the symbol was successfully added to the
     *   symbol table;
     *   null otherwise, i.e., the symbol was already in the symbol table
     *
     */
    add : function(symName, line, bIsType, bIsParameter, bIsDefine)
    {
      var             value;
      var             entry;
      var             thisSymtabParts;
      var             parentSymtabParts;
      var             errorMessage;

      // See if this symbol already exists in the symbol table
      value = this.__symbols[symName];
      if (value)
      {
        // The symbol was already in the symbol table
        return null;
      }

      // If this is a compound statement symbol table, and its parent is a
      // function symbol table, ensure that this symbol isn't shadowing a
      // parameter. (This does not check for shadowing in blocks that have
      // local variable declarations but are not the top-level block in a
      // function. I'd really prefer to discourage variable declarations in
      // non-top-level blocks anyway, for beginning students.)
      if (this.__parent != null)
      {
        // Split our own name and our parent name into slash-separated parts
        thisSymtabParts = this.__name.split("/");
        parentSymtabParts = this.__parent.__name.split("/");
        
        // Does our own name's last component begin with "compound" and our
        // parent's name's last component not begin with "compound"?
        if (thisSymtabParts[thisSymtabParts.length - 1].match(
                /^compound/) &&
            ! parentSymtabParts[parentSymtabParts.length - 1].match(
                /^compound/))
        {
          // Yes, we need to check for this symbol shadowing a parameter
          if (this.__parent.__symbols[symName])
          {
            errorMessage =
              "The declaration of local variable '" + symName + 
                "' shadows the parameter of the same name. " +
                "This makes the parameter inaccessible.";

            try
            {
              playground.c.Main.output(
                "Warning near line " + 
                  playground.c.lib.Node._currentNode.line + 
                  ": " +
                  errorMessage +
                  "\n");
            }
            catch(e)
            {
              console.log(errorMessage);
            }
          }
        }
      }
      

      // Get a new, initialized symbol table entry
      entry = new playground.c.lib.SymtabEntry(symName,
                                               bIsType || false, 
                                               bIsParameter || false,
                                               bIsDefine || false,
                                               this,
                                               line);

      // Add this symbol to the symbol table
      this.__symbols[symName] = entry;
      this.__symbolOrder.push(entry);

      // Successfully entered the symbol into the symbol table. Give it to 'em.
      return entry;
    },

    /**
     * Remove a symbol table entry.
     * 
     * @param symName {String}
     *   The name of the symbol to be removed from this symbol table
     */
    remove : function(symName)
    {
      var             index;
      var             entry = this.__symbols[symName];

      // Remove this symbol from the symbols map
      delete this.__symbols[symName];
      
      // Remove this symbol from the symbolOrder list.
      index = this.__symbolOrder.indexOf(entry);
      this.__symbolOrder.splice(index, 1);
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
     * @return {playground.c.lib.SymtabEntry}
     *   The symbol table entry for the specified symbol, if found;
     *   null otherwise.
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
      
      // Push the new frame pointer onto the stack
      this.__framePointer.unshift(fp);
      
      // Get a reference to the Memory singleton
      memory = playground.c.machine.Memory.getInstance();

      // For each symbol in the symbol table...
      this.__symbolOrder.forEach(
        function addSym(symbol, index, arr, prefix, startAddr)
        {
          var             i;
          var             addr;
          var             symtab;
          

          // If startAddr is 0 (or undefined) then we want the symbol's
          // address. Otherwise, it's a struct or union member, so we want to
          // add the symbol's offset to the start address.
          if (startAddr)
          {
            addr = startAddr + symbol.getOffset();
          }
          else
          {
            addr = symbol.getAddr();
          }
          
          // Ensure that it's a real address and not a built-in function node
          if (addr instanceof playground.c.lib.Node)
          {
            // It's a node. Ignore it
            return;
          }
          
          // If no prefix is given, use an empty string
          prefix = prefix || "";

          // Specify the name and type for this address
          if (symbol.getType(true) == "struct" ||
              symbol.getType(true) == "union")
          {
            // Add this struct or union variable name, to which we'll prepend
            // to each of its members.
            prefix += symbol.getName() + ".";
            
            // Recursively add each of the members. Add them in reverse order
            // so that unions show the first union member in the memory
            // template view rather than the last one.
            symtab = symbol.getStructSymtab();
            for (i = symtab.__symbolOrder.length - 1; i >= 0; i--)
            {
              addSym(symtab.__symbolOrder[i], i, [], prefix, addr);
            }
          }
          else
          {
            memory.setSymbolInfo(addr, symbol, prefix);
          }
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
      var             fp;

      fp = this.__framePointer.shift();
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
      var             size;
      
      // First, get the size of symbols that aren't struct or union
      size = this.nextOffset;
      
      // Now add in the size of each of those
      this.__symbolOrder.forEach(
        function(symbol)
        {
          var             symtab;

          // Does this symbol have a struct symbol table?
          symtab = symbol.getStructSymtab();
          if (symtab)
          {
            // Ignore the internal-use symbol tables for struct/union
            if (symtab.getName().match("struct#"))
            {
              return;
            }

            // Yup. Add its size.
            size += symtab.getSize();
          }
        });
      
      return size;
    },
    
    /**
     * Calculate the size of the union, based on the maximum size of its members
     */
    calculateUnionSize : function()
    {
      // Set nextOffset to the maximum of the members' sizes
      this.__symbolOrder.forEach(
        function(symbol)
        {
          var             size = symbol.getSize();

          if (size > this.nextOffset)
          {
            this.nextOffset = size;
          }
        },
        this);
    },

    /**
     * Add each of the symbols in this symbol table to the memory template view
     */
    addSymbols : function()
    {
      // Add each symbol in this symbol table to memory, for later display
      this.__symbolOrder.forEach(playground.c.lib.Symtab._addSymbolInfo);
    },
    
    /**
     * Retrieve the number of symbols in this symbol table
     */
    getNumSymbols : function()
    {
      return this.__symbolOrder.length;
    },
    
    /**
     * Retrieve the list of symbol table entries for this symbol table
     */
    getSymbols : function()
    {
      return this.__symbolOrder;
    }
  }
});
