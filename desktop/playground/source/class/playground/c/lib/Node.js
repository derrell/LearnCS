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
 * @lint ignoreUndefined(require)
 */
if (typeof qx === 'undefined')
{
  var qx = require("qooxdoo");
  var printf = require("printf");
  require("./Symtab");
  require("./NodeArray");
  require("./Return");
  require("./Break");
  require("./Continue");
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
     *
     * @param bFatal {Boolean?}
     *   Whether the message is fatal and should stop execution of the
     *   program.
     */
    error : function(message, bFatal)
    {
      message = "Error: line " + this.line + ": " + message;
      ++playground.c.lib.Node.__error.errorCount;

      if (bFatal)
      {
        throw new playground.c.lib.RuntimeError(this, message);
      }
      else
      {
        console.log(message);
      }
    },

    getExpressionValue : function(value, data)
    {
        // If it was a symbol table entry...
        if (value instanceof playground.c.lib.SymtabEntry)
        {
          // ... then retrieve the symbol's address, unless we're in 'case'
          // mode (cases must be constant expressions)
          if (data.bCaseMode)
          {
            this.error("Each 'case' statement must represent a constant " +
                       "expression. It may not rely on any variables' values.",
                       true);
            value = null;
          }
          else
          {
            value = { value : value.getAddr(), type : value.getType() };
            value.value = 
              playground.c.lib.Node.__mem.get(value.value, value.type); 
          }
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
      }

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
            console.log(parts.join("") + subnode);
            parts = [];
          }
        },
        this);
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
      var             sp;
      var             origSp;
      var             intSize;
      var             subnode;
      var             entry;
      var             bExists;
      var             identifier;
      var             symtab;
      var             symtab2;
      var             symtabStruct;
      var             declarator;
      var             function_decl;
      var             pointer;
      var             cases;
      var             caseAndBreak;
      var             value;
      var             value1; // typically the lhs of a binary expression
      var             value2; // typically the rhs of a binary expression
      var             value3; // typically the return result
      var             assignData;
      var             process = playground.c.lib.Node.process;
      var             model;
      var             memData;
      var             mem;
      var             WORDSIZE = playground.c.machine.Memory.WORDSIZE;

      if (bExecuting)
      {
        //
        // TODO: only update the model when the program stops at a breakpoint,
        // or upon program exit. This makes execution REALLY slow at present.
        //
        
        // Retrieve the data in memory
        memData = playground.c.machine.Memory.getInstance().getDataModel();
        
        // Convert it to a qx.data.Array
        model = qx.data.marshal.Json.createModel(memData);
        
        // Use that model to render the memory template
        try
        {
          qx.core.Init.getApplication().memTemplate.setModel(model);
        }
        catch(e)
        {
          // There's no memTemplate class when running outside of the GUI.
          // In fact, there's no Application object to get, in that case.
        }
      }

      // Yup. See what type it is.
      switch(this.type)
      {
      case "abstract_declarator" :
        throw new Error("Not yet implemented: abstract_declarator");
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value + value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "add-assign" :
        /*
         * add-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal + newVal;
                                   });

      case "address_of" :
        throw new Error("Not yet implemented: address_of");
        break;

      case "and" :
        /*
         * and :
         *   0 : logical_and_expression
         *   1 : inclusive_or_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value && value2.value ? 1 : 0,
              type : this.__coerce(value1.type, value2.type)
            });
        }
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
              this.children[i].process(data, bExecuting),
              data);

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
        /*
         * array_decl
         *   0: constant_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the constant expression
          return(
            this.getExpressionValue(this.children[0].process(data,
                                                             bExecuting),
                                    data));
        }
        break;

      case "array_expression" :
        /*
         * array_expression
         *   0: primary_expression
         *   1: expression (index)
         */
        throw new Error("Not yet implemented: array_expression");
        break;

      case "assign" :
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

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return newVal;
                                   });

      case "auto" :
        // ignored
        break;

      case "bit-and" :
        /*
         * bit-and :
         *   0 : and_expression
         *   1 : equality_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value & value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "bit-and-assign" :
        /*
         * bit-and-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal & newVal;
                                   });

      case "bit_invert" :
        /*
         * bit_invert :
         *   0 : unary_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the unary expression
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          
          // Complete the operation
          return (
            { 
              value : ~ value1.value,
              type : value1.type
            });
        }
        break;

      case "bit-or" :
        /*
         * bit-or :
         *   0 : inclusive_or_expression
         *   1 : exclusive_or_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value | value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "bit-or-assign" :
        /*
         * bit-or-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal | newVal;
                                   });

      case "break" :
        /*
         * break
         *   (no children)
         */
        if (bExecuting)
        {
          // Throw a Break error, which will be caught by loops and the switch
          // statement.
          throw new playground.c.lib.Break(this);
        }
        break;

      case "case" :
        /*
         * case
         *   0 : primary_expression
         *   1 :statement
         */

        // We only process case expressions while executing. (This has the
        // disadvantage that discovering non-constant cases is a run-time
        // error and only occurs if that code branch is executed. It should
        // hopefully be adequate for our purposes, as the alternative is much
        // more difficult to implement.) We must, however, process any
        // compound statements herein, so process the case's statement if not
        // executing.
        if (! bExecuting)
        {
          this.children[1].process(data, bExecuting);
          break;
        }
        
        // We wouldn't have gotten here if this case statement were within a
        // switch. Getting here means that we found a case statement which is
        // not immediately within a switch statement.
        this.error("Found a 'case' not immediately within a 'switch'");
        break;

      case "cast_expression" :
        throw new Error("Not yet implemented: cast_expression");
        break;

      case "char" :
        throw new Error("Not yet implemented: char");
        break;

      case "compound_statement" :
        /*
         * compound_statement
         *   0: declaration_list
         *   1: statement_list
         */

        // Determine whether we're executing or generating symbol tables
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
/*
          playground.c.machine.Memory.getInstance().getDataModel().forEach(
            function(value)
            {
              var             model;

              if (! value.type)
              {
                return;
              }

              console.log(
                value.addr.toString(16) +
                " : " +
                value.bytes.map(
                  function(thisByte)
                  {
                    return ("00" + thisByte.toString(16)).substr(-2);
                  }).join(" ") +
                " : name=" + (value.name || "") +
                " | type=" + (value.type || "") +
                " | size=" + (value.size || "") +
                " | values=" + (JSON.stringify(value.values) || "") +
                " | ptr=" + (value.pointer || "") +
                " | arr=" + (JSON.stringify(value.array) || "") +
                " | param=" + (value.param || "false"));
            });

          console.log(
            JSON.stringify(
              playground.c.machine.Memory.getInstance().getDataModel()));
*/
          
          // Restore the previous frame pointer
          symtab.restoreFramePointer();
        }

        // Revert to the prior scope
        playground.c.lib.Symtab.popStack();
        break;

      case "const" :
        throw new Error("Not yet implemented: const");
        break;

      case "constant" :
        // Ensure we have a valid C value. JavaScript is arbitrary precision.
        playground.c.lib.Node.__mem.setReg("R1", this.numberType, this.value);
        this.value = playground.c.lib.Node.__mem.getReg("R1", this.numberType);
        return { value : this.value, type : this.numberType };

      case "continue" :
        /*
         * continue
         *   (no children)
         */
        if (bExecuting)
        {
          // Throw a Continue error, which will be caught by loops.
          throw new playground.c.lib.Continue(this);
        }
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

              // Add the array sizes
              declarator.children[0].children.forEach(
                function(arrayDecl)
                {
                  var             size;
                  
                  if (! arrayDecl)
                  {
                    return;
                  }

                  // If there are no children, it was an empty set of brackets
                  if (! arrayDecl.children[0])
                  {
                    entry.addArraySize(-1);
                  }
                  else
                  {
                    // It should just be a constant, but process to be sure.
                    size = 
                      arrayDecl.children[0].process( { entry : entry }, 
                                                     bExecuting);
                    entry.addArraySize(size === null ? null : size.value);
                  }
                });

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

            case "type_name_token" :
              // Add this declared type
              if (data.entry)
              {
                data.entry.setType(subnode.value);
              }
              break;

            case "enum_specifier" :
              throw new Error("Not yet implemented: " +
                              "declaration_specifiers -> enum_specifier");
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
        throw new Error("Not yet implemented: declarator");
        break;

      case "default" :
        /*
         * default
         *   0 :statement
         */

        // We only process default expressions while executing. We must,
        // however, process any compound statements herein, so process the
        // default statement if not executing.
        if (! bExecuting)
        {
          this.children[0].process(data, bExecuting);
          break;
        }
        
        // We wouldn't have gotten here if this case statement were within a
        // switch. Getting here means that we found a case statement which is
        // not immediately within a switch statement.
        this.error("Found a 'default' not immediately within a 'switch'");
        break;

      case "dereference" :
        throw new Error("Not yet implemented: dereference");
        break;

      case "direct_abstract_declarator" :
        throw new Error("Not yet implemented: direct_abstract_declarator");
        break;

      case "direct_declarator" :
        throw new Error("Not yet implemented: direct_declarator");
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value / value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "divide-assign" :
        /*
         * divide-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal / newVal;
                                   });

      case "double" :
        throw new Error("Not yet implemented: double");
        break;

      case "do-while" :
        /*
         * do-while
         *   0 : statement block
         *   1 : expression
         */
        if (! bExecuting)
        {
          // Ensure all symbols are defined for this statement block
          this.children[0].process(data, bExecuting);
          break;
        }
        
        // We're executing. Process the loop.
        try
        {
          // Save current symbol table so we know where to pop to upon return
          symtab = playground.c.lib.Symtab.getCurrent();

          do
          {
            // statement block
            try
            {
              // Save current symbol table so we know where to pop to upon
              // continue
              symtab2 = playground.c.lib.Symtab.getCurrent();

              // Process the statement block
              this.children[0].process(data, bExecuting);
            }
            catch(e)
            {
              // was a continue statement executed?
              if (e instanceof playground.c.lib.Continue)
              {
                // Yup. Restore symbol table to where it was when we entered
                // the statement from which we are continuing
                while (playground.c.lib.Symtab.getCurrent() != symtab2)
                {
                  playground.c.lib.Symtab.popStack();
                }
              }
              else
              {
                // It's not a continue. Re-throw the error
                throw e;
              }
            }
          } while (this.getExpressionValue(
                     this.children[1].process(data, bExecuting),
                     data).value);
        }
        catch(e)
        {
          // was a break statement executed?
          if (e instanceof playground.c.lib.Break)
          {
            // Yup. Retore symbol table to where it was when we entered the
            // statement from which we are breaking
            while (playground.c.lib.Symtab.getCurrent() != symtab)
            {
              playground.c.lib.Symtab.popStack();
            }
          }
          else
          {
            // It's not a break. Re-throw the error
            throw e;
          }
        }
        break;

      case "ellipsis" :
        throw new Error("Not yet implemented: ellipsis");
        break;

      case "enumerator_list" :
        throw new Error("Not yet implemented: enumerator_list");
        break;

      case "enum_specifier" :
        throw new Error("Not yet implemented: enum_specifier");
        break;

      case "equal" :
        /*
         * equal :
         *   0 : equality_expression
         *   1 : relational_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value === value2.value ? 1 : 0,
              type : "int"
            });
        }
        break;

      case "exclusive-or" :
        /*
         * exclusive-or :
         *   0 : exclusive_or_expression
         *   1 : and_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value ^ value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "expression" :
        throw new Error("Not yet implemented: expression");
        break;

      case "extern" :
        throw new Error("Not yet implemented: extern");
        break;

      case "float" :
        throw new Error("Not yet implemented: float");
        break;

      case "for" :
        /*
         * for
         *   0 : expression_statement (initialization)
         *   1 : expression_statement (while condition)
         *   2 : statement (statement block)
         *   3 : expression (after each iteration)
         */
        if (! bExecuting)
        {
          // Ensure all symbols are defined for these blocks
          if (this.children[0])
          {
            // initialization
            this.children[0].process(data, bExecuting);
          }
          
          // statement block
          this.children[2].process(data, bExecuting);
              
          // after each iteration
          if (this.children[3])
          {
            this.children[3].process(data, bExecuting);
          }
          break;
        }
        
        // We're executing. Process the loop.
        try
        {
          // Save current symbol table so we know where to pop to upon return
          symtab = playground.c.lib.Symtab.getCurrent();

          // We're executing. Process the loop.
          if (this.children[0])
          {
            // initialization
            this.children[0].process(data, bExecuting);
          }

          while (this.children[1] 
                 ? this.getExpressionValue(
                     this.children[1].process(data, bExecuting),
                      data).value
                 : 1)
          {
            try
            {
              // Save current symbol table so we know where to pop to upon
              // continue
              symtab2 = playground.c.lib.Symtab.getCurrent();

              // Process the statement block
              this.children[2].process(data, bExecuting);
            }
            catch(e)
            {
              // was a continue statement executed?
              if (e instanceof playground.c.lib.Continue)
              {
                // Yup. Restore symbol table to where it was when we entered
                // the statement from which we are continuing
                while (playground.c.lib.Symtab.getCurrent() != symtab2)
                {
                  playground.c.lib.Symtab.popStack();
                }
              }
              else
              {
                // It's not a continue. Re-throw the error
                throw e;
              }
            }

            // after each iteration
            if (this.children[3])
            {
              this.children[3].process(data, bExecuting);
            }
          }
        }
        catch(e)
        {
          // was a break statement executed?
          if (e instanceof playground.c.lib.Break)
          {
            // Yup. Retore symbol table to where it was when we entered the
            // statement from which we are breaking
            while (playground.c.lib.Symtab.getCurrent() != symtab)
            {
              playground.c.lib.Symtab.popStack();
            }
          }
          else
          {
            // It's not a break. Re-throw the error
            throw e;
          }
        }
        break;

      case "function_call" :
        /*
         * function_call
         *   0: primary_expression (function to be called)
         *   1: argument_expression_list?
         */
        if (! bExecuting)
        {
          break;
        }
        
        // Get a quick reference to memory
        mem = playground.c.lib.Node.__mem;

        // Save the stack pointer, so we can restore it after the function call
        origSp = mem.getReg("SP", "unsigned int");
        
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
        if (this.children[1])
        {
          this.children[1].process(data, bExecuting);
        }

        // Is this a built-in function, or a user-generated one?
        if (value1.getType().match("built-in"))
        {
          // Save the return value in value3
          value3 = value2.apply(null, data.args);
        }
        else
        {
          // Save the new frame pointer
          value2._symtab.setFramePointer(mem.getReg("SP", "unsigned int"));

          // Push the return address (our current line number) onto the stack
          sp = mem.stackPush("unsigned int", this.line);
          
          // Add "symbol info" to show that this was a return address
          intSize = playground.c.machine.Memory.typeSize["int"];
          mem.setSymbolInfo(
            sp,
            {
              getName         : function() { return "called from line #"; },
              getType         : function() { return "int"; },
              getSize         : function() { return intSize; },
              getPointerCount : function() { return 0; },
              getArraySizes   : function() { return []; },
              getIsParameter  : function() { return false; }
            });
          
          // Process that function. Save its return value in value3
          value3 = value2.process(data, bExecuting);

          // Restore the previous frame pointer
          value2._symtab.restoreFramePointer();
        }
        
        // Remove our argument array
        delete data.args;

        // Restore the stack pointer
        mem.setReg("SP", "unsigned int", origSp);
        return value3;

      case "function_decl" :
        // handled by function_definition
        throw new Error("Not yet implemented: function_decl");
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
            function_decl.line, 
            false);

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
            throw new Error("Not yet implemented: enum_specifier");
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
              entry.setType(subnode.type == "type_name_token"
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
        try
        {
          // Save current symbol table so we know where to pop to upon return
          symtab = playground.c.lib.Symtab.getCurrent();

          this.children[3].process(data, bExecuting);
          
          // A return statement in the function will cause the catch() block
          // to be executed. If one doesn't exist, create an arbitrary return
          // value.
          value3 =
            {
              value : Math.floor(Math.random() * 256),
              type : "unsigned char"
            };
        }
        catch(e)
        {
          // Did we get back a return value?
          if (e instanceof playground.c.lib.Return)
          {
            // Yup. It contains the return value
            value3 = e.returnCode;
            console.log("TODO: cast value3 to this function's return type");
            
            // Retore symbol table to where it was when we called the function
            while (playground.c.lib.Symtab.getCurrent() != symtab)
            {
              playground.c.lib.Symtab.popStack();
            }
          }
          else
          {
            // It's not a return code. Re-throw the error
            throw e;
          }
        }

        // Pop this function's symbol table from the stack
        playground.c.lib.Symtab.popStack();
        
        if (bExecuting)
        {
          return value3;
        }
        else
        {
          break;
        }

      case "goto" :
        throw new Error("Not yet implemented: goto");
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value >= value2.value ? 1 : 0,
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value > value2.value ? 1 : 0,
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
          throw new playground.c.lib.RuntimeError(
            this,
            "Undeclared variable: " + this.value);
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
          this.getExpressionValue(this.children[0].process(data, bExecuting),
                                  data);
        
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
        throw new Error("Not yet implemented: initializer");
        break;

      case "initializer_list" :
        throw new Error("Not yet implemented: initializer_list");
        break;

      case "int" :
        throw new Error("Not yet implemented: int");
        break;

      case "label" :
        throw new Error("Not yet implemented: label");
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value << value2.value,
              type : "int"
            });
        }
        break;

      case "left-shift-assign" :
        /*
         * left-shift-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal << newVal;
                                   });

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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value <= value2.value ? 1 : 0,
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value < value2.value ? 1 : 0,
              type : "int"
            });
        }
        break;

      case "long" :
        throw new Error("Not yet implemented: long");
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value % value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "mod-assign" :
        /*
         * mod-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal % newVal;
                                   });

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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value * value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "multiply-assign" :
        /*
         * multiply-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal * newVal;
                                   });

      case "negative" :
        /*
         * negative :
         *   0 : unary_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the unary expression
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          
          // Complete the operation
          return (
            { 
              value : - value1.value,
              type : value1.type
            });
        }
        break;

      case "not" :
        /*
         * not :
         *   0 : unary_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the unary expression
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          
          // Complete the operation
          return (
            { 
              value : ! value1.value,
              type : "int"
            });
        }
        break;

      case "not-equal" :
        /*
         * not-equal :
         *   0 : equality_expression
         *   1 : relational_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value !== value2.value ? 1 : 0,
              type : "int"
            });
        }
        break;

      case "or" :
        /*
         * or :
         *   0 : logical_or_expression
         *   1 : logical_and_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the left and right expressions
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value || value2.value ? 1 : 0,
              type : this.__coerce(value1.type, value2.type)
            });
        }
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
              identifier, declarator.line, false, true);

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

            // Add the array sizes
            declarator.children[0].children.forEach(
              function(arrayDecl)
              {
                var             size;

                if (! arrayDecl)
                {
                  return;
                }

                // If there are no children, it was an empty set of brackets
                if (! arrayDecl.children[0])
                {
                  entry.addArraySize(-1);
                }
                else
                {
                  // It should just be a constant, but process to be sure.
                  size = 
                    arrayDecl.children[0].process( { entry : entry },
                                                   bExecuting);
                  entry.addArraySize(size === null ? null : size.value);
                }
              });
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
        throw new Error("Not yet implemented: pointer");
        break;

      case "pointer_access" :
        throw new Error("Not yet implemented: pointer_access");
        break;

      case "positive" :
        /*
         * positive :
         *   0 : unary_expression
         */
        if (bExecuting)
        {
          // We're executing. Get the value of the unary expression
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          
          // Complete the operation. This is a no-op.
          return value1;
        }
        break;

      case "post_decrement_op" :
        /*
         * post_decrement_op
         *   0: unary_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal - 1;
                                   },
                                   true,
                                   true);

      case "primary_expression" :
        /*
         * primary_expression
         *   0: primary_expression |
         *      array_expression | 
         *      structure_reference |
         *      pointer_access
         *   ...
         */
        return this.children[0].process(data, bExecuting);

      case "post_increment_op" :
        /*
         * post_increment_op
         *   0: unary_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal + 1;
                                   },
                                   true,
                                   true);

      case "pre_decrement_op" :
        /*
         * pre_decrement_op
         *   0: unary_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal - 1;
                                   },
                                   true,
                                   false);
        break;

      case "pre_increment_op" :
        /*
         * pre_increment_op
         *   0: unary_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal + 1;
                                   },
                                   true,
                                   false);

      case "register" :
        throw new Error("Not yet implemented: register");
        break;

      case "return" :
        /*
         * return :
         *   0 : expression
         */
        if (! bExecuting)
        {
          break;
        }

        // If there's an expression to return...
        if (this.children[0])
        {
          // ... then retrieve its value.
          value3 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
        }
        else
        {
          // No return value was provided. Choose one at random.
          value3 =
            {
              value : Math.floor(Math.random() * 256),
              type : "unsigned char"
            };
        }
        
        // Return via throwing an error, to unwrap intervening call frames.
        throw new playground.c.lib.Return(value3);
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value >> value2.value,
              type : "int"
            });
        }
        break;

      case "right-shift-assign" :
        /*
         * right-shift-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal >> newVal;
                                   });

      case "short" :
        throw new Error("Not yet implemented: short");
        break;

      case "signed" :
        throw new Error("Not yet implemented: signed");
        break;

      case "sizeof" :
        throw new Error("Not yet implemented: sizeof");
        break;

      case "specifier_qualifier_list" :
        throw new Error("Not yet implemented: specifier_qualifier_list");
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
        throw new Error("Not yet implemented: static");
        break;

      case "string_literal" :
        // Have we already allocated space for this string?
        if (! this._mem)
        {
          var             chars = [];

          // Nope. Allocate the space now
          this._mem =
            playground.c.lib.Symtab.allocGlobalSpace(this.value.length + 1,
                                                     "string",
                                                     this.line);
          
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
              entry.setType(subnode.type == "type_name_token"
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
        throw new Error("Not yet implemented: struct_declarator");
        break;

      case "struct_declarator_list" :
        throw new Error("Not yet implemented: struct_declarator_list");
        break;

      case "structure_reference" :
        throw new Error("Not yet implemented: structure_reference");
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
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          value2 = 
            this.getExpressionValue(this.children[1].process(data, bExecuting),
                                    data);
          
          // Complete the operation, coercing to the appropriate type
          return (
            { 
              value : value1.value - value2.value,
              type : this.__coerce(value1.type, value2.type)
            });
        }
        break;

      case "subtract-assign" :
        /*
         * subtract-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal - newVal;
                                   });

      case "switch" :
        /*
         * switch
         *   0 : expression
         *   1 : statement (compound_statement)
         *     0 : declarations
         *     1 : statement_list
         */
        if (! bExecuting)
        {
          if (this.children[1].children[1].type != "statement_list")
          {
            throw new Error("Programmer error: expected statement list");
          }
          
          // Process the compound statement.
          this.children[1].process(data, bExecuting);
          break;
        }

        // We're executing. Evaluate the expression, and find the correct case.
        try
        {
          // Save current symbol table so we know where to pop to upon return
          symtab = playground.c.lib.Symtab.getCurrent();

          // Evaluate the expression on which we will switch
          value1 = 
            this.getExpressionValue(this.children[0].process(data, bExecuting),
                                    data);
          
          // Get a reference to the statement list
          subnode = this.children[1].children[1];

          // If we haven't evaluated case expressions yet...
          if (! subnode.cases)
          {
            // ... then create a map of case expression values
            subnode.cases = {};
            subnode.caseAndBreak = [];

            // Run through each case and evaluate it.
            subnode.children.forEach(
              function(child)
              {
                var             map;
                var             value;

                // Is this a case label?
                if (child.type == "case")
                {
                  // Yup. Throw an error if the case expression is not constant
                  data.bCaseMode = true;

                  // Get its expression value. It (child 0) becomes the key
                  // in the cases map, and child 1, the statement, becomes the
                  // value of that key in the cases map.
                  value =
                    this.getExpressionValue(
                      child.children[0].process(data, bExecuting),
                      data).value;
                  
                  // Does this value already exist in the cases map
                  if (subnode.cases[value])
                  {
                    // Yup. This is an error.
                    this.error("Found multiple case labels for '" +
                               value + "' in 'switch'",
                               true);
                    return;     // not reached
                  }
                  
                  // This is a new case value. Save its statement.
                  map =
                    {
                      order : subnode.caseAndBreak.length,
                      node  : child.children[1]
                    };
                  subnode.cases[value] = map;
                  subnode.caseAndBreak.push(map);
                  
                  // Stop testing for constant expressions
                  delete data.bCaseMode;
                }
                else if (child.type == "default")
                {
                  // Did we already find a default?
                  if (subnode.cases["default"])
                  {
                    // Yup. This is an error.
                    this.error("Found multiple 'default' labels in 'switch'",
                               true);
                    return;     // not reached
                  }
                  
                  // Add this default's node to the cases map
                  map =
                    {
                      order : subnode.caseAndBreak.length,
                      node  : child.children[0]
                    };
                  subnode.cases["default"] = map;
                  subnode.caseAndBreak.push(map);
                }
                else if (child.type == "break")
                {
                  // Do not add break to the cases map, but do add it to the
                  // caseAndBreak array.
                  map =
                    {
                      order : subnode.caseAndBreak.length,
                      node  : child
                    };
                  subnode.caseAndBreak.push(map);
                }
              },
              this);
          }
          
          // Get map of nodes for each case
          cases = subnode.cases;
          caseAndBreak = subnode.caseAndBreak;
          subnode = cases[value1.value] || cases["default"];
          
          // Did we find a case to execute?
          if (typeof subnode != "undefined")
          {
            // Yup. Process it and all following nodes (until a break is hit)
            for (i = subnode.order; i < caseAndBreak.length; i++)
            {
              if (caseAndBreak[i].node)
              {
                caseAndBreak[i].node.process(data, bExecuting);
              }
            }
          }
          else
          {
            console.log("Ignoring switch value " + value1.value);
          }
        }
        catch(e)
        {
          // was a break statement executed?
          if (e instanceof playground.c.lib.Break)
          {
            // Yup. Retore symbol table to where it was when we entered the
            // statement from which we are breaking
            while (playground.c.lib.Symtab.getCurrent() != symtab)
            {
              playground.c.lib.Symtab.popStack();
            }
          }
          else
          {
            // It's not a break. Re-throw the error
            throw e;
          }
        }
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
        /*
         * trinary
         *   0 : logical_or_expression
         *   1 : expression
         *   2 : conditional_expression
         */
        if (! bExecuting)
        {
          break;
        }

        // Retrieve and evaluate the logical expression from child 0
        value1 = 
          this.getExpressionValue(this.children[0].process(data, bExecuting),
                                  data);
        
        // If it's true, return the value of child 1
        if (value1.value)
        {
          return this.getExpressionValue(
            this.children[1].process(data, bExecuting),
            data);
        }

        // Otherwise return the value of child 2.
        return this.getExpressionValue(
          this.children[2].process(data, bExecuting),
          data);
        
        break;

      case "type" :
        throw new Error("Not yet implemented: type");
        break;

      case "typedef" :
        throw new Error("Not yet implemented: typedef");
        break;

      case "type_definition" :
        throw new Error("Not yet implemented: type_definition");
        break;

      case "type_name" :
        throw new Error("Not yet implemented: type_name");
        break;

      case "type_qualifier_list" :
        throw new Error("Not yet implemented: type_qualifier_list");
        break;

      case "union" :
        throw new Error("Not yet implemented: union");
        break;

      case "unsigned" :
        throw new Error("Not yet implemented: unsigned");
        break;

      case "void" :
        throw new Error("Not yet implemented: void");
        break;

      case "volatile" :
        throw new Error("Not yet implemented: volatile");
        break;

      case "xor-assign" :
        /*
         * xor-assign
         *   0: unary_expression (lhs)
         *   1: assignment_expression (rhs)
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          break;
        }

        // Assign the new value
        return this.__assignHelper(data, 
                                   function(oldVal, newVal)
                                   {
                                     return oldVal ^ newVal;
                                   });

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
     * Helper funciton for assignments.
     *
     * @param data {Map}
     *   The data map currently in use for recursive calls to process()
     *
     * @param fOp {Function}
     *   Function to produce the result for assignment. It takes two
     *   arguments: the old (original) value of the lhs, and the new value.
     *
     * @param bUnary {Boolean}
     *   true if this is a unary operator (pre/post-increment/decrement)
     *   false otherwise
     *
     * @param bPostOp {Boolean}
     *   true if this is a post-increment or post-decrement operation;
     *   false otherwise
     *
     * @return {Map}
     *   Upon success, a map containing the resulting value and its type is
     *   returned. Upon failure (lhs is not an lvalue), null is returned.
     */
    __assignHelper : function(data, fOp, bUnary, bPostOp)
    {
      var             value;
      var             value1;
      var             value3;

      // Retrieve the lvalue
      value1 = this.children[0].process(data, true);

      // If it was a symbol table entry...
      if (value1 instanceof playground.c.lib.SymtabEntry)
      {
        // ... then retrieve the symbol's address
        value1 = { value : value1.getAddr(), type : value1.getType() };
      }
      else if (this.children[0].type != "dereference")
      {
        this.error("The left hand side of an assignment must be " +
                   "a variable or pointer dereference");
        return null;
      }
      
      // Retrieve the current value
      value = playground.c.lib.Node.__mem.get(value1.value, value1.type);

      // Determine the value to assign there. If it's a unary operator
      // (pre/post increment/decrement), then use the retrieved
      // value. Otherwise, get the value from the rhs of the expression.
      value3 =
        bUnary
        ? { value : value, type : value1.type }
        : this.getExpressionValue(this.children[1].process(data, true),
                                  data);

      // Save the value at its new address
      playground.c.lib.Node.__mem.set(
        value1.value,
        value1.type,
        fOp(value, value3.value));

      // If this is not a post-increment or post-decrement...
      if (! bPostOp)
      {
        // ... then retrieve and return the altered value
        value = playground.c.lib.Node.__mem.get(value1.value, value1.type);
      }

      // Retrieve the value and return it
      return (
        {
          value : value,
          type  : value1.type
        });
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
