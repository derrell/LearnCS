/**
 * Abstract syntax tree nodes
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
  var printf = require("printf");
  require("./NodeArray");
}

qx.Class.define("playground.c.lib.Node",
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
    this.children = new playground.c.lib.NodeArray(this);
    this.line = line + 1;
    this.filename = filename;
  },

  statics :
  {
    /** The Memory singleton instance */
    __mem : null,
    
    /** Mappings of types of numbers to their types */
    NumberType :
    {
      Int     : "int",
      Uint    : "unsigned int",
      Long    : "long",
      ULong   : "unsigned long",
      Float   : "float",
      Address : "pointer"
    },
    
    /** The error object */
    __error : null,
    
    /**
     * Setter for the error object 
     * 
     * @param error {Map}
     *   A map containing a parseError function and an errorCount value.
     */
    setError : function(error)
    {
      playground.c.lib.Node.__error = error;
    },
    
    /**
     * Getter for the error object 
     * 
     * @return {Map} 
     *   A map containing a parseError function and an errorCount value, as
     *   previously saved here by a call to setError().
     */
    getError : function()
    {
      return playground.c.lib.Node.__error;
    }
  },
  
  members :
  {
    /** The symbol table associated with this specific node */
    _symtab : null,

    /**
     * Display an error message regarding this node
     * 
     * @param message {String}
     *   The error message to display
     */
    error : function(message)
    {
      console.log("Error: line " + this.line + ": " + message + "\n");
      ++playground.c.lib.Node.__error.errorCount;
    },

    getExpressionValue : function(value)
    {
        // If it was a symbol table entry...
        if (value instanceof playground.c.lib.SymtabEntry)
        {
          // ... then retrieve the symbol's address
          value = { value : value.getAddr(), type : value.getType() };
          value.value = playground.c.lib.Node.__mem.get(value.value, value.type);
        }

        return value;
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
      var             parts = [];

      // Default value for indent
      indent = indent || 0;

      // Create the tree lines
      parts.push(new Array(indent + 1).join("| "));

      // Display its type and line number, then call its children recursively.
      if (typeof this.value !== "undefined")
      {
        // We have a value, so display it, and its type
        parts.push(this.type + ": " + this.value);
        if (typeof this.numberType != "undefined")
        {
          parts.push(" (" + this.numberType + ")");
        }
        console.log(parts.join(""));
        parts =[];
      }
      else
      {
        console.log(parts.join("") + this.type + " (" + this.line + ")");
        parts = [];

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
              parts.push(new Array(indent + 2).join("| "));

              // Now display the (null) representation of this object.
              console.log(parts.join("") + subnode + "\n");
              parts = [];
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
      var             value3;
      var             process = playground.c.lib.Node.process;
      var             WORDSIZE = playground.c.machine.Memory.WORDSIZE;

      if (bExecuting)
      {
//        console.log("Processing node " + this.type);
      }

      // Yup. See what type it is.
      switch(this.type)
      {
      case "abstract_declarator" :
        throw new Error("abstract_declarator");
        break;

      case "add" :
        /*
         * add :
         *   0 : additive_expression
         *   1 : multiplicative_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value + value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
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
        
        if (! bExecuting)
        {
          // Likely there's nothing to do when not executing, but call
          // subnodes just in case.
          this.__processSubnodes(data, bExecuting);
        }
        else
        {
          // When we're executing, we need to push the expression values onto
          // the stack in reverse order.
          for (i = this.children.length - 1; i >= 0; --i)
          {
            value1 = this.getExpressionValue(
              this.children[i].process(data, bExecuting));

            // Promote the argument type, if necessary
            value1.type =
            {
              "char"               : "int",
              "unsigned char"      : "unsigned int",
              "short"              : "int",
              "unsigned short"     : "unsigned int",
              "int"                : "int",
              "unsigned int"       : "unsigned int",
              "long"               : "long",
              "unsigned long"      : "unsigned long",
              "long long"          : "long long",
              "unsigned long long" : "unsigned long long",
              "float"              : "double",
              "double"             : "double",
              "pointer"            : "pointer"
            }[value1.type];

            // Push the argument onto the stack
            playground.c.lib.Node.__mem.stackPush(value1.type, value1.value);
            
            // If we were given a JavaScript array in which to place args too...
            if (data.args)
            {
              // ... then add this one.
              data.args.unshift(value1.value);
            }
          }
        }
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
        
        // If it was a symbol table entry...
        if (value1 instanceof playground.c.lib.SymtabEntry)
        {
          // ... then retrieve the symbol's address
          value1 = { value : value1.getAddr(), type : value1.getType() };
        }
        
        // Retrieve the value to assign there
        value3 = this.getExpressionValue(this.children[1].process(data, true));

        // Save the value at its new address
        playground.c.lib.Node.__mem.set(value1.value, value1.type, value3.value);
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
          symtab = this._symtab;
          if (! symtab)
          {
            throw new Error("Programmer error: Expected to find symtab entry");
          }
          
          // Push this symbol table onto the stack, as if we'd just created it.
          playground.c.lib.Symtab.pushStack(symtab);

          // Save the new frame pointer
          symtab.setFramePointer(
            playground.c.lib.Node.__mem.getReg("SP", "unsigned int") -
              symtab.getSize());
        }
        else
        {
          // Create a new scope for this compound statement
          symtab = new playground.c.lib.Symtab(
            playground.c.lib.Symtab.getCurrent(),
            "compound@" + this.line,
            this.line);
          // Save the symbol table for when we're executing
          this._symtab = symtab;
        }

        // Process the declaration list
        if (this.children[0])
        {
          this.children[0].process(data, bExecuting);
        }

        // Process the statement_list
        if (this.children[1])
        {
          this.children[1].process(data, bExecuting);
        }
          
        // If we're executing...
        if (bExecuting)
        {
          // Restore the previous frame pointer
          symtab.restoreFramePointer();
        }

        // Revert to the prior scope
        playground.c.lib.Symtab.popStack();
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
        if (!bExecuting)
        {
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
                entry = playground.c.lib.Symtab.getCurrent().get(identifier);

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
                entry = playground.c.lib.Symtab.getCurrent().add(
                  identifier, declarator.line, false);

                if (! entry)
                {
                  entry = playground.c.lib.Symtab.getCurrent().get(
                    identifier, true);
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
        }
        
        // We enter this next block in various cases:
        //   (1) We are executing, so we need to initialize variables
        //   (2) We're not yet exeucting, but we're at the global scope. In
        //       that case, we need to initialize the global variables.
        //   TODO (maybe):
        //   (3) There are static variables which need initialization
        if (bExecuting || ! playground.c.lib.Symtab.getCurrent().getParent())
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
              entry = playground.c.lib.Symtab.getCurrent().get(identifier);

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
                playground.c.lib.Node.__mem.set(entry.getAddr(), 
                                                entry.getType(),
                                                value.value);
              }
            },
            this);

          // Nothing more to do if we're executing.
          break;
        }
        break;

      case "declaration_list" :
        /*
         * declaration_list
         *   0: declaration
         *   ...
         */
        this.__processSubnodes(data, bExecuting);

        // Adjust the stack pointer to take automatic local variables into
        // account. First, get the current symbol table
        symtab = playground.c.lib.Symtab.getCurrent();

        // Get the stack pointer's current value
        sp = playground.c.lib.Node.__mem.getReg("SP", "unsigned int");

        // Subtract the symbol table's size from the stack pointer, so that
        // subsequent function calls don't overwrite the automatic local
        // variables
        sp -= symtab.getSize();

        // Write the new stack pointer value
        playground.c.lib.Node.__mem.setReg("SP", "unsigned int", sp);
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

        // We don't need to do this if we're executing
        if (bExecuting)
        {
          break;
        }

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
        /*
         * divide :
         *   0 : multiplicative_expression
         *   1 : cast_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value / value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
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

      case "extern" :
        throw new Error("extern");
        break;

      case "float" :
        throw new Error("float");
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
        if (! bExecuting)
        {
          break;
        }
        
        // Save the stack pointer and frame pointer, so we can restore them
        // after the function call
        sp = playground.c.lib.Node.__mem.getReg("SP", "unsigned int");
        
        // Retrieve the symbol table entry for this function
        value1 = this.children[0].process(data, bExecuting);
        
        // Get the address of that entry, which is the node for the called
        // function, or the reference of a built-in function.
        value2 = value1.getAddr();
        
        // Prepare to save arguments in a JS array as well as on the stack, in
        // case this is a built-in function being called.
        if (value1.getType().match("built-in"))
        {
          data.args = [];
        }

        // Push the arguments onto the stack
        this.children[1].process(data, bExecuting);

        // Is this a built-in function, or a user-generated one?
        if (value1.getType().match("built-in"))
        {
          // Save the return value in value3
          value3 = value2.apply(null, data.args);
        }
        else
        {
          // Save the new frame pointer
          value2._symtab.setFramePointer(
            playground.c.lib.Node.__mem.getReg("SP", "unsigned int"));

          // Push the return address (our current line number) onto the stack
          playground.c.lib.Node.__mem.stackPush("unsigned int", this.line);

          // Process that function. Save its return value in value3
          value3 = value2.process(data, bExecuting);

          // Restore the previous frame pointer
          value2._symtab.restoreFramePointer();
        }
        
        // Remove our argument array
        delete data.args;

        // Restore the stack pointer
        playground.c.lib.Node.__mem.setReg("SP", "unsigned int", sp);
        return value3;

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
          symtab = this._symtab;
          
          // Push it onto the symbol table stack as if we'd just created it
          playground.c.lib.Symtab.pushStack(symtab);

          // Process the paremeter list
          if (function_decl.children[1])
          {
            function_decl.children[1].process(data, bExecuting);
          }
        }
        else
        {
          entry = playground.c.lib.Symtab.getCurrent().add(
            function_decl.children[0].value, 
            function_decl.line, false);

          if (! entry)
          {
            entry = playground.c.lib.Symtab.getCurrent().get(
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
          symtab = new playground.c.lib.Symtab(
            playground.c.lib.Symtab.getCurrent(), 
            function_decl.children[0].value,
            function_decl.line);

          // Is this the main() function?
          if (function_decl.children[0].value == "main" && 
              symtab.getParent() &&
              ! symtab.getParent().getParent())
          {
            //
            // We found the program entry point!!!
            // 
            playground.c.lib.Node.entryNode = this;
          }

          // Save the symbol table for when we're executing
          this._symtab = symtab;

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

        // Pop this function's symbol table from the stack
        playground.c.lib.Symtab.popStack();

        break;

      case "goto" :
        throw new Error("goto");
        break;

      case "greater-equal" :
        /*
         * greater-equal :
         *   0 : relational_expression
         *   1 : shift_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value >= value2.value,
              type : "int"
            });
        }
        break;

      case "greater-than" :
        /*
         * greater-than :
         *   0 : relational_expression
         *   1 : shift_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value > value2.value,
              type : "int"
            });
        }
        break;

      case "identifier" :
        if (! bExecuting)
        {
          break;
        }
        
        entry = playground.c.lib.Symtab.getCurrent().get(this.value, false);
        if (! entry)
        {
          throw new Error("Programmer error: entry should exist");
        }
        return entry;

      case "identifier_list" :
        /*
         * identifier_list
         *   0: identifier
         *   ...
         */
        this.__processSubnodes(data, bExecuting);
        break;

      case "if" :
        /*
         * if
         *   0: expression
         *   1: statement (if)
         *   2: statement (else)
         */
        
        // If we're not executing...
        if (! bExecuting)
        {
          // ... then just process each of the subnodes
          this.__processSubnodes(data, bExecuting);
          break;
        }
        
        // We're executing. Get the value of the expression
        value1 = 
          this.getExpressionValue(this.children[0].process(data, bExecuting));
        
        // If the retrieved value is non-zero...
        if (value1.value)
        {
          // ... then process child 1
          this.children[1].process(data, bExecuting);
        }
        else
        {
          // otherwise process child 2 (if it exists)
          if (this.children.length > 2)
          {
            this.children[2].process(data, bExecuting);
          }
        }

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
        /*
         * left-shift :
         *   0 : shift_expression
         *   1 : additive_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value << value2.value,
              type : "int"
            });
        }
        break;

      case "left-shift-assign" :
        throw new Error("left-shift-assign");
        break;

      case "less-equal" :
        /*
         * less-equal :
         *   0 : relational_expression
         *   1 : shift_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value <= value2.value,
              type : "int"
            });
        }
        break;

      case "less-than" :
        /*
         * less-than :
         *   0 : relational_expression
         *   1 : shift_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value < value2.value,
              type : "int"
            });
        }
        break;

      case "long" :
        throw new Error("long");
        break;

      case "mod" :
        /*
         * mod :
         *   0 : multiplicative_expression
         *   1 : cast_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value % value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "mod-assign" :
        throw new Error("mod-assign");
        break;

      case "multiply" :
        /*
         * multiply :
         *   0 : multiplicative_expression
         *   1 : cast_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value * value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
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
            entry = playground.c.lib.Symtab.getCurrent().get(identifier, true);
            if (! entry)
            {
              throw new Error("Programmer error: entry should exist");
            }
          }
          else
          {
            // It shouldn't exist. Create a symbol table entry for this
            // variable
            entry = playground.c.lib.Symtab.getCurrent().add(
              identifier, declarator.line, false);

            if (! entry)
            {
              entry = 
                playground.c.lib.Symtab.getCurrent().get(identifier, true);
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
        /*
         * right-shift :
         *   0 : shift_expression
         *   1 : additive_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value >> value2.value,
              type : "int"
            });
        }
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
        // Have we already allocated space for this string?
        if (! this._mem)
        {
          var             chars = [];

          // Nope. Allocate the space now
          this._mem =
            playground.c.lib.Symtab.allocGlobalSpace(this.value.length);
          
          // Write the string, as character codes, into the allocated memory
          this.value.split("").forEach(
            function(ch, i)
            {
              playground.c.lib.Node.__mem.set(this._mem + i, 
                                              "char",
                                              this.value.charCodeAt(i));
            },
            this);

          // Null terminate the string
          playground.c.lib.Node.__mem.set(this._mem + this.value.length, 
                                          "char",
                                          0);
        }
        
        // Return the pointer to the string in global memory
        return (
          {
            value : this._mem, 
            type  : playground.c.lib.Node.NumberType.Address
          });

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
          identifier = "struct#" + playground.c.lib.Symtab.getUniqueId();
        }

        // Retrieve the symbol table entry for this struct (a type)
        entry = playground.c.lib.Symtab.getCurrent().get(identifier, false);

        // Create a special symbol table for this struct's members
        symtabStruct = entry.getStructSymtab();
        if (! symtabStruct)
        {
          symtabStruct = 
            new playground.c.lib.Symtab(null, identifier, this.line);
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
        /*
         * subtract :
         *   0 : additive_expression
         *   1 : multiplicative_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting));
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting));
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value - value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
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
        
        // Reset the entry point. It's not yet known.
        playground.c.lib.Node.entryNode = null;
        
        // Process all subnodes
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
        console.log("Unexpected node type: " + this.type);
        break;
      }
      
      return null;
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
     * Given two original operand types, determine the type to which to coerce
     * both operands.
     *
     * FIXME: This uses an old method of coersion. Newer compilers use the
     * "value" method of integer promotions. See, for example, page 48 of
     * http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1256.pdf
     *
     * @param type1 {String}
     *   One of the C types (or "pointer")
     *
     * @param type2 {String}
     *   One of the C types (or "pointer")
     *
     * @return {String}
     *   The C type to which to coerce the operands of an operation between
     *   operands originally of type1 and type2.
     */
    __coerce : function(type1, type2)
    {
      // First, test for the common and easy case: both types are already the
      // same.
      if (type1 == type2)
      {
        return type1;
      }

      // If one of the operands is double, then coerce to double
      if (type1 == "double" || type2 == "double")
      {
        return "double";
      }

      // If one of the operands is float, then coerce to float
      if (type1 == "float" || type2 == "float")
      {
        return "float";
      }

      // If one of the operands is unsigned long long, then coerce to
      // unsigned long long.

      if (type1 == "unsigned long long" || type2 == "unsigned long long")
      {
        return "unsigned long long";
      }

      // If one of the operands is unsigned long, then coerce to unsigned long.
      if (type1 == "unsigned long" || type2 == "unsigned long")
      {
        return "unsigned long";
      }

      // If one of the operands is long, then coerce to long.
      if (type1 == "long" || type2 == "long")
      {
        return "long";
      }

      // If one of the operands is unsigned int, then coerce to unsigned int.
      if (type1 == "unsigned int" || type2 == "unsigned int")
      {
        return "unsigned int";
      }

      // In any other case, coerce to int.
      return "int";
    }
  },
  
  defer : function(statics)
  {
    playground.c.lib.Node.__mem = playground.c.machine.Memory.getInstance();
  }
});
