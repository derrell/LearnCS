/**
 * Abstract syntax tree nodes
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var qx = require("qooxdoo");
require("./NodeArray");

qx.Class.define("learncs.lib.Node",
{
  extend : qx.core.Object,
  
  /**
   * Create a new node.
   * 
   * @param type {String}
   *   The node type
   * 
   * @param text {String}
   *   The token text (if this node is generated as the result of a rule
   *   parsing a terminal symbol)
   * 
   * @param line {Integer}
   *   The line number in the source code of the just-parsed code.
   *
   * @param filename {String?}
   *   The file name of the source code of the just-parsed code. May not be
   *   used.
   *
   * @return {Map}
   *   A node contains 'type' containing the specified node type, 'children',
   *   an initially empty array, and 'lineno' indicating the source code line
   *   which caused the node to be created.
   */
  construct : function(type, text, line, filename)
  {
    this.base(arguments);
    
    this.type = type;
    this.children = new learncs.lib.NodeArray(this);
    this.line = line + 1;
    this.filename = filename;
  },

  statics :
  {
    __mem : null,
    
    NumberType :
    {
      Integer : "integer",
      Float   : "float"
    }
  },
  
  members :
  {
    __symtab : null,

    /**
     * Display an error message regarding this node
     * 
     * @param message {String}
     *   The error message to display
     */
    error : function(message)
    {
      sys.print("Error: line " + this.line + ": " + message + "\n");
      ++error.errorCount;
    },

    /**
     * Process all sub-nodes of a node
     * 
     * @param node
     *   The node whose sub-nodes (children) are to be processed
     */
    __processSubnodes : function(data, bExecuting)
    {
      this.children.forEach(
        function(subnode)
        {
          subnode.process(data, bExecuting);
        }, 
        this);
    },

    /**
     * Display, recursively, the abstract syntax tree beginning at the
     * specified node
     *
     * @param node {Map|String|Null}
     *   One of:
     *    - A Node object to be displayed, along with, recursively, all of its
     *      children.
     *    - A string, representing the value of the parent node. This is used
     *      for the names of identifiers, values of integers, etc.
     *    - null, to indicate lack of an optional child of the parent node
     *
     * @param indent {Integer?}
     *   The indentation level. The top-level call may be issued without passing
     *   this parameter, in which case 0 is used.
     */
    display : function(indent)
    {
      var             i;

      // Default value for indent
      indent = indent || 0;

      // Create the tree lines
      sys.print(new Array(indent + 1).join("| "));

      // Display its type and line number, then call its children recursively.
      if (typeof this.value !== "undefined")
      {
        // We have a value, so display it, and its type
        sys.print(this.type + ": " + this.value);
        if (typeof this.numberType != "undefined")
        {
          sys.print(" (" + this.numberType + ")");
        }
        sys.print("\n");
      }
      else
      {
        sys.print(this.type + " (" + this.line + ")" +  "\n");

        // Call recursively to handle children
        this.children.forEach(
          function(subnode)
          {
            if (subnode && typeof subnode == "object")
            {
              subnode.display(indent + 1);
            }
            else
            {
              // It's null. Display a representation of a null value.
              // Create the tree lines
              sys.print(new Array(indent + 2).join("| "));

              // Now display the (null) representation of this object.
              sys.print(subnode + "\n");
            }
          },
          this);
      }
    },
    
    /**
     * After parsing, the line number for a node is the line at which that
     * node's code completed. What we really want is the line at which that
     * node's code began. Search each node for its children's minimum line
     * number, and recursively set each node to have that minimum as its own
     * line number.
     */
    fixLineNumbers : function()
    {
      var             minLine = Number.MAX_VALUE;
      var             line;

      // If there are children of this node...
      if (this.children)
      {
        // ... then calculate the minimum line number of each of this node's
        // chidlren.
        this.children.forEach(
          function(subnode)
          {
            if (subnode)
            {
              // Get the minimum line number for this child node
              line = subnode.fixLineNumbers() || this.line;
            }
            else
            {
              line = this.line;
            }


            // Is it less than our previous minimum?
            if (line < minLine)
            {
              // Yup. Save this one.
              minLine = line;
            }
          },
          this);
      }

      // If this node's own line number is less than the minimum so far...
      if (this.line < minLine)
      {
        // ... then save this one.
        minLine = this.line;
      }

      // This node's line number becomes the minimum of all of its children's
      // line numbers and its own line number.
      this.line = minLine;

      // Return the (possibly new) line number of this node
      return this.line;
    },

    /**
     * Process, recursively, the abstract syntax tree beginning at the specified
     * node.
     *
     * @param data {Map}
     *   Data used for sub-node processing, as required per node type
     *
     * @param bExecuting {Boolean}
     *   false when the code is initially being compiled (symbol tables being
     *   built); true when the code is executing.
     */
    process : function(data, bExecuting)
    {
      var             i;
      var             fp;
      var             sp;
      var             subnode;
      var             entry;
      var             bExists;
      var             identifier;
      var             symtab;
      var             symtabStruct;
      var             declarator;
      var             function_decl;
      var             pointer;
      var             value1;
      var             value2;
      var             process = learncs.lib.Node.process;

      // Yup. See what type it is.
      switch(this.type)
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
        /*
         * argument_expression_list
         *   0: assignment_expression
         *   ...
         */
        this.__processSubnodes(data, bExecuting);
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
        // TODO: Test for left side variable or address (lvalue) in 23 = 42
        // Produce a *meaningful* error message

        /*
         * assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Retrieve the lvalue
        value1 = this.children[0].process(data, true);
        value2 = this.children[1].process(data, true);
        learncs.lib.Node.__mem.set(value1.value, value2.type, value2.value);

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

        // Determine if we're executing, or generating symbol tables
        if (bExecuting)
        {
          // We're executing. Retrieve the symbol table from the node
          symtab = this.__symtab;
          if (! symtab)
          {
            throw new Error("Programmer error: Expected to find symtab entry");
          }
          
          // Push this symbol table onto the stack, as if we'd just created it.
          learncs.lib.Symtab.pushStack(symtab);
        }
        else
        {
          // Create a new scope for this compound statement
          symtab = new learncs.lib.Symtab(learncs.lib.Symtab.getCurrent(),
                                          "compound@" + this.line,
                                          this.line);
          // Save the symbol table for when we're executing
          this.__symtab = symtab;
        }

        // Process the declaration list
        if (this.children[0])
        {
          this.children[0].process(data, bExecuting);
        }

        // If we're executing...
        if (bExecuting)
        {
          // ... then process the statement_list
          if (this.children[1])
          {
            this.children[1].process(data, bExecuting);
          }
        }

        // Revert to the prior scope
        learncs.lib.Symtab.popStack();
        break;

      case "const" :
        throw new Error("const");
        break;

      case "constant" :
        return { value : this.value, type : this.numberType };

      case "continue" :
        throw new Error("continue");
        break;

      case "declaration" :
        /*
         * declaration
         *   0: declaration_specifiers
         *   1: init_declarator_list
         *      0: init_declarator
         *         0: declarator
         *            0: identifier
         *            1: pointer|<null>
         *               0: pointer|<null>
         *                  0: etc.
         *         1: initializer?
         *      1: init_declarator
         *      ...
         */

        // Determine if we're executing, or generating symbol tables
        if (bExecuting)
        {
          // Are there identifiers to apply these declaration specifieres to?
          if (! this.children[1])
          {
            // Nope. We have nothing to do while executing.
            break;
          }
          
          // Process any variable initializers
          this.children[1].children.forEach(
            function(init_declarator)
            {
              var             entry;
              var             value;
              var             pointer;
              var             identifier;
              var             declarator;

              // Retrieve this declarator
              declarator = init_declarator.children[0];

              // Get the identifier name
              identifier = declarator.children[0].value;

              // Retrieve the symbol table entry
              entry = learncs.lib.Symtab.getCurrent().get(identifier);

              if (! entry)
              {
                this.error("Programmer error: name should have existed");
                return;
              }

              // If there is an initializer...
              if (init_declarator.children[1])
              {
                // ... then retrieve its value
                value = init_declarator.children[1].process(data, bExecuting);
                learncs.lib.Node.__mem.set(entry.getAddr(), 
                                           entry.getType(),
                                           value);
              }
            },
            this);
          
          // Nothing more to do if we're executing.
          break;
        }

        //
        // The remainder of this case is for !bExecuting
        //

        // Assume we do not expect the entry to already exist in the symbol
        // table
        bExists = false;

        // If this is a typedef, it's already been added to the symbol table
        if (this.children[0].children &&
            this.children[0].children.length > 0 &&
            this.children[0].children[0].type == "typedef")
        {
          // If it's a type, then it will exist already
          bExists = true;
        }

        // Are there identifiers to apply these declaration specifieres to?
        if (! this.children[1])
        {
          // Nope. Just process the declaration_specifiers.
          this.children[0].process( {}, bExecuting );
          break;
        }

        // Create symbol table entries for these identifiers
        this.children[1].children.forEach(
          function(init_declarator)
          {
            var             entry;
            var             value;
            var             pointer;
            var             identifier;
            var             declarator;

            // Retrieve this declarator
            declarator = init_declarator.children[0];

            // Get the identifier name
            identifier = declarator.children[0].value;

            // If the symbol table should already exist...
            if (bExists)
            {
              // ... then retrieve the entry
              entry = learncs.lib.Symtab.getCurrent().get(identifier);

              if (! entry)
              {
                this.error("Programmer error: type name should have existed");
                return;
              }
            }
            else
            {
              // It shouldn't exist. Create a symbol table entry for this
              // variable
              entry = learncs.lib.Symtab.getCurrent().add(
                identifier, declarator.line, false);

              if (! entry)
              {
                entry = learncs.lib.Symtab.getCurrent().get(identifier, true);
                this.error("Variable '" + identifier + "' " +
                           "was previously declared near line " +
                           entry.getLine());
                return;
              }
            }

            // Count and save the number of levels of pointers of this
            // variable e.g., char **p; would call incrementPointerCount()
            // twice.
            for (pointer = declarator.children[1];
                 pointer;
                 pointer = pointer.children[0])
            {
              entry.incrementPointerCount();
            }

            // Apply the declaration specifiers to this entry
            if (this.children && this.children[0])
            {
              this.children[0].process( { entry : entry }, bExecuting );
            }
          },
          this);
        break;

      case "declaration_list" :
        /*
         * declaration_list
         *   0: declaration
         *   ...
         */
        this.__processSubnodes(data, bExecuting);
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
        this.children.forEach(
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
              subnode.process(data, bExecuting);

              // We received back the structure symtab entry. Our entry's
              // type, if we were given an entry, is its name.
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
          },
          this);
        break;

      case "declarator" :
        // should never occur; handled in each case that uses a declarator
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
        /*
         * function_call
         *   0: postfix_expression (function to be called)
         *   1: argument_expression_list?
         */
        throw new Error("function_call");
        break;

      case "function_decl" :
        // handled by function_definition
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
        declarator = this.children[1];
        function_decl = declarator.children[0];

        // If we're executing...
        if (bExecuting)
        {
          // ... then the symbol table entry for this function must
          // exist. Retrieve it from the node where we saved it.
          symtab = this.__symtab;
          
          // Push it onto the symbol table stack as if we'd just created it
          learncs.lib.Symtab.pushStack(symtab);

          // Process the paremeter list
          if (function_decl.children[1])
          {
            function_decl.children[1].process(data, bExecuting);
          }
        }
        else
        {
          entry = learncs.lib.Symtab.getCurrent().add(
            function_decl.children[0].value, 
            function_decl.line, false);

          if (! entry)
          {
            entry = learncs.lib.Symtab.getCurrent().get(
              function_decl.children[0].value, true);
            this.error("Identifier '" + 
                       function_decl.children[0].value + "' " +
                       "was previously declared near line " +
                       entry.getLine());
            return null;
          }

          // Mark this symbol table entry as a function and save this node, to
          // later execute it
          entry.setType("function", this);

          // Create a symbol table for this function's arguments
          symtab = new learncs.lib.Symtab(learncs.lib.Symtab.getCurrent(), 
                                          function_decl.children[0].value,
                                          function_decl.line);

          // Save the symbol table for when we're executing
          this.__symtab = symtab;

          // Process the paremeter list
          if (function_decl.children[1])
          {
            function_decl.children[1].process(data, bExecuting);
          }

          // Look for specially-handled type specifiers.
          switch(this.children[0].type)
          {
          case "struct" :
            this.children[0].process(data, bExecuting);
            break;

          case "enum_specifier" :
            throw new Error("enum_specifier not yet implemented");
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
            for (subnode = this.children[0];
                 subnode;
                 subnode = subnode.children ? subnode.children[0] : null)
            {
              // ... add this declared type
              entry.setType(subnode.type == "type_name"
                            ? subnode.value
                            : subnode.type);
            }

            // I have no idea what this declaration list is, in children[2]
            if (this.children[2])
            {
              throw new Error("What is a declaration_list??? " +
                              "K&R-style declarations?");
            }
          }
        }

        // Process the compound statement
        this.children[3].process(data, bExecuting);
        break;

        // Pop this function's symbol table from the stack
        learncs.lib.Symtab.popStack();

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

      case "identifier" :
        throw new Error("identifer");
        break;

      case "identifier_list" :
        /*
         * identifier_list
         *   0: identifier
         *   ...
         */
        this.__processSubnodes(data, bExecuting);
        break;

      case "if" :
        throw new Error("if");
        break;

      case "init_declarator_list" :
        /*
         * init_declarator_list
         *   0: init_declarator
         *   ...
         */
        this.__processSubnodes(data, bExecuting);
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

        // Prepare to get the identifier name
        declarator = this.children[1];

        // If there is one...
        if (declarator)
        {
          // ... then extract it.
          identifier = declarator.children[0].value;

          // If we're executing...
          if (bExecuting)
          {
            // ... then retrieve the existing symbol table entry
            entry = learncs.lib.Symtab.getCurrent().get(identifier, true);
            if (! entry)
            {
              throw new Error("Programmer error: entry should exist");
            }
          }
          else
          {
            // It shouldn't exist. Create a symbol table entry for this
            // variable
            entry = learncs.lib.Symtab.getCurrent().add(
              identifier, declarator.line, false);

            if (! entry)
            {
              entry = learncs.lib.Symtab.getCurrent().get(identifier, true);
              this.error("Parameter '" + identifier + "' " +
                         "was previously declared near line " +
                         entry.getLine());
              return null;
            }

            // Count and save the number of levels of pointers of this variable
            // e.g., char **p; would call incrementPointerCount() twice.
            for (pointer = declarator.children[1];
                 pointer;
                 pointer = pointer.children[0])
            {
              entry.incrementPointerCount();
            }
          }
        }

        // Apply the declaration specifiers to each of this entry
        this.children[0].process( { entry : entry }, bExecuting );

        // Process abstract declarators
        if (this.children[2])
        {
          this.children[2].process( { entry : entry }, bExecuting );
        }
        break;

      case "parameter_list" :
        /*
         * parameter_list
         *   0: parameter_declaration
         *   ...
         *   n: ellipsis?
         */
        this.__processSubnodes(data, bExecuting);
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
        /*
         * postfix_expression
         *   0: primary_expression |
         *      array_expression | 
         *      structure_reference |
         *      pointer_access
         *   ...
         */
        return this.children[0].process(data, bExecuting);

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
        /*
         * statement_list
         *   0: statement
         *   ...
         */
        this.__processSubnodes(data, bExecuting);
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
        
        // We are not expecting to get here while executing
        if (bExecuting)
        {
          throw new Error("Programmer error? Did not expect to get here.");
        }

        // Is there an identifier?
        if (this.children.length > 1 && this.children[1])
        {
          // Yes. Retrieve it.
          identifier = this.children[1].value;
        }
        else
        {
          // Otherwise, create a unique identifier.
          identifier = "struct#" + learncs.lib.Symtab.getUniqueId();
        }

        // Retrieve the symbol table entry for this struct (a type)
        entry = learncs.lib.Symtab.getCurrent().get(identifier, false);

        // Create a special symbol table for this struct's members
        symtabStruct = entry.getStructSymtab();
        if (! symtabStruct)
        {
          symtabStruct = new learncs.lib.Symtab(null, identifier, this.line);
          entry.setStructSymtab(symtabStruct);
        }

        // Add each of the members to the entry's symbol table
        if (this.children[0])
        {
          this.children[0].process( { entry : entry }, bExecuting );
        }

        // Add the symbol table entry to the data so it's available to our
        // caller
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

        // Obtain a symbol table entry for the identifier. Put it in the
        // sybol table associated with the entry in our data.
        identifier =
          this.children[1].children[0].children[0].children[0].value;
        symtabStruct = data.entry.getStructSymtab();
        entry = symtabStruct.add(identifier, this.line, false);

        if (! entry)
        {
          entry = symtabStruct.get(identifier, false);
          this.error("Structure member '" + identifier + "' " +
                     "was previously declared near line " + entry.getLine());
          return null;
        }

        // Process the specifier qualifier list to add this declaration's
        // types to the symtab entry. For each declared type...
        this.children[0].children.forEach(
          function(subnode)
          {
            // ... add this declared type to the entry. First check for ones
            // we must handle specially.
            if (subnode.type == "struct")
            {
              /*
               * struct
               *   0: struct_declaration_list
               *   1: identifier
               */
              subnode.process(data, bExecuting);
              entry.setType(subnode.children[1].value);
            }
            else if (subnode.type == "enum_specifier")
            {
              throw new Error("enum_specifier not yet implemented");
            }
            else
            {
              entry.setType(subnode.type == "type_name"
                            ? subnode.value
                            : subnode.type);
            }
          },
          this);
        break;

      case "struct_declaration_list" :
        /*
         * struct_declaration_list
         *   0: struct_declaration
         *   ...
         */
        this.__processSubnodes(data, bExecuting);
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
        /*
         * translation_unit
         *   0: external_declaration
         *   ...
         */
        this.__processSubnodes(data, bExecuting);
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
        sys.print("Unexpected node type: " + this.type);
        break;
      }
      
      return null;
    }
  },
  
  defer : function(statics)
  {
    learncs.lib.Node.__mem = learncs.machine.Memory.getInstance();
  }
});
