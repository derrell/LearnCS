

/** Map of available symbol tables */
var symtabs = {};

/** Stack of symbol tables in use during parsing */
var symtabStack = [];

/** Bit fields in the flags field of an Entry */
var EF = 
  {
    Char     : 1 << 0,
    Short    : 1 << 1,
    Int      : 1 << 2,
    Long     : 1 << 3,
    LongLong : 1 << 4,

    Float    : 1 << 5,
    Double   : 1 << 6,
    
    Unsigned : 1 << 7
  };

// Export the flags so it can be interpreted elsewhere
exports.ENTRY_FLAGS = EF;

/** Create a new symtab entry */
function Entry(bIsType, symtab, line)
{
  var entry =
    {
      // whether this entry is a type definition
      bIsType      : bIsType,

      // See EF (exports.ENTRY_FLAGS), above
      flags        : 0,

      // user-defined type name
      typeName     : null,

      // the symbol table of this entry
      symtab       : symtab,
      
      // number of asterisks
      pointerCount : 0,
      
      // line number on which this symbol was defined
      line         : line
    };
  
  var types = function(checkTypes, thisType, otherTypes)
  {
    var             typeList = [];
    
    // List previously-added types
    if ((checkTypes & EF.Char) && (otherTypes & EF.Char))
    {
      typeList.push("char");
    }
    
    if ((checkTypes && EF.Short) && (otherTypes & EF.Short))
    {
      typeList.push("short");
    }
    
    if ((checkTypes && EF.Int) && (otherTypes & EF.Int))
    {
      typeList.push("int");
    }
    
    if ((checkTypes && EF.Long) && (otherTypes & EF.Long))
    {
      typeList.push("long");
    }
    
    if ((checkTypes & EF.Float) && (otherTypes & EF.Float))
    {
      typeList.push("float");
    }
    
    if ((checkTypes & EF.Double) && (otherTypes & EF.Double))
    {
      typeList.push("double");
    }
    
    // Give 'em a string listing all of those, and the new type
    return typeList.join(", ") + " with " + thisType;
  };

  entry.getIsType = function()
  {
    return entry.bIsType;
  };
  
  entry.setIsType = function(bIsType)
  {
    entry.bIsType = bIsType;
  };
  
  entry.getFlags = function()
  {
    return entry.flags;
  };
  
  entry.setFlag = function(type)
  {
    switch(type)
    {
    case "char" :
    case "short" :
    case "float" :
    case "double" :
    case "int" :
    case "long" :
      if (entry.flags & (EF.Char | EF.Short | EF.Float | EF.Double))
      {
        entry.error("Incompatible type combination: " +
                    types(EF.Char | EF.Short | EF.Float | EF.Double,
                          type, entry.flags));
        return;
      }
      
      if ((type == "float" || type == "double") && (entry.flags & EF.Long))
      {
        entry.error("Incompatible type combination: " +
                    types(EF.Float | EF.Double, type, entry.flags));
        return;
      }
      break;
      
    case "unsigned" :
      if (entry.flags & (EF.Float | EF.Double))
      {
        entry.error("Incompatible type combination: " +
                    types(EF.Float | EF.Double, type, entry.flags));
        return;
      }
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
      if (entry.flags & EF.Char)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.flags |= EF.Char;
      break;
      
    case "short" :
      if (entry.flags & EF.Short)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.flags |= EF.Short;
      break;
      
    case "float" :
      if (entry.flags & EF.Float)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.flags |= EF.Float;
      break;
      
    case "double" :
      if (entry.flags & EF.Double)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.flags |= EF.Double;
      break;
      
    case "int" :
      if (entry.flags & EF.Int)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.flags |= EF.Int;
      break;
      
    case "long" :
      if (entry.flags & EF.LongLong)
      {
        entry.error("Type is too long: long long long");
        return;
      }
      entry.flags |= (entry.flags & EF.Long) ? EF.LongLong : EF.Long;
      break;
      
    case "unsigned" :
      if (entry.flags & EF.Unsigned)
      {
        entry.error("Type specified multiple times: " + type);
        return;
      }
      entry.flags |= EF.Unsigned;
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

  return entry;
}

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
 * @return {Map}
 *   TODOC
 */
exports.create = function(parent, name)
{
  var             symtab;

  // Was a name provided?
  if (! name)
  {
    // Nope. Derive one from the parent's name and the number 
    if (! parent)
    {
      // Parent does not exist, so this is the root symbol table.
      name = "<root>";
    }
    else
    {
      // Derive name from parent and child identifier
      name = parent.name + ":" + parent.nextChild;
      ++parent.nextChild;
    }
  }
  else
  {
    // A local name was provided. Prepend the parent's name.
    name = parent.name + ":" + name;
  }

  // Create this new symbol table
  symtab =
    {
      name      : name,
      parent    : parent,
      symbols   : {},
      nextChild : 1
    };
  
  // Allow finding a symbol table by its name
  symtabs[name] = symtab;

  // Push it onto the stack
  symtabStack.push(symtab);
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

  // See if this symbol already exists in the symbol table
  value = symtab.symbols[symName];
  if (value)
  {
    // The symbol was already in the symbol table
    return null;
  }
  
  // Get a new, initialized symbol table entry
  entry = Entry(bIsType || false, symtab, line);

  // Add this symbol to the symbol table
  symtab.symbols[symName] = entry;

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
 * Prepare for processing by resetting the name creation such that new
 * calls to symtab.add() will yield the same names as previously.
 */
exports.reset = function()
{
  symtabStack.forEach(
    function(symtab)
    {
      symtab.nextChild = 1;
    });
}


exports.display = function()
{
  var             i;
  var             entry;
  var             symtab;
  var             symtabName;
  var             symbolName;
  var             sym;

  sys.print("\n");

  for (symtabName in symtabs)
  {
    symtab = symtabs[symtabName];
    sys.print("Symbol table " + symtab.name + "...\n");
    
    for (symbolName in symtab.symbols)
    {
      // Get quick reference to this symbol table entry
      entry = symtab.symbols[symbolName];

      sys.print("  " + symbolName + ":");
      if (entry.getIsType())
      {
        sys.print(" type\n");
      }
      else
      {
        if (entry.flags & EF.Unsigned)
        {
          sys.print(" unsigned");
        }
        if (entry.flags & EF.LongLong)
        {
          sys.print(" long");
        }
        if (entry.flags & EF.Long)
        {
          sys.print(" long");
        }
        if (entry.flags & EF.Short)
        {
          sys.print(" short");
        }
        if (entry.flags & EF.Char)
        {
          sys.print(" char");
        }
        if (entry.flags & EF.Int)
        {
          sys.print(" int");
        }
        if (entry.flags & EF.Float)
        {
          sys.print(" float");
        }
        if (entry.flags & EF.Double)
        {
          sys.print(" double");
        }
        if (entry.flags === 0 && entry.typeName)
        {
          sys.print(" " + entry.typeName);
        }
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
