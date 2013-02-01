/**
 * Symbol table functionality
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/** Map of available symbol tables */
var symtabs = {};

/** Stack of symbol tables in use during parsing */
var symtabStack = [];

/** Stack of symbol tables for the struct namespace */
var symtabStackStruct = [];

/** Next unique symtab id (only assigned by caller) */
var nextUniqueId = 0;

/** Next entry id, assigned to every symbol table entry */
var nextEntryId = 0;

/** Bit fields in the typeFlags field of an Entry */
var TF = 
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
  };

/** Bit fields in the storageFlags field of an Entry */
var SF =
  {
    Static   : 1 << 0,
    Const    : 1 << 1,
    Volatile : 1 << 2
  };

/** Size, in bytes, of each type */
var SIB =
  {
    Char     : 1,
    Short    : 2,
    Int      : 4,
    Long     : 4,
    LongLong : 8,
    Float    : 4,
    Double   : 8
  };

// Export the flags and sizes so they can be interpreted elsewhere
exports.TYPE_FLAGS = TF;
exports.SIZE_IN_BYTES = SIB;

/** Create a new symtab entry */
var Entry = function(name, bIsType, symtab, line)
{
  var entry =
    {
      // this symbol's name
      name         : name,

      // identifier for this entry
      id           : nextEntryId++,

      // whether this entry is a type definition
      bIsType      : bIsType,

      // See TF (exports.TYPE_FLAGS), above
      typeFlags    : 0,

      // user-defined type name, if bIsType
      typeName     : null,

      // symbol table containing structure entries
      structSymtab : null,

      // the symbol table of this entry
      symtab       : symtab,
      
      // number of asterisks
      pointerCount : 0,
      
      // calculated size, based on the typeFlags
      size         : 0,

      // offset from the base pointer (in activation record, at the beginning
      // of automatic local variable portion)
      offset       : 0,

      // line number on which this symbol was defined
      line         : line
    };
  
  var types = function(checkTypes, thisType, otherTypes)
  {
    var             typeList = [];
    
    // List previously-added types
    if ((checkTypes & TF.Char) && (otherTypes & TF.Char))
    {
      typeList.push("char");
    }
    
    if ((checkTypes && TF.Short) && (otherTypes & TF.Short))
    {
      typeList.push("short");
    }
    
    if ((checkTypes && TF.Int) && (otherTypes & TF.Int))
    {
      typeList.push("int");
    }
    
    if ((checkTypes && TF.Long) && (otherTypes & TF.Long))
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
  };

  entry.getName = function()
  {
    return entry.name;
  };

  entry.getId = function()
  {
    return entry.id;
  };

  entry.getIsType = function()
  {
    return entry.bIsType;
  };
  
  entry.setIsType = function(bIsType)
  {
    entry.bIsType = bIsType;
  };
  
  entry.getTypes = function()
  {
    return entry.typeFlags;
  };
  
  entry.setType = function(type)
  {
    switch(type)
    {
    case "char" :
    case "short" :
    case "float" :
    case "double" :
    case "long" :
      if (entry.typeFlags & (TF.Char | TF.Short | TF.Float | TF.Double))
      {
        entry.error("Incompatible type combination: " +
                    types(TF.Char | TF.Short | TF.Float | TF.Double,
                          type, entry.typeFlags));
        return;
      }
      
      if ((type == "float" || type == "double") && 
          ((entry.typeFlags & TF.Long) || (entry.typeFlags & TF.Int)))
      {
        entry.error("Incompatible type combination: " +
                    types(TF.Float | TF.Double, type, entry.typeFlags));
        return;
      }
      break;
      
    case "unsigned" :
      if (entry.typeFlags & (TF.Float | TF.Double))
      {
        entry.error("Incompatible type combination: " +
                    types(TF.Float | TF.Double, type, entry.typeFlags));
        return;
      }
      break;

    case "int" :
      break;

    case "function" :
      break;

    default:
      // We got a user-defined (typedef'ed) type
      entry.typeName = type;
      return;
    }

    // Now set the appropriate bit
    switch(type)
    {
    case "char" :
      if (entry.typeFlags & TF.Char)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.typeFlags |= TF.Char;
      entry.size = SIB.Char;
      break;
      
    case "short" :
      if (entry.typeFlags & TF.Short)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.typeFlags |= TF.Short;
      entry.size = SIB.Short;
      break;
      
    case "float" :
      if (entry.typeFlags & TF.Float)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.typeFlags |= TF.Float;
      entry.size = SIB.Float;
      break;
      
    case "double" :
      if (entry.typeFlags & TF.Double)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.typeFlags |= TF.Double;
      entry.size = SIB.Double;
      break;
      
    case "int" :
      if (entry.typeFlags & TF.Int)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.typeFlags |= TF.Int;
      
      // this one may have already by set, e.g., short int
      if (entry.size === 0)
      {
        entry.size = SIB.Int;
      }
      break;
      
    case "long" :
      if (entry.typeFlags & TF.LongLong)
      {
        entry.error("Type is too long: long long long");
        return;
      }
      entry.typeFlags |= (entry.typeFlags & TF.Long) ? TF.LongLong : TF.Long;
      entry.size = (entry.typeFlags & TF.LongLong) ? SIB.LongLong : SIB.Long;
      break;
      
    case "unsigned" :
      if (entry.typeFlags & TF.Unsigned)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.typeFlags |= TF.Unsigned;
      
      // Default to unsigned int, if not otherwise set; may get overridden
      if (entry.size === 0)
      {
        entry.size = SIB.Int;
      }
      break;
      
    case "function" :
      entry.typeFlags |= TF.Function;
      entry.size = 0;
      break;
    }
  };
  
  entry.getIsUnsigned = function()
  {
    // Return a true binary, not the null indicating that it's not yet set.
    return !!entry.bUnsigned;
  };
  
  entry.setIsUnsigned = function(bIsUnsigned)
  {
    // If signedness has not been specified yet...
    if (this.bUnsigned === null)
    {
      // ... then specify it.
      entry.bUnsigned = bIsUnsigned;
      return;
    }
    
    // Can't set signedness multiple times.
    entry.error("Signedness was previously specified");
  };

  entry.getIsFloat = function()
  {
    // Return a true binary, not the null indicating that it's not yet set.
    return !!entry.bUnsigned;
  };
  
  entry.setIsFloat = function(bIsFloat)
  {
    // If floatedness has not been specified yet...
    if (this.bFloat === null)
    {
      // ... then specify it.
      entry.bFloat = bIsFloat;
      return;
    }
    
    // Can't set signedness multiple times.
    if (entry.bFloat)
    {
      entry.error("Previously specified to be floating point");
    }
    else
    {
      entry.error("Previously specified to be an integer");
    }
  };

  entry.getSymtab = function()
  {
    return entry.symtab;
  };
  
  entry.setStructSymtab = function(symtab)
  {
    entry.structSymtab = symtab;
  };
  
  entry.getStructSymtab = function()
  {
    return entry.structSymtab;
  };

  entry.getPointerCount = function()
  {
    return entry.pointerCount;
  };
  
  entry.incrementPointerCount = function()
  {
    ++entry.pointerCount;
  };
  
  entry.getLine = function()
  {
    return entry.line;
  };
  
  entry.error = function(message)
  {
    sys.print("Error: line " + this.line + ": " + message);
    ++error.errorCount;
  };

  entry.display = function()
  {
    var             key;

    sys.print("\n");

    for (key in this)
    {
      if (typeof this[key] != "function")
      {
        sys.print("\t" + key + " = " + this[key] + "\n");
      }
    }
  };

  return entry;
};

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
exports.create = function(parent, name, line)
{
  var             symtab;

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
      name = parent.name + "/" + parent.nextChild;
      ++parent.nextChild;
    }
  }
  else
  {
    // A local name was provided. Prepend the parent's name.
    if (parent && parent.name)
    {
      name = parent.name + "/" + parent.nextChild + "-" + name;
      ++parent.nextChild;
    }
  }

  // Create this new symbol table
  symtab =
    {
      name        : name,
      parent      : parent,
      symbols     : {},
      symbolOrder : [],
      nextChild   : 1,
      nextOffset  : 0,
      line        : line
    };
  
  // Allow finding a symbol table by its name
  symtabs[name] = symtab;

  // Push it onto the appropriate stack
  if (name.match(/^struct#/))
  {
    symtabStackStruct.push(symtab);
  }
  else
  {
    symtabStack.push(symtab);
  }
  
  return symtab;
};

/**
 * Remove the top symbol table from the stack, and return it.
 * 
 * @return {symtab}
 *   The previously-current symbol table, just removed from the stack.
 */
exports.popStack = function()
{
  return symtabStack.pop();
};

/**
 * Get the symbol table at the top of the stack
 *
 * @return
 *   The symbol table at the top of the stack, if there is one;
 *   NULL if not.
 */
exports.getCurrent = function()
{
    // Ensure there's something on the stack
    if (symtabStack.length === 0)
    {
        // There's not!
        return null;
    }

    /* Give 'em what they came for! */
    return symtabStack[symtabStack.length - 1];
};

/**
 * Add an entry to a symbol table.
 *
 * @param symtab
 *   The symbol table to which the entry is to be added
 *
 * @param symName
 *   The symbol name
 *
 * @param bIsType
 *   Whether this is a type (via typedef) or a variable
 *
 * @param line
 *   The line number at which this symbol is defined
 *
 * @return {Map|null}
 *   The symbol table entry, if the symbol was successfully added to the
 *   symbol table;
 *   null otherwise, i.e., the symbol was already in the symbol table
 *
 */
exports.add = function(symtab, symName, line, bIsType)
{
  var             value;
  var             entry;

  // If we weren't provided a symbol table...
  if (! symtab)
  {
    // ... then use the one at the top of the stack
    symtab = exports.getCurrent();
  }

  if (modules.symtab.debug)
  {
    sys.print("symtab.add: symtab=" + symtab.name + "\n");
  }

  // See if this symbol already exists in the symbol table
  value = symtab.symbols[symName];
  if (value)
  {
    // The symbol was already in the symbol table
    return null;
  }
  
  // Get a new, initialized symbol table entry
  entry = Entry(symName, bIsType || false, symtab, line);

  // Add this symbol to the symbol table
  symtab.symbols[symName] = entry;
  symtab.symbolOrder.push(entry);

  // Successfully entered the symbol into the symbol table. Give it to 'em.
  return entry;
};


/**
 * Retrieve a symbol from a symbol table chain. If the symbol is not found in
 * the provided symbol table, the parent chain is followed until the symbol is
 * found or there are no further parents (we've reached the root).
 *
 * @param symtab
 *   The "current" symbol table. It is legitimate to pass null for this
 *   parameter, which indicates that only the symbol table for the current
 *   scope is to be examined, rather than searching the entire symbol table
 *   chain.
 *
 * @param symName
 *   The symbol name to be searched for in the symbol table chain
 *
 * @return
 *   A pointer to the symbol table entry for the specified symbol, if found;
 *   NULL otherwise.
 */
exports.get = function(symtab, symName)
{
  var             bCurrentOnly = (symtab === null);
  var             entry;

  // Are we searching only the current symbol table?
  if (bCurrentOnly)
  {
    /* Yup. Retrieve it. */
    symtab = exports.getCurrent();
  }

  // Loop through the symbol table chain from the current one to the root
  for (;;)
  {
    // Try to get the requested symbol from the current symbol table
    entry = symtab.symbols[symName];

    // Did we find it here?
    if (entry)
    {
      // Yup. Give it to 'em.
      return entry;
    }
        
    // Symbol not found in this symbol table. Try the parent.
    symtab = symtab.parent;

    // Were we at the root?
    if (! symtab)
    {
      // Yup. No such entry.
      return null;
    }
    
    // There's a parent. Try it by looping again, if so requested.
    if (bCurrentOnly)
    {
      break;
    }
  }

  // Not found.
  return null;
};


/**
 * Retrieve a unique id for a symbol table name
 */
exports.getUniqueId = function()
{
  return nextUniqueId++;
};


/**
 * Prepare for processing by resetting the name creation such that new
 * calls to symtab.add() will yield the same names as previously.
 */
exports.reset = function()
{
  symtabs = {};
  symtabStack.forEach(
    function(symtab)
    {
      symtab.nextChild = 1;
    });
  
  nextUniqueId = 0;
};


exports.display = function(message)
{
  var             i;
  var             entry;
  var             symtab;
  var             symtabName;
  var             symbolName;
  var             sym;

  sys.print("\n");
  if (message)
  {
    sys.print(message + "\n");
  }

  for (symtabName in symtabs)
  {
    symtab = symtabs[symtabName];
    sys.print("Symbol table " + symtab.name + "...\n");
    
    for (symbolName in symtab.symbols)
    {
      // Get quick reference to this symbol table entry
      entry = symtab.symbols[symbolName];

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
      for (i = symtab.symbols[symbolName].getPointerCount(); i > 0; i--)
      {
        sys.print("*");
      }
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
};
