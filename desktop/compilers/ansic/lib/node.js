/**
 * Create a new node.
 * 
 * @param type {String}
 *   The node type
 * 
 * @param text {String}
 *   The token text (if this node is generated as the result of a rule parsing
 *   a terminal symbol)
 * 
 * @param line {Integer}
 *   The line number in the source code of the just-parsed code.
 *
 * @param filename {String?}
 *   The file name of the source code of the just-parsed code. May not be used.
 *
 * @return {Map}
 *   A node contains 'type' containing the specified node type, 'children', an
 *   initially empty array, and 'lineno' indicating the source code line which
 *   caused the node to be created.
 */
exports.create = function(type, text, line, filename)
{
  var             node;
    
  // Create this new node
  node =
    {
      type     : type,
      children : [],
      line     : line + 1,
      filename : filename
    };
  
  node.error = function(message)
  {
    sys.print("Error: line " + this.line + ": " + message);
    ++error.errorCount;
  };

  // Redefine push() to save the parent of the pushed child in the child
  node.children.push = function(child)
  {
    // If this child is a node, save the parent of this child node
    if (child !== null)
    {
      child.parent = node;
    }
    
    // Now push this child node into the parent's children list
    [].push.call(node.children, child);
  };
  
  return node;
};

/**
 * Display, recursively, the abstract syntax tree beginning at the specified
 * node
 *
 * @param node {Map|String|Null}
 *   One of:
 *    - A Node object to be displayed, along with, recursively, all of its
 *      children.
 *    - A string, representing the value of the parent node. This is used for
 *      the names of identifiers, values of integers, etc.
 *    - null, to indicate lack of an optional child of the parent node
 *
 * @param indent {Integer?}
 *   The indentation level. The top-level call may be issued without passing
 *   this parameter, in which case 0 is used.
 */
var display;
exports.display = display = function(node, indent)
{
  var             i;

  // Default value for indent
  indent = indent || 0;

  // Create the tree lines
  sys.print(new Array(indent + 1).join("| "));
  
  // Is this a Node object?
  if (node && typeof node == "object")
  {
    // Yup. Display its type and line number, then call its children
    // recursively.
    if (typeof node.value !== "undefined")
    {
      sys.print(node.type + ": " + node.value + "\n");
    }
    else
    {
      sys.print(node.type + " (" + node.line + ")" +  "\n");

      // Call recursively to handle children
      node.children.forEach(
        function(subnode)
        {
          display(subnode, indent + 1);
        });
    }
  }
  else
  {
    // It's null. Display a representation of a null value.
    sys.print("<null>\n");
  }
};

/**
 * Process, recursively, the abstract syntax tree beginning at the specified
 * node.
 *
 * @param node {Map|String|Null}
 *   One of:
 *    - A Node object to be processed, along with, recursively, all of its
 *      children.
 *    - A string, representing the value of the parent node. This is used for
 *      the names of identifiers, values of integers, etc.
 *    - null, to indicate lack of an optional child of the parent node
 */
var process;
exports.process = process = function(node, data)
{
  var             i;
  var             subnode;
  var             entry;
  var             entries;
  var             bExists;
  var             identifier;
  var             symtabStruct;
  var             declarator;
  var             function_decl;
  var             pointer;

  // Is this a Node object?
  if (node && typeof node == "object")
  {
    // Yup. See what type it is.
    switch(node.type)
    {
    case "abstract_declarator" :
      throw new Error("abstract_declarator");
      break;
      
    case "add" :
      throw new Error("add");
      break;
      
    case "add-assign" :
      throw new Error("add-assign");
      break;
      
    case "address_of" :
      throw new Error("address_of");
      break;
      
    case "and" :
      throw new Error("and");
      break;
      
    case "argument_expression_list" :
      throw new Error("argument_expression_list");
      break;
      
    case "array_decl" :
      throw new Error("array_decl");
      break;
      
    case "array_decl" :
      throw new Error("array_decl");
      break;
      
    case "array_decl" :
      throw new Error("array_decl");
      break;
      
    case "array_decl" :
      throw new Error("array_decl");
      break;
      
    case "array_decl" :
      throw new Error("array_decl");
      break;
      
    case "array_expression" :
      throw new Error("array_expression");
      break;
      
    case "assign" :
      throw new Error("assign");
      break;
      
    case "auto" :
      throw new Error("auto");
      break;
      
    case "bit-and" :
      throw new Error("bit-and");
      break;
      
    case "bit-and-assign" :
      throw new Error("bit-and-assign");
      break;
      
    case "bit_invert" :
      throw new Error("bit_invert");
      break;
      
    case "bit-or" :
      throw new Error("bit-or");
      break;
      
    case "bit-or-assign" :
      throw new Error("bit-or-assign");
      break;
      
    case "break" :
      throw new Error("break");
      break;
      
    case "case" :
      throw new Error("case");
      break;
      
    case "cast_expression" :
      throw new Error("cast_expression");
      break;
      
    case "char" :
      throw new Error("char");
      break;
      
    case "compound_statement" :
      /*
       * compound_statement
       *   0: declaration_list
       *   1: statement_list
       */
      
      // Create a new scope for this compound statement
      symtab.create(symtab.getCurrent(), null, node.line);
      
      // Process the declaration list
      if (node.children[0])
      {
        process(node.children[0], data);
      }
      
      // Process the statement_list
      if (node.children[1])
      {
        process(node.children[1], data);
      }
      
      // Revert to the prior scope
      symtab.popStack();
      break;
      
    case "const" :
      throw new Error("const");
      break;
      
    case "constant" :
      throw new Error("constant");
      break;
      
    case "continue" :
      throw new Error("continue");
      break;
      
    case "declaration" :
      /*
       * declaration
       *   0: declaration_specifiers
       *   1: init_declarator_list
       *      0: declarator
       *         0: identifier
       *         1: pointer|<null>
       *            0: pointer|<null>
       *               0: etc.
       *         2: initializer?
       *            ...
       *      1: declarator
       *      ...
       */

      // We'll want to keep track of symbol table entries in this declaration
      entries = [];
      
      // Assume we do not expect the entry to already exist in the symbol table
      bExists = false;

      // If this is a typedef, it's already been added to the symbol table
      if (node.children[0].children &&
          node.children[0].children.length > 0 &&
          node.children[0].children[0].type == "typedef")
      {
        // If it's a type, then it will exist already
        bExists = true;
      }

      // Are there identifiers to apply these declaration specifieres to?
      if (! node.children[1])
      {
        // Nope. Just process the declaration_specifiers.
        process(node.children[0], {});
        break;
      }

      // Create symbol table entries for these identifiers
      node.children[1].children.forEach(
        function(declarator)
        {
          var             entry;
          var             pointer;
          var             identifier;

          // Get the identifier name
          identifier = declarator.children[0].value;

          // If the symbol table should already exist...
          if (bExists)
          {
            // ... then retrieve the entry
            entry = symtab.get(null, identifier);

            if (! entry)
            {
              node.error("Programmer error: type name should have existed");
              return;
            }
          }
          else
          {
            // It shouldn't exist. Create a symbol table entry for this
            // variable
            entry = symtab.add(null, identifier, declarator.line, false);

            if (! entry)
            {
              entry = symtab.get(null, identifier);
              node.error("Variable '" + identifier + "' " +
                         "was previously declared near line " +
                         entry.getLine());
              return;
            }
          }

          // Count and save the number of levels of pointers of this variable
          // e.g., char **p; would call incrementPointerCount() twice.
          for (pointer = declarator.children[1];
               pointer;
               pointer = pointer.children[0])
          {
            entry.incrementPointerCount();
          }

          // Add this entry to the list of entries for this declaration
          entries.push(entry);
        });
      
      // Apply the declaration specifiers to each of these entries
      entries.forEach(
        function(entry)
        {
          process(node.children[0], { entry : entry });
        });
      break;

    case "declaration_list" :
      node.children.forEach(
        function(subnode)
        {
          process(subnode, data);
        });
      break;
      
    case "declaration_specifiers" :
      /*
       * declaration_specifiers
       *   0: storage_class_specifier | type_specifier | type_qualifier
       *   ...
       * 
       *   these include native types and storage classes, plus:
       *      typedef
       *      type name
       *      enum
       *      struct
       */

      // For each declaration specifier...
      node.children.forEach(
        function(subnode)
        {
          switch(subnode.type)
          {
          case "typedef" :
            // nothing to do; already noted
            break;
            
          case "type_name" :
            // Add this declared type
            if (data.entry)
            {
              data.entry.setType(subnode.value);
            }
            break;
            
          case "enum_specifier" :
            throw new Error("declaration_specifiers -> enum_specifier");
            break;
            
          case "struct" :
            // Handle declaration of the struct, if necessary
            process(subnode, data);
            
            // We received back the structure symtab entry. Our entry's type,
            // if we were given an entry, is its name.
            if (data.entry)
            {
              data.entry.setType(data.structEntry.name);
            }
            break;
            
          default:
            // Add this declared type
            if (data.entry)
            {
              data.entry.setType(subnode.type);
            }
            break;
          }
        });
      break;

    case "declarator" :
      throw new Error("declarator");
      break;
      
    case "default" :
      throw new Error("default");
      break;
      
    case "dereference" :
      throw new Error("dereference");
      break;
      
    case "direct_abstract_declarator" :
      throw new Error("direct_abstract_declarator");
      break;
      
    case "direct_declarator" :
      throw new Error("direct_declarator");
      break;
      
    case "divide" :
      throw new Error("divide");
      break;
      
    case "divide-assign" :
      throw new Error("divide-assign");
      break;
      
    case "double" :
      throw new Error("double");
      break;
      
    case "do-while" :
      throw new Error("do-while");
      break;
      
    case "ellipsis" :
      throw new Error("ellipsis");
      break;
      
    case "enumerator_list" :
      throw new Error("enumerator_list");
      break;
      
    case "enum_specifier" :
      throw new Error("enum_specifier");
      break;
      
    case "equal" :
      throw new Error("equal");
      break;
      
    case "exclusive-or" :
      throw new Error("exclusive-or");
      break;
      
    case "expression" :
      throw new Error("expression");
      break;
      
    case "expression" :
      throw new Error("expression");
      break;
      
    case "extern" :
      throw new Error("extern");
      break;
      
    case "float" :
      throw new Error("float");
      break;
      
    case "for" :
      throw new Error("for");
      break;
      
    case "for" :
      throw new Error("for");
      break;
      
    case "function_call" :
      throw new Error("function_call");
      break;
      
    case "function_decl" :
      throw new Error("function_decl");
      break;
      
    case "function_definition" :
      /*
       * function_definition
       *   0: type specifier
       *      0: type specifier
       *         0: ...
       *   1: declarator
       *      0: function_decl
       *         0: identifier
       *         1: pointer|<null>
       *            0: pointer|<null>
       *               0: etc.
       *   2: declaration_list
       *   3: compound_statement
       */

      // Create a symbol table entry for the function name
      declarator = node.children[1];
      function_decl = declarator.children[0];
      entry = symtab.add(null, function_decl.children[0].value, 
                         function_decl.line, false);

      if (! entry)
      {
        entry = symtab.get(null, function_decl.children[0].value);
        node.error("Identifier '" + 
                   function_decl.children[0].value + "' " +
                   "was previously declared near line " +
                   entry.getLine());
        return;
      }
      
      // Mark this symbol table entry as a function
      entry.setType("function");

      // Create a symbol table for this function's arguments
      symtab.create(symtab.getCurrent(), 
                    function_decl.children[0].value,
                    function_decl.line);

      // Process the paremeter list
      if (function_decl.children[1])
      {
        process(function_decl.children[1], data);
      }

      // Look for specially-handled type specifiers.
      switch(node.children[0].type)
      {
      case "struct" :
        process(node.children[0], data);
        break;
        
      case "enum_specifier" :
        break;
        
      default:
        // Count and save the number of levels of pointers of this variable
        // e.g., char **p; would call incrementPointerCount() twice.
        for (pointer = declarator.children[1];
             pointer;
             pointer = pointer.children[0])
        {
          entry.incrementPointerCount();
        }

        // Add this declaration's types to each of those symtab entries
        for (subnode = node.children[0];
             subnode;
             subnode = subnode.children ? subnode.children[0] : null)
        {
          // ... add this declared type
          entry.setType(subnode.type == "type_name"
                        ? subnode.value
                        : subnode.type);
        }
        
        // I have no idea what this declaration list is, in children[2]
        if (node.children[2])
        {
          throw new Error("What is a declaration_list??? " +
                          "K&R-style declarations?");
        }

        // Process the compound statement
        process(node.children[3], data);
        break;
      }

      // Pop this function's symbol table from the stack
      symtab.popStack();

      break;
      
    case "goto" :
      throw new Error("goto");
      break;
      
    case "greater-equal" :
      throw new Error("greater-equal");
      break;
      
    case "greater-than" :
      throw new Error("greater-than");
      break;
      
    case "identifer" :
      throw new Error("identifer");
      break;
      
    case "identifier_list" :
      throw new Error("identifier_list");
      break;
      
    case "if" :
      throw new Error("if");
      break;
      
    case "init_declarator_list" :
      throw new Error("init_declarator_list");
      break;
      
    case "initializer" :
      throw new Error("initializer");
      break;
      
    case "initializer_list" :
      throw new Error("initializer_list");
      break;
      
    case "int" :
      throw new Error("int");
      break;
      
    case "label" :
      throw new Error("label");
      break;
      
    case "left-shift" :
      throw new Error("left-shift");
      break;
      
    case "left-shift-assign" :
      throw new Error("left-shift-assign");
      break;
      
    case "less-equal" :
      throw new Error("less-equal");
      break;
      
    case "less-than" :
      throw new Error("less-than");
      break;
      
    case "long" :
      throw new Error("long");
      break;
      
    case "mod" :
      throw new Error("mod");
      break;
      
    case "mod-assign" :
      throw new Error("mod-assign");
      break;
      
    case "multiply" :
      throw new Error("multiply");
      break;
      
    case "multiply-assign" :
      throw new Error("multiply-assign");
      break;
      
    case "negative" :
      throw new Error("negative");
      break;
      
    case "not" :
      throw new Error("not");
      break;
      
    case "not-equal" :
      throw new Error("not-equal");
      break;
      
    case "or" :
      throw new Error("or");
      break;
      
    case "parameter_declaration" :
      /*
       * parameter_declaration
       *   0: declaration_specifiers
       *   1: declarator?
       *   2: abstract_declarator?
       */

      // Get the identifier name
      declarator = node.children[1];
      identifier = declarator.children[0].value;

      // It shouldn't exist. Create a symbol table entry for this
      // variable
      entry = symtab.add(null, identifier, declarator.line, false);

      if (! entry)
      {
        entry = symtab.get(null, identifier);
        node.error("Parameter '" + identifier + "' " +
                   "was previously declared near line " +
                   entry.getLine());
        return;
      }

      // Count and save the number of levels of pointers of this variable
      // e.g., char **p; would call incrementPointerCount() twice.
      for (pointer = declarator.children[1];
           pointer;
           pointer = pointer.children[0])
      {
        entry.incrementPointerCount();
      }
      
      // Apply the declaration specifiers to each of this entry
      process(node.children[0], { entry : entry });

      // Process abstract declarators
      if (node.children[2])
      {
        process(node.children[2], { entry : entry });
      }
      break;
      
    case "parameter_list" :
      /*
       * parameter_list
       *   0: parameter_declaration
       *   ...
       *   n: ellipsis?
       */
      node.children.forEach(
        function(subnode)
        {
          process(subnode, data);
        });
      break;
      
    case "pointer" :
      throw new Error("pointer");
      break;
      
    case "pointer_access" :
      throw new Error("pointer_access");
      break;
      
    case "positive" :
      throw new Error("positive");
      break;
      
    case "post_decrement_op" :
      throw new Error("post_decrement_op");
      break;
      
    case "postfix_expression" :
      throw new Error("postfix_expression");
      break;
      
    case "post_increment_op" :
      throw new Error("post_increment_op");
      break;
      
    case "pre_decrement_op" :
      throw new Error("pre_decrement_op");
      break;
      
    case "pre_increment_op" :
      throw new Error("pre_increment_op");
      break;
      
    case "register" :
      throw new Error("register");
      break;
      
    case "return" :
      throw new Error("return");
      break;
      
    case "right-shift" :
      throw new Error("right-shift");
      break;
      
    case "right-shift-assign" :
      throw new Error("right-shift-assign");
      break;
      
    case "short" :
      throw new Error("short");
      break;
      
    case "signed" :
      throw new Error("signed");
      break;
      
    case "sizeof" :
      throw new Error("sizeof");
      break;
      
    case "specifier_qualifier_list" :
      throw new Error("specifier_qualifier_list");
      break;
      
    case "statement_list" :
sys.print("IGNORING STATEMENT_LIST");
break;
      node.children.forEach(
        function(subnode)
        {
          process(subnode, data);
        });
      break;
      
    case "static" :
      throw new Error("static");
      break;
      
    case "string_literal" :
      throw new Error("string_literal");
      break;
      
    case "struct" :
      /*
       * struct
       *   0 : struct_declaration_list
       *   1 : identifier
       */

      // Is there an identifier?
      if (node.children.length > 1 && node.children[1])
      {
        // Yes. Retrieve it.
        identifier = node.children[1].value;
      }
      else
      {
        // Otherwise, create a unique identifier.
        identifier = "struct#" + symtab.getUniqueId();
      }

      // Retrieve the symbol table entry for this struct (a type)
      entry = symtab.get(symtab.getCurrent(), identifier);

      // Create a special symbol table for this struct's members
      symtabStruct = entry.getStructSymtab();
      if (! symtabStruct)
      {
        symtabStruct = symtab.create(null, identifier, node.line);
        entry.setStructSymtab(symtabStruct);
      }

      // Add each of the members to the entry's symbol table
      if (node.children[0])
      {
        process(node.children[0], { entry : entry });
      }
      
      // Add the symbol table entry to the data so it's available to our caller
      data.structEntry = entry;
      break;
      
    case "struct_declaration" :
      /*
       * struct_declaration
       *   0: specifier_qualifier_list
       *   1: struct_declarator_list
       *      0: struct_declarator
       *         0: declarator
       *            0: identifier
       *            1: pointer
       *               0: ...
       */
      
      // Obtain a symbol table entry for the identifier. Put it in the sybol
      // table associated with the entry in our data.
      identifier = node.children[1].children[0].children[0].children[0].value;
      symtabStruct = data.entry.getStructSymtab();
      entry = symtab.add(symtabStruct, identifier, node.line, false);

      if (! entry)
      {
        entry = symtab.get(symtabStruct, identifier);
        node.error("Structure member '" + identifier + "' " +
                   "was previously declared near line " + entry.getLine());
        return;
      }

      // Process the specifier qualifier list to add this declaration's types
      // to the symtab entry. For each declared type...
      node.children[0].children.forEach(
        function(subnode)
        {
          // ... add this declared type to the entry. First check for ones we
          // must handle specially.
          if (subnode.type == "struct")
          {
            /*
             * struct
             *   0: struct_declaration_list
             *   1: identifier
             */
            process(subnode, data);
            entry.setType(subnode.children[1].value);
          }
          else if (subnode.type == "enum_specifier")
          {

          }
          else
          {
            entry.setType(subnode.type == "type_name"
                          ? subnode.value
                          : subnode.type);
          }
        });
      break;
      
    case "struct_declaration_list" :
      /*
       * struct_declaration_list
       *   0: struct_declaration
       *   ...
       */
      node.children.forEach(
        function(subnode)
        {
          process(subnode, data);
        });
      break;
      
    case "struct_declarator" :
      throw new Error("struct_declarator");
      break;
      
    case "struct_declarator_list" :
      throw new Error("struct_declarator_list");
      break;
      
    case "structure_reference" :
      throw new Error("structure_reference");
      break;
      
    case "subtract" :
      throw new Error("subtract");
      break;
      
    case "subtract-assign" :
      throw new Error("subtract-assign");
      break;
      
    case "switch" :
      throw new Error("switch");
      break;
      
    case "translation_unit" :
      node.children.forEach(
        function(subnode)
        {
          process(subnode, data);
        });
      break;
      
    case "trinary" :
      throw new Error("trinary");
      break;
      
    case "type" :
      throw new Error("type");
      break;
      
    case "typedef" :
      throw new Error("typedef");
      break;
      
    case "type_definition" :
      throw new Error("type_definition");
      break;
      
    case "type_name" :
      throw new Error("type_name");
      break;
      
    case "type_qualifier_list" :
      throw new Error("type_qualifier_list");
      break;
      
    case "union" :
      throw new Error("union");
      break;
      
    case "unsigned" :
      throw new Error("unsigned");
      break;
      
    case "void" :
      throw new Error("void");
      break;
      
    case "volatile" :
      throw new Error("volatile");
      break;
      
    case "xor-assign" :
      throw new Error("xor-assign");
      break;

    default:
      sys.print("Unexpected node type: " + node.type);
      break;
    }
  }
  else
  {
    // It's null. Display a representation of a null value.
    throw new Error("attempt to process <null>");
  }
};

