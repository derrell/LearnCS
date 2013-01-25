

/** Map of available symbol tables */
var symtabs = {};

/** Stack of symbol tables in use during parsing */
var symtabStack = [];

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
 * @param type
 *   The type of the (internally-allocated) symbol table entry
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
exports.add = function(symtab, symName, type, line)
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
  
  entry =
    {
      type     : type,
      origType : type,          // type may change, e.g. if Function
      symtab   : symtab,
      line     : line
    };

  // Do type-specific initialization
  switch(type)
  {
  /*
  case "function_definition":
    break;
    
  case "array":
    break;
  */
  }
  
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

exports.display = function()
{
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
      sys.print("  " + symbolName + ": " +
                symtab.symbols[symbolName].type + "\n");
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
