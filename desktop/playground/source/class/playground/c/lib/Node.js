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
#ignore(qx.bConsole)
 */

/**
 * @lint ignoreUndefined(require)
 * @lint ignoreUndefined(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  require("printf");
  qx = require("qooxdoo");
  qx.bConsole = true;
  require("./Symtab");
  require("./NodeArray");
  require("./Specifier");
  require("./Declarator");
  require("./Return");
  require("./Break");
  require("./Continue");
  require("./NotYetImplemented");
}

/*
 * C NAMESPACES
 * ------------
 * From http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1570.pdf
 *
 * 6.2.3 Name spaces of identifiers
 *
 * If more than one declaration of a particular identifier is visible at
 * any point in a translation unit, the syntactic context disambiguates uses
 * that refer   to different entities.
 *
 * Thus, there are separate name spaces for various categories of identifiers,
 * as follows:
 *
 * — label names (disambiguated by the syntax of the label declaration and use);
 *
 * — the tags of structures, unions, and enumerations (disambiguated by 
 *   following any32) of the keywords struct, union, or enum);
 *
 * — the members of structures or unions; each structure or union has a 
 *   separate name space for its members (disambiguated by the type of the 
 *   expression used to access themember via the . or -> operator);
 *
 * — all other identifiers, called ordinary identifiers (declared in ordinary 
 *   declarators or as enumeration constants).
 */

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
    
    /** Previous line number (to know when a new instruction is executed */
    _prevLine : 0,

    /** Node which calls a built-in function */
    _currentNode : null,

    /** Maximum number of recursive calls before unwind */
    _unwindInit : 0,            // initialized in defer

    /** Number of recursive calls remaining before we must unwind via timeout */
    _unwindCount : 0,           // initialized in defer

    /** Depth of function call, for activation record name */
    _depth : 0,

    /** Namespace (either "struct#" or ""), set by parser */
    namespace : "",

    /** Whether we just saw the keyword 'struct' or 'union' */
    bSawStruct : false,

    /** 0=no typedef in progress; 1=saw 'typedef'; 2=in init_declarator_list */
    typedefMode : 0,

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
    },
    
    getNull : function(line)
    {
      return new playground.c.lib.Node("_null_", null, line);
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

    getExpressionValue : function(value, data, bNoDerefAddress)
    {
      var             type;
      var             specAndDecl;
      var             specOrDecl;
      
      if (typeof value == "undefined")
      {
        throw new Error("Internal error: getExpressionValue of undefined");
      }

      // Retrieve the specifier/declarator list, and its first entry
      specAndDecl =
        value instanceof playground.c.lib.SymtabEntry
        ? value.getSpecAndDecl()
        : value.specAndDecl;
      specOrDecl = specAndDecl[0];

      // If it was a symbol table entry...
      if (value instanceof playground.c.lib.SymtabEntry)
      {
        // ... then retrieve the symbol's address, unless we're in 'case'
        // mode (cases must be constant expressions)
        switch(data.constantOnly)
        {
        case "case" :
          // occurs during executing, so error is fatal
          this.error("Each 'case' statement must represent a constant " +
                     "expression. It may not rely on any variables' values.",
                     true);
          value = null;
          break;

        case "array_decl" :
          // occurs before executing, so error need not be fatal
          this.error("Array sizes must be constants");
          value = null;
          break;

        default:
          // need not be constant
          // It's a symbol table entry. Retrieve the address and
          // specifier/declarator list.
          value =
            {
              value       : value.getAddr(), 
              specAndDecl : value.getSpecAndDecl()
            };

          // Determine the memory type to use for saving the value
          type =
            value.specAndDecl[0] instanceof playground.c.lib.Declarator
            ? "pointer"
            : value.specAndDecl[0].getCType();

          // If we were given an array name, use the already-retrieved address
          // as the value.  Otherwise, replace the symbol's address with the
          // symbol's current value.
          if (! bNoDerefAddress && specOrDecl.getType() != "array")
          {
            value.value = 
              playground.c.lib.Node.__mem.get(value.value, type, true); 
          }
        }
      }
      else if (! bNoDerefAddress && specOrDecl.getType() == "address")
      {
        // Clone the specifier/declarator list and remove the address declarator
        value.specAndDecl = value.specAndDecl.slice(0);
        value.specAndDecl.shift();

        // Determine what type to retrieve, based on the now-first spec/decl
        specOrDecl = value.specAndDecl[0];
        if (specOrDecl.getType() == "pointer")
        {
          type = "pointer";
        }
        else if ([ "address", "array" ].indexOf(specOrDecl.getType()) != -1)
        {
          type = "address";
        }
        else if (specOrDecl instanceof playground.c.lib.Specifier)
        {
          type = specOrDecl.getCType();
        }
        else
        {
          throw new playground.c.lib.RuntimeError(
            this,
            "Righthand side of assignment is not a valid type");
        }

        // Retrieve the value from the address
        if (type != "address")
        {
          value.value =
            playground.c.lib.Node.__mem.get(value.value, type, true);
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
        if (this.type == "_null_")
        {
          console.log(parts.join("") + "null*");
        }
        else
        {
          console.log(parts.join("") + this.type + " (" + this.line + ")");
        }
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
     * 
     * @param bRoot {Boolean}
     *   Whether we are called with the root node
     * 
     * @return {Number}
     *   The minimum line number found in this node and its children
     */
    fixLineNumbers : function(bRoot)
    {
      var             i;
      var             j;
      var             minLine = Number.MAX_VALUE;
      var             line;
      var             editor;
      var             linesInUse;
      var             breakpoints;

      // Is this the root?
      if (bRoot)
      {
        // Yup. Initialize the array of lines in use
        playground.c.lib.Node._linesInUse = [];
      }

      // Get quick reference to the lines-in-use array
      linesInUse = playground.c.lib.Node._linesInUse;

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
              line = subnode.fixLineNumbers(false) || this.line;
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

      // Note that this is a used line number
      if (this.type != "_null_")
      {
        linesInUse[this.line] = true;
      }

      // Is this the root?
      if (bRoot)
      {
        // This block of code will fail if not in the GUI environment
        try
        {
          // Yup. Retrieve the editor
          editor = qx.core.Init.getApplication().getUserData("sourceeditor");

          // Get the list of breakpoints. We'll update any breakpoint that
          // isn't at an in-use line number, to the next in-use one.
          breakpoints = editor.getBreakpoints();

          // Go backwards through the breakpoint list, to avoid excessively
          // revisiting moved breakpoints.
          for (i = breakpoints.length - 1; i >= 0; i--)
          {
            // Is there a breakpoint here, and it it at a line with executable
            // code? (Caution: the editor, including the breakpoint list,
            // contains 0-relative line numbers, but linesInUse is 1-relative.)
            if (breakpoints[i] && ! linesInUse[i + 1])
            {
              // Nope. Remove the breakpoint.
              editor.clearBreakpoint(i);

              // Find the next available line with code at which to add a
              // breakpoint
              for (j = i + 1; j < linesInUse.length; j++)
              {
                if (linesInUse[j])
                {
                  editor.setBreakpoint(j - 1);
                  break;
                }
              }
            }
          }
        }
        catch(e)
        {
          // nothing to do if not in the GUI environment
        }
      }

      // Return the (possibly new) line number of this node
      return this.line;
    },
    
    /**
     * Process, in continuation style, the abstract syntax tree beginning at
     * the specified node.
     *
     * @param data {Map}
     *   Data used for sub-node processing, as required per node type
     *
     * @param bExecuting {Boolean}
     *   false when the code is initially being compiled (symbol tables being
     *   built); true when the code is executing.
     * 
     * @param success {Function}
     *   Function to call upon successful completion of this call
     * 
     * @param failure {Function}
     *   Function to call upon failed completion of this call
     */
    process : function(data, bExecuting, success, failure)
    {
      var             i;
      var             f;
      var             sp;
      var             origSp;
      var             addr;
      var             name;
      var             offset;
      var             intSize;
      var             depth;
      var             subnode;
      var             entry;
      var             identifier;
      var             symtab;
      var             symtab2;
      var             symtabStruct;
      var             declarator;
      var             function_decl;
      var             cases;
      var             caseAndBreak;
      var             type;
      var             specAndDecl;
      var             specOrDecl;
      var             value;
      var             value1; // typically the lhs of a binary expression
      var             value2; // typically the rhs of a binary expression
      var             value3; // typically the return result
      var             bOldIsParameter;
      var             bOldIsInitializer;
      var             bNewEntry;
      var             oldArgs;
      var             oldId;
      var             oldEntry;
      var             oldStructSymtab;
      var             oldSpecifiers;
      var             oldSpecAndDecl;
      var             oldIsUnion;
      var             oldIsDefine;
      var             mem;
      var             memTemplate;
      var             args;
      var             breakpoints;
      var             application;
      var             editor;
      var             stepButton;
      var             continueButton;
      var             WORDSIZE = playground.c.machine.Memory.WORDSIZE;


      // Argument to case_struct_union_enum() to differentiate between cases
      var StructUnionEnum =
        {
          Struct : 0,
          Union  : 1,
          Enum   : 2
        };


      // Make the current node available globally
      playground.c.lib.Node._currentNode = this;

      // Save the arguments to this function
      args = qx.lang.Array.cast(arguments, Array);

      if (playground.c.lib.Node._unwindCount-- === 0)
      {
        // There's no breakpoint. Reset the unwind count.
        playground.c.lib.Node._unwindCount =
          playground.c.lib.Node._unwindInit;

        // Unwind the stack by executing via timeout to continue shortly.
        window.setTimeout(
          function()
          {
            try
            {
              this.process.apply(this, args);
            }
            catch(e)
            {
              failure(e);
            }
          }.bind(this),
          0);
        return;
      }

      if (bExecuting)
      {
        function displayMemoryTemplateView()
        {
          var             model;
          var             oldModel;
          var             memData;

          // Retrieve the old model from the memory template view
          oldModel = memTemplate.getModel();

          // Retrieve the data in memory, ...
          memData = playground.c.machine.Memory.getInstance().getDataModel();

          // ... convert it to a qx.data.Array, ...
          model = qx.data.marshal.Json.createModel(memData);

          // ... and update the memory template view.
          memTemplate.setModel(model);

          // Explicitly dispose the old model
          oldModel && oldModel.dispose();

          // Cancel the timer that will redisplay the memory template view
          window.clearTimeout(playground.c.lib.Node._memoryViewTimer);

          // Start the timer to redisplay the memory template view
          playground.c.lib.Node._memoryViewTimer = window.setTimeout(
            displayMemoryTemplateView,
            2000);
        }

        // Use that model to render the memory template
        memTemplate = qx.core.Init && qx.core.Init.getApplication().memTemplate;

        if (memTemplate)
        {
          // We have stored some "global" variables in user data of the app
          application = qx.core.Init.getApplication();

          // If we haven't yet initiated the periodic event to display the
          // memory template view...
          if (! playground.c.lib.Node._memoryViewTimer)
          {
            // ... then do so now
            playground.c.lib.Node._memoryViewTimer = window.setTimeout(
              displayMemoryTemplateView,
              0);
          }
        }

        // See if the line number has changed
        if (memTemplate && 
            this.type != "_null_" &&
            this.line !== playground.c.lib.Node._prevLine)
        {
          // We have stored some "global" variables in user data of the app
          application = qx.core.Init.getApplication();

          // Retrieve the editor object
          editor = application.getUserData("sourceeditor");
          
          // Remove any decoration on the previous line
          if (playground.c.lib.Node._prevLine >= 0)
          {
            editor.removeGutterDecoration(
              playground.c.lib.Node._prevLine - 1, "current-line");
          }

          // Save the current line to prevent reentry until line number changes
          playground.c.lib.Node._prevLine = this.line;
          
          // Do we need to stop at a breakpoint?
          breakpoints = editor.getBreakpoints();

          stepButton = application.getUserData("stepButton");
          continueButton = application.getUserData("continueButton");
          
          // If there is a Step button listener active...
          if (playground.c.lib.Node._stepListenerId)
          {
            // ... then remove the listener
            stepButton.removeListenerById(
              playground.c.lib.Node._stepListenerId);
            
            // There's no active listener now.
            playground.c.lib.Node._stepListenerId = null;
          }

          // If there is a Continue button listener active...
          if (playground.c.lib.Node._continueListenerId)
          {
            // ... then remove the listener
            continueButton.removeListenerById(
              playground.c.lib.Node._continueListenerId);
            
            // There's no active listener now.
            playground.c.lib.Node._continueListenerId = null;
          }

          // Is there a breakpoint at the current line?
          if (breakpoints[this.line - 1] || playground.c.lib.Node._bStep)
          {
            // Display the memory template view
            displayMemoryTemplateView();

            // Mark the line we're stopped at
            editor.addGutterDecoration(this.line - 1, "current-line");
            
            // Scroll to this line.
            editor.scrollToLine(this.line - 1);

            // Reset unwind count, since we're unwinding by awaiting an event
            playground.c.lib.Node._unwindCount =
              playground.c.lib.Node._unwindInit;

            // Wait for them to press the Step or Continue button
            playground.c.lib.Node._stepListenerId =
              stepButton.addListenerOnce(
                  "execute",
                  function()
                  {
                    var             terminal;

                    try
                    {
                      // Note that they pressed the Step button, to break at
                      // next line.
                      playground.c.lib.Node._bStep = true;

                      // Set the focus on the terminal window
                      terminal = 
                        qx.core.Init.getApplication().getUserData("terminal");
                      terminal.focus();

                      // Process the next node
                      this.process.apply(this, args);
                    }
                    catch(e)
                    {
                      failure(e);
                    }
                  },
                  this);

            playground.c.lib.Node._continueListenerId =
              continueButton.addListenerOnce(
                  "execute",
                  function()
                  {
                    var             terminal;

                    try
                    {
                      // Do not break at the next line (unless there's a
                      // breakpoint at that line)
                      playground.c.lib.Node._bStep = false;

                      // Set the focus on the terminal window
                      terminal = 
                        qx.core.Init.getApplication().getUserData("terminal");
                      terminal.focus();

                      // Process the next nodes (until a breakpoint)
                      this.process.apply(this, args);
                    }
                    catch(e)
                    {
                      failure(e);
                    }
                  },
                this);
            return;
          }
        }
      }

//      console.log("process: " + this.type);

      // Yup. See what type it is.
      switch(this.type)
      {
        // special case: null node
      case "_null_" :
        success();
        break;

      case "abstract_declarator" :
        /*
         * abstract_declarator
         *   0 : pointer?
         *   1 : direct_abstract_declarator
         */
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "add" :
        /*
         * add :
         *   0 : additive_expression
         *   1 : multiplicative_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                var             byteCount;
                var             specAndDecl;

                value2 = this.getExpressionValue(v, data);

                // If the first value is a pointer and the second is a
                // specifier, ...
                if ((value1.specAndDecl[0].getType() == "pointer" ||
                     value1.specAndDecl[0].getType() == "array") &&
                    value2.specAndDecl[0] .getType() == "int")
                {
                  // ... then figure out the size of what's pointed to
                  specAndDecl = value1.specAndDecl.slice(1);
                  byteCount =
                    specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
                  
                  // Add the size of a pointed-to item to the pointer address
                  value1.value += value2.value * byteCount;

                  success(
                    { 
                      value       : value1.value,
                      specAndDecl : value1.specAndDecl.slice(0)
                    });
                  
                  return;
                }

                // If the second value is a pointer and the first is a
                // specifier, ...
                if ((value2.specAndDecl[0].getType() == "pointer" ||
                     value2.specAndDecl[0].getType() == "array") &&
                    value1.specAndDecl[0] .getType() == "int")
                {
                  // ... then figure out the size of what's pointed to
                  specAndDecl = value2.specAndDecl.slice(1);
                  byteCount =
                    specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
                  
                  // Add the size of a pointed-to item to the pointer address
                  value2.value += value1.value * byteCount;

                  success(
                    { 
                      value       : value2.value,
                      specAndDecl : value2.specAndDecl.slice(0)
                    });
                  
                  return;
                }

                // It's not pointer arithmetic. Complete the operation,
                // coercing to the appropriate type
                specAndDecl = this.__coerce(value1.specAndDecl,
                                            value2.specAndDecl,
                                            "add (+)");
                f = specAndDecl[0].getType() == "int" 
                      ? Math.floor 
                      : function (n) { return n; };
                success(
                  { 
                    value       : f(value1.value + value2.value),
                    specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal + newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      case "address_of" :
        /*
         * address_of
         *   0: cast_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the cast_expression
        this.children[0].process(
          data,
          bExecuting,
          function(value)
          {
            var             addr;

            // If we found a symbol...
            if (value instanceof playground.c.lib.SymtabEntry)
            {
              // ... then retrieve its address
              addr = value.getAddr();

              // Retrieve a copy of the specifier/declarator list for this
              // symbol
              specAndDecl = value.getSpecAndDecl().slice(0);
            }
            else
            {
              // It's not a symbol, so must already be an address
              addr = value.value;
              specAndDecl = value.specAndDecl;
            }

            // Prepend two "address" declarator" to preclude immediate
            // dereferencing. (If the first declarator is already "address",
            // then only prepend one instead of two.)
            if (specAndDecl[0].getType() != "address")
            {
              specAndDecl.unshift(new playground.c.lib.Declarator(this,
                                                                  "address"));
            }
            specAndDecl.unshift(new playground.c.lib.Declarator(this,
                                                                "address"));

            // Complete the operation
            success(
              { 
                value        : addr,
                specAndDecl  : specAndDecl
              });
          }.bind(this),
          failure);
        break;

      case "and" :
        /*
         * and :
         *   0 : logical_and_expression
         *   1 : inclusive_or_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = new playground.c.lib.Specifier(this, "int");

                success(
                  { 
                    value       : value1.value && value2.value ? 1 : 0,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          this.__processSubnodes(data, bExecuting, success, failure);
        }
        else
        {
          // When we're executing, we need to push the expression values onto
          // the stack in reverse order.
          i = this.children.length - 1;
          
          this.children[i].process(
            data, 
            bExecuting,
            function(v)
            {
              value1 = this.getExpressionValue(v, data);

              // Pull the first specifier/declarator off of the list. We'll
              // replace it with one containing the (possibly unaltered)
              // promoted type.
              specOrDecl = value1.specAndDecl.shift();

              // Is this a declarator?
              if (specOrDecl instanceof playground.c.lib.Declarator)
              {
                // Yup. We're going to push an address
                type = "pointer";
              }
              else
              {
                // It's a specifier. Get a new specifier with a (possibly)
                // increased size appropriate as a promoted argument.
                specOrDecl = specOrDecl.promote();

                // Get the memory access type from this specifier
                type = specOrDecl.getCType();
              }

              // Put the (possibly altered) specifier/declarator back onto the
              // list of specifiers/declarators
              value1.specAndDecl.unshift(specOrDecl);

              // If we were given a JavaScript array in which to place args...
              if (data.args)
              {
                // ... then add this one.
                data.args.unshift(value1.value);
              }
              else
              {
                // otherwise, push the arguments onto the stack
                playground.c.lib.Node.__mem.stackPush(type, value1.value);
              }
              
              if (--i >= 0)
              {
                this.children[i].process(
                  data, bExecuting, arguments.callee.bind(this), failure);
              }
              else
              {
                success();
              }
            }.bind(this),
            failure);
        }
        break;

      case "array_decl" :
        /*
         * array_decl
         *   0: constant_expression
         */
        
        if (bExecuting)
        {
          success();
          break;
        }

        // Create an array declarator entry
        declarator = new playground.c.lib.Declarator(this);

        // Disallow variable access. Array sizes must be constant.
        data.constantOnly = "array_decl";

        // Is an array size specified?
        if (this.children.length > 0 && this.children[0].type != "_null_")
        {
          // Yup. Determine it and add to the declarator
          this.children[0].process(
            data,
            bExecuting,
            function(v)
            {
              value1 = v;
              
              // We got the array size. Add it.
              declarator.setArrayCount(value1.value);

              // Add this array declarator to the specifier/declarator list
              data.specAndDecl.push(declarator);

              // Finished with array size. Re-allow variable access.
              delete data.constantOnly;
              success();
            }.bind(this),
            failure);
        }
        else
        {
          // Otherwise just note that this is an array
          declarator.setType("array");

          // Add this array declarator to the specifier/declarator list
          data.specAndDecl.push(declarator);

          // Finished with array size. Re-allow variable access.
          delete data.constantOnly;
          success();
        }
        break;

      case "array_expression" :
        /*
         * array_expression
         *   0: primary_expression
         *   1: expression (index)
         */
        
        if (! bExecuting)
        {
          success();
          break;
        }

        // Get the base address
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = v;
            
            // Figure out where the specifier/declarator list is, and retrieve
            // it.
            if (value1 instanceof playground.c.lib.SymtabEntry)
            {
              specAndDecl = value1.getSpecAndDecl();
            }
            else
            {
              specAndDecl = value1.specAndDecl;
              
              // If we got the address of an array, reduce it to just array
              if (specAndDecl.length >= 2 &&
                  specAndDecl[0].getType() == "address" &&
                  specAndDecl[1].getType() == "array")
              {
                // Remove the 'address' declarator
                specAndDecl.shift();
              }
            }

            // Look at the first specifier/declarator to ensure this can be
            // indexed
            specOrDecl = specAndDecl[0];

            // Ensure this an array or a pointer
            type = specOrDecl.getType();
            switch(type)
            {
            case "array" :
            case "pointer" :
              break;

            default :
              this._throwIt(new playground.c.lib.RuntimeError(
                              this,
                              "Can't access an array element of something " +
                                "that is not an array"),
                            success,
                            failure);
              break;
            }

            // If we got a symbol table entry...
            if (value1 instanceof playground.c.lib.SymtabEntry)
            {
              // ... then retrieve the symbol's address
              addr = value1.getAddr();

              // If this is a pointer...
              if (type == "pointer" || value1.getIsParameter())
              {
                // ... then we need to get the address that the pointer points
                // to.
                addr = playground.c.lib.Node.__mem.get(addr, "pointer", true); 
              }
            }
            else
            {
              // We already have an address
              addr = value1.value;
            }

            // Figure out the size of each array element
            // First, get a copy of the specifier/declarator list
            specAndDecl = specAndDecl.slice(0);

            // Strip off the initial (pointer or array) entry to find out how
            // many bytes a value of the remaining specifier/declarator
            // consumes
            specAndDecl.shift();

            // Determine the memory type of the value
            specOrDecl = specAndDecl[0];
            type =
              specOrDecl instanceof playground.c.lib.Declarator
              ? "pointer"
              : specAndDecl[0].getCType();

            // Calculate the byte count
            offset = specAndDecl[0].calculateByteCount(1, specAndDecl, 0);

            // Get the index
            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);
                
                // We'd better have a specifier to say what type this is.
                specOrDecl = value2.specAndDecl[0];
                if (! (specOrDecl instanceof playground.c.lib.Specifier) ||
                    specOrDecl.getType() != "int")
                {
                  this._throwIt(new playground.c.lib.RuntimeError(
                                  this,
                                  "Array index must evaluate to an integer"),
                                success,
                                failure);
                }

                // Multiply together the byte count of each element, and the
                // desired index, to yield a byte offset to the element's
                // value
                offset *= value2.value;

                // Prepend a special "address" declarator
                specAndDecl.unshift(new playground.c.lib.Declarator(this,
                                                                    "address"));

                // The return value will be the value at the calculated
                // address plus the offset.
                success(
                  {
                  value       : addr + offset,
                  specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return newVal;
                            },
                            false,
                            success,
                            failure);
        break;

      case "auto" :
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        data.specifiers.setStorage("auto");
        success();
        break;

      case "bit-and" :
        /*
         * bit-and :
         *   0 : and_expression
         *   1 : equality_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Complete the operation, coercing to the appropriate type
                specAndDecl = this.__coerce(value1.specAndDecl,
                                            value2.specAndDecl,
                                            "bit-wise AND (&)");
                
                // Ensure we ended up with an int. Can't do this op otherwise.
                if (specAndDecl[0].getType() != "int")
                {
                  failure(
                    new playground.c.lib.RuntimeError(
                      this,
                      "Operation requires two integer values."));
                  return;
                }
                
                success(
                  { 
                    value       : value1.value & value2.value,
                    specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal & newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      case "bit_invert" :
        /*
         * bit_invert :
         *   0 : unary_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the unary expression
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            // Complete the operation
            success(
              { 
                value       : ~ value1.value,
                specAndDecl : value1.specAndDecl
              });
          }.bind(this),
          failure);
        break;

      case "bit-or" :
        /*
         * bit-or :
         *   0 : inclusive_or_expression
         *   1 : exclusive_or_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Complete the operation, coercing to the appropriate type
                specAndDecl = this.__coerce(value1.specAndDecl,
                                            value2.specAndDecl,
                                           "bit-wise OR (|)");

                // Ensure we ended up with an int. Can't do this op otherwise.
                if (specAndDecl[0].getType() != "int")
                {
                  failure(
                    new playground.c.lib.RuntimeError(
                      this,
                      "Operation requires two integer values."));
                  return;
                }

                success(
                  { 
                    value       : value1.value | value2.value,
                    specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal | newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      case "break" :
        /*
         * break
         *   (no children)
         */
        if (bExecuting)
        {
          // Throw a Break error, which will be caught by loops and the switch
          // statement.
          this._throwIt(new playground.c.lib.Break(this), success, failure);
        }
        else
        {
          success();
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
          success();
        }
        else
        {
          // We wouldn't have gotten here if this case statement were within a
          // switch. Getting here means that we found a case statement which
          // is not immediately within a switch statement.
          this.error("Found a 'case' not immediately within a 'switch'");
        }
        break;

      case "cast_expression" :
        /*
         * cast_expression
         *   0: type_name
         *   1: cast_expression
         */
        
        // Get the cast data from the type-name. It consists of specAndDecl
        // and size.
        this.children[0].process(
          data,
          bExecuting,
          function(castData)
          {
            // Retrieve the value being cast
            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                var             oldType;
                var             newType;
                var             typeSize;

                value1 = this.getExpressionValue(v, data);
                
                // Determine the type of the original value
                specOrDecl = value1.specAndDecl[0];
                if (specOrDecl instanceof playground.c.lib.Declarator)
                {
                  // We found a declarator, meaning the original type was
                  // either a pointer or an array, both of which we take to be
                  // pointer.
                  oldType = "pointer";
                }
                else
                {
                  // Get the type from this specifier
                  oldType = specOrDecl.getCType();
                }
                
                // Determine the type in memory
                specOrDecl = castData.specAndDecl[0];
                if (specOrDecl instanceof playground.c.lib.Declarator)
                {
                  // We found a declarator, meaning the new type is
                  // either a pointer or an array, both of which we take to be
                  // pointer.
                  newType = "pointer";
                }
                else
                {
                  // Get the type from this specifier
                  newType = specOrDecl.getCType();
                }
                
                // Determine the value's original size in bytes
                typeSize = playground.c.machine.Memory.typeSize[oldType];
                
                // If it's less than the word size, we'll sign-extend.
                if (typeSize < playground.c.machine.Memory.WORDSIZE)
                {
                  // Convert that size to a number of bits
                  typeSize *= 8;

                  // If the value's high bit is on...
                  if (value1.value & (1 << (typeSize - 1)))
                  {
                    // ... then fill the register with 1s
                    playground.c.lib.Node.__mem.setReg("R1", "long", -1);
                  }
                  else
                  {
                    // otherwise, fill the register with 0s.
                    playground.c.lib.Node.__mem.setReg("R1", "long", 0);
                  }
                }

                // If the old type's size is bigger than the new type's size...
                if (playground.c.machine.Memory.typeSize[oldType] >
                    playground.c.machine.Memory.typeSize[newType])
                {
                  // ... then reduce the size by writing the value to memory
                  // using the value's original specifier/declarator list and
                  // reading it back using the cast's specifier/declarator
                  // list.
                  playground.c.lib.Node.__mem.setReg("R1",
                                                     oldType, 
                                                     value1.value);
                  value1.value = playground.c.lib.Node.__mem.getReg("R1",
                                                                    newType);
                }
                
                // Assign the cast's specifier/declarator list to the value
                value1.specAndDecl = castData.specAndDecl;
                
                success(value1);
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "char" :
        // Only applicable when executing and in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setSize("char");
        success();
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
            throw new Error("Internal error: Expected to find symtab entry");
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

        function compound_statement_finalize()
        {
          // Revert to the prior scope
          playground.c.lib.Symtab.popStack();
          
          success();
        };

        // Process the declaration list
        this.children[0].process(
          data,
          bExecuting,
          function()
          {
            // Process the statement list
            this.children[1].process(
              data,
              bExecuting,
              compound_statement_finalize.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "const" :
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        data.specifiers.setConstant("constant");
        success();
        break;

      case "constant" :
        // JavaScript is arbitrary precision. Ensure we have a valid C value
        // by writing it as a fixed-type to a register, and then reading it
        // back in.
        playground.c.lib.Node.__mem.setReg("R1", this.numberType, this.value);
        this.value = playground.c.lib.Node.__mem.getReg("R1", this.numberType);

        // Create a specifier for this number type
        specOrDecl = new playground.c.lib.Specifier(this);
        switch(this.numberType)
        {
        case playground.c.lib.Node.NumberType.Int : 
          specOrDecl.setType("int");
          break;

        case playground.c.lib.Node.NumberType.Uint : 
          specOrDecl.setType("int");
          specOrDecl.setSigned("unsigned");
          break;

        case playground.c.lib.Node.NumberType.Long : 
          specOrDecl.setType("int");
          specOrDecl.setSize("long");
          break;

        case playground.c.lib.Node.NumberType.ULong : 
          specOrDecl.setType("int");
          specOrDecl.setSigned("unsigned");
          specOrDecl.setSize("long");
          break;

        case playground.c.lib.Node.NumberType.Float : 
          specOrDecl.setType("float");
          break;
          
        default :
          throw new Error("Unexpected number type: " + this.numberType);
        }

        success(
          {
            value       : this.value, 
            specAndDecl : [ specOrDecl ]
          });

        break;

      case "continue" :
        /*
         * continue
         *   (no children)
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // Throw a Continue error, which will be caught by loops.
        this._throwIt(new playground.c.lib.Continue(this), success, failure);
        break;

      case "declaration" :
        /*
         * declaration
         *   0: declaration_specifiers
         *   1: init_declarator_list
         */

        // Save data members which we'll overwrite
        oldId = data.id;
        oldEntry = data.entry;
        oldSpecifiers = data.specifiers;
        oldSpecAndDecl = data.specAndDecl;
        oldStructSymtab = data.structSymtab;

        // Create our own data object with a new specifier for this declaration
        data.id = "declaration";
        data.specifiers = new playground.c.lib.Specifier(this);

        // Process the specifiers
        this.children[0].process(
          data,
          bExecuting,
          function()
          {
            // Process the declarators
            this.children[1].process(
              data, 
              bExecuting,
              function()
              {
                // Restore data members
                data.id = oldId;
                data.entry = oldEntry;
                data.specifiers = oldSpecifiers;
                data.specAndDecl = oldSpecAndDecl;
                data.structSymtab = oldStructSymtab;
                success();
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "declaration_list" :
        /*
         * declaration_list
         *   0: declaration
         *   ...
         */
        this.__processSubnodes(
          data,
          bExecuting,
          function()
          {
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
            success();
          }.bind(this),
          failure);
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
        if (bExecuting && this.children[0].type != "enum")
        {
          success();
          break;
        }

        // Is the first child a typedef?
        if (this.children[0].type == "typedef")
        {
          // Yup. We need to get back here after processing the remaining
          // children, to save its definition. 
          this.__processSubnodes(
            data,
            bExecuting,
            function()
            {
              // Clone the specifiers of the source type
              data.specifiers = data.specifiers.cloneTypedef();
              
              // This cloned one is storage type 'typedef'
              data.specifiers.setStorage("typedef");

              success();
            }.bind(this),
            failure);
        }
        else
        {
          // It's not a typedef. Process it normally.
          this.__processSubnodes(data, bExecuting, success, failure);
        }
        break;

      case "declarator" :
        /*
         * declarator
         *   0 : direct_declarator
         *   1 : pointer? array?
         *   ...
         */
        
        // Process the direct declarator, to determine the identifier
        this.children[0].process(
          data,
          bExecuting,
          function(entry)
          {
            var             i;

            /* 
             * FIXME. We should support pointers to functions. It will require
             * some fair amount of work, since functions are referenced by
             * their Node, and are not currently anyplace in memory. (Using
             * the non-displayed area of memory reserved for constants might
             * be appropriate. Allocate a word for each function so that
             * pointers to functions have a real memory address to store.
             */
            if (bExecuting && typeof entry == "undefined")
            {
              failure(
                new playground.c.lib.RuntimeError(
                  this,
                  "Pointers to functions are not currently supported."));
              return;
            }

            // Process the remaining sub-nodes
            i = 1;
            this.children[i].process(
              data,
              bExecuting,
              function()
              {
                if (++i < this.children.length)
                {
                  this.children[i].process(
                    data,
                    bExecuting,
                    arguments.callee.bind(this),
                    failure);
                }
                else
                {
                  success(entry);
                }
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "default" :
        /*
         * default
         *   0 :statement
         */

        // We only process default expressions while executing.
        if (! bExecuting)
        {
          success();
        }
        else
        {
          // We wouldn't have gotten here if this case statement were within a
          // switch. Getting here means that we found a case statement which
          // is not immediately within a switch statement.
          this.error("Found a 'default' not immediately within a 'switch'");
          // not reached
        }
        break;

      case "dereference" :
        /*
         * dereference
         *   0: cast_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the cast_expression
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value = v;

            // If we found a symbol, get its address and type
            if (value instanceof playground.c.lib.SymtabEntry)
            {
              // Find the address from which we will retrieve the pointer
              addr = value.getAddr();

              // Obtain the specifier/declarator list
              specAndDecl = value.getSpecAndDecl().slice(0);

              // Get the address contained in this pointer
              if (specAndDecl[0].getType() != "array")
              {
                addr = playground.c.lib.Node.__mem.get(addr, "pointer", true);
              }
            }
            else
            {
              // Find the address from which we will retrieve the pointer
              addr = value.value;

              // Obtain the specifier/declarator list
              specAndDecl = value.specAndDecl.slice(0);
            }

            // Pull the first specifier/declarator off of the list
            specOrDecl = specAndDecl.shift();
            type = specOrDecl.getType();

            // Ensure that we can dereference this thing. To be able to, it
            // must be either a pointer whose value must be retrieved, or
            // already an adderess.
            if (type != "pointer" && type != "address" && type != "array")
            {
              this._throwIt(new playground.c.lib.RuntimeError(
                              this,
                              "Can not dereference " + value.getName() + 
                                " because it is not an address type."),
                            success,
                            failure);
              return;
            }
            
            // We don't currently support pointers to functions
            if (type == "pointer" && specAndDecl[0].getType() == "function")
            {
              this._throwIt(new playground.c.lib.RuntimeError(
                              this,
                              "Dereferencing pointers to function is " +
                              "currently not supported."),
                            success,
                            failure);
              return;
            }
            
            // Prepend an "address" declarator
            specAndDecl.unshift(
              new playground.c.lib.Declarator(this, "address"));

            // Prepare the return value. Get the value of the pointer.
            value3 = 
              {
                specAndDecl : specAndDecl,
                value       : addr
              };

            // Complete the operation
            success(value3);
          }.bind(this),
          failure);
        break;

      case "direct_abstract_declarator" :
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "divide" :
        /*
         * divide :
         *   0 : multiplicative_expression
         *   1 : cast_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Complete the operation, coercing to the appropriate type
                specAndDecl = this.__coerce(value1.specAndDecl,
                                            value2.specAndDecl,
                                            "divide (/)");
                f = specAndDecl[0].getType() == "int" 
                      ? Math.floor 
                      : function (n) { return n; };
                success(
                  { 
                    value       : f(value1.value / value2.value),
                    specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal / newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      case "double" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setType("double");
        success();
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
          this.children[0].process(data, bExecuting, success, failure);
          break;
        }
        
        // We're executing. Process the loop.
        this._tryIt(
          // try
          function(succ, fail)
          {
            // Save current symbol table so we know where to pop to upon return
            symtab = playground.c.lib.Symtab.getCurrent();

            // try
            var do_while_try_statement_block = function(succ, fail)
            {
              // Save current symbol table so we know where to pop to upon
              // continue
              symtab2 = playground.c.lib.Symtab.getCurrent();

              // Process the statement block
              this.children[0].process(data, bExecuting, succ, fail);
            }.bind(this);

            // catch
            var do_while_catch_continue = function(error, succ, fail)
            {
              // was a continue statement executed?
              if (error instanceof playground.c.lib.Continue)
              {
                // Yup. Restore symbol table to where it was when we entered
                // the statement from which we are continuing
                while (playground.c.lib.Symtab.getCurrent() != symtab2)
                {
                  playground.c.lib.Symtab.popStack();
                }
                succ();
              }
              else
              {
                // It's not a continue. Re-throw the error
                this._throwIt(error, succ, fail);
              }
            }.bind(this);

            // statement block with try/catch
            var do_while_while_statement_block = function(succ, fail)
            {
              this._tryIt(do_while_try_statement_block,
                          do_while_catch_continue,
                          succ,
                          fail);
            }.bind(this);

            // the condition to continue looping
            var do_while_while_condition = function(succ, fail)
            {
              this.children[1].process(
                data,
                bExecuting,
                function(v)
                {
                  var             value;
                  
                  value = this.getExpressionValue(v, data);

                  if (value.value)
                  {
                    do_while_main(succ, fail);
                  }
                  else
                  {
                    succ();
                  }
                }.bind(this),
                fail);
            }.bind(this);

            // This is a do/while, so we process the statement block initially
            var do_while_main = function(succ, fail)
            {
              do_while_while_statement_block(
                function()
                {
                  do_while_while_condition(succ, fail);
                }.bind(this),
                fail);
            }.bind(this);
            
            do_while_main(succ, fail);
          }.bind(this),
          
          // catch
          function(error, succ, fail)
          {
            // was a break statement executed?
            if (error instanceof playground.c.lib.Break)
            {
              // Yup. Retore symbol table to where it was when we entered the
              // statement from which we are breaking
              while (playground.c.lib.Symtab.getCurrent() != symtab)
              {
                playground.c.lib.Symtab.popStack();
              }
              succ();
            }
            else
            {
              // It's not a break. Re-throw the error
              this._throwIt(error, succ, fail);
            }
          }.bind(this),

          success,
          failure);
        break;

      case "ellipsis" :
        throw new playground.c.lib.NotYetImplemented("ellipsis");
        break;

      case "enum" :
        /*
         * enum
         *   0: enumerator_list?
         *   1: identifier
         */

        // Treat enum almost identically to struct. The differences are
        // handled in the function that deals with structures.
        case_struct_union_enum.bind(this)(StructUnionEnum.Enum);
        break;

      case "enumerator" :
        /*
         * enumerator
         *   0: identifier
         *   1: constant_expression?
         */

        // Save data members we may overwrite
        oldSpecifiers = data.specifiers;
        oldSpecAndDecl = data.specAndDecl;

        // Create our own data object with a new specifier for this enum
        data.id = "enum"; 
        data.specifiers = new playground.c.lib.Specifier(this);
        data.specifiers.setConstant("constant");
        data.specAndDecl = [];

        // Process the identifier
        this.children[0].process(
          data,
          bExecuting,
          function(entry)
          {
            if (entry)
            {
              data.entry = entry;
            }
            // Append the specifiers to the specifier/declarator list
            data.specAndDecl.push(data.specifiers);

            // Calculate the offset in the symbol table for this symbol
            // table entry, based on the now-complete specifiers and
            // declarators. (Only do this the first time, when not executing.)
            data.entry.calculateOffset();

            // Process the enumerator's value
            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                // Did we get a value?
                if (v)
                {
                  // Yup. Ensure it's valid for an enumerator initializer
                  specOrDecl = v.specAndDecl[v.specAndDecl.length - 1];
                  if (specOrDecl.getType() != "int")
                  {
                    failure(
                      new playground.c.lib.RuntimeError(
                        this,
                        "Enumerator initializer must evaluate to an int."));
                    return;
                  }
                  
                  // Prepare for the next enumerator with no provided value
                  data.enumValue = v.value + 1;

                  // This is the value we'll set the enumerator to
                  value = v;
                }
                else
                {
                  // There is no initializer provided. Use the next
                  // automatically-generated one.
                  specOrDecl = new playground.c.lib.Specifier(this, "int");
                  value =
                    {
                      value       : data.enumValue++,
                      specAndDecl : [ specOrDecl ]
                    };
                }
                
                // Set this constant's value
                playground.c.lib.Node.__mem.set(data.entry.getAddr(),
                                                "int",
                                                value.value);

                // Restore saved data members
                data.specifiers = oldSpecifiers;
                data.specAndDecl = oldSpecAndDecl;

                success();
              },
              failure);
          }.bind(this),
          failure);

        break;

      case "enumerator_list" :
        /*
         * enumerator_list
         *   0: enumerator
         *   ...
         */
        // Assume an initial enumerator value of 0
        data.enumValue = 0;
        
        this.__processSubnodes(
          data,
          bExecuting,
          function()
          {
            delete data.enumValue;
            success();
          }.bind(this),
          failure);
        break;

      case "equal" :
        /*
         * equal :
         *   0 : equality_expression
         *   1 : relational_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = new playground.c.lib.Specifier(this, "int");

                success(
                  { 
                    value       : value1.value === value2.value ? 1 : 0,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "exclusive-or" :
        /*
         * exclusive-or :
         *   0 : exclusive_or_expression
         *   1 : and_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Complete the operation, coercing to the appropriate type
                specAndDecl = this.__coerce(value1.specAndDecl,
                                            value2.specAndDecl,
                                            "exclusive-or (^)");

                // Ensure we ended up with an int. Can't do this op otherwise.
                if (specAndDecl[0].getType() != "int")
                {
                  failure(
                    new playground.c.lib.RuntimeError(
                      this,
                      "Operation requires two integer values."));
                  return;
                }

                success(
                  { 
                    value       : value1.value ^ value2.value,
                    specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "expression" :
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "extern" :
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        data.specifiers.setStorage("extern");
        success();
        break;

      case "float" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setType("float");
        success();
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
          this.children[0].process(
            data,
            bExecuting,
            function()
            {
              // statement block
              this.children[2].process(
                data,
                bExecuting,
                function()
                {
                  // after each iteration
                  this.children[3].process(
                    data,
                    bExecuting,
                    function()
                    {
                      success();
                    }.bind(this),
                    failure);
                }.bind(this),
                failure);
            }.bind(this),
            failure);
          break;
        }
        
        // We're executing. Process the loop.
        this._tryIt(
          function(succ, fail)
          {
            // Save current symbol table so we know where to pop to upon return
            symtab = playground.c.lib.Symtab.getCurrent();

            // We're executing. Process the loop. First, initialization.
            this.children[0].process(
              data,
              bExecuting,
              function()
              {
                var             fWhile = arguments.callee;
                var             fPostBody = function()
                {
                  // After each iteration. Upon success, return to
                  // processing the 'while' condition.
                  this.children[3].process(
                    data, 
                    bExecuting,
                    function()
                    {
                      fWhile.bind(this)();
                    }.bind(this),
                    fail);
                }.bind(this);

                // Process the 'while' condition
                this.children[1].process(
                  data,
                  bExecuting,
                  function(v)
                  {
                    // Did we find a while condition?
                    if (typeof v == "undefined")
                    {
                      // Nope. Simulate true.
                      value =
                        {
                          value       : 1
                          
                          // specAndDecl not used here, so don't bother with it
                        };
                    }
                    else
                    {
                      // There's a while condition. Get its value.
                      value = this.getExpressionValue(v, data);
                    }
                    if (value.value)
                    {
                      // 'while' condition evaluates to true. Now, statements.
                      this._tryIt(
                        function(succ, fail)
                        {
                          // Save current symbol table so we know where to pop
                          // to upon continue
                          symtab2 = playground.c.lib.Symtab.getCurrent();

                          // Process the statement block
                          this.children[2].process(
                            data, bExecuting, fPostBody, fail);
                        }.bind(this),
                        function(error, succ, fail)
                        {
                          // was a continue statement executed?
                          if (error instanceof playground.c.lib.Continue)
                          {
                            // Yup. Restore symbol table to where it was when
                            // we entered the statement from which we are
                            // continuing
                            while (playground.c.lib.Symtab.getCurrent() != 
                                   symtab2)
                            {
                              playground.c.lib.Symtab.popStack();
                            }
                            fPostBody.bind(this)();
                          }
                          else
                          {
                            // It's not a continue. Re-throw the error
                            this._throwIt(error, succ, fail);
                          }
                        }.bind(this),
                        succ,
                        fail);
                    }
                    else
                    {
                      success();
                    }
                  }.bind(this),
                  fail);
              }.bind(this),
              fail);
          }.bind(this),
          
          // catch
          function(error, succ, fail)
          {
            // was a break statement executed?
            if (error instanceof playground.c.lib.Break)
            {
              // Yup. Retore symbol table to where it was when we entered the
              // statement from which we are breaking
              while (playground.c.lib.Symtab.getCurrent() != symtab)
              {
                playground.c.lib.Symtab.popStack();
              }
              succ();
            }
            else
            {
              // It's not a break. Re-throw the error
              this._throwIt(error, succ, fail);
            }
          }.bind(this),

          success,
          failure);
        break;

      case "function_call" :
        /*
         * function_call
         *   0: primary_expression (function to be called)
         *   1: argument_expression_list?
         */
        if (! bExecuting)
        {
          success();
          break;
        }
        
        // Get a quick reference to memory
        mem = playground.c.lib.Node.__mem;

        // Save the stack pointer, so we can restore it after the function call
        origSp = mem.getReg("SP", "unsigned int");
        
        // Retrieve the symbol table entry for this function
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            var             type;

            value1 = v;
            
            // Get the address of that entry, which is the node for the called
            // function, or the reference of a built-in function.
            value2 = value1.getAddr(); // THIS RETURNS A NODE

            // Save any old argument array
            oldArgs = data.args;

            // Get the type of this (supposed) funciton
            type = value1.getSpecAndDecl()[0].getType();

            // Prepare to save arguments in a JS array as well as on the
            // stack, in case this is a built-in function being called.
            if (type == "builtIn")
            {
              data.args = [];
            }
            else if (type != "function")
            {
              failure(
                new playground.c.lib.RuntimeError(
                  this,
                  "Attempting to call function '" +
                  value1.getName() +
                  "' but '" +
                  value1.getName() +
                  "' is not declared as a function."));
              return;
            }
            else
            {
              // In case this is a non-builtIn embedded in a builtIn, remove
              // any arguments from the data objects.
              delete data.args;

              // Ensure that this function has been defined, not just declared
              if (! value2 || value1.getLine() > this.line)
              {
                // Nope, it hasn't.
                failure(
                  new playground.c.lib.RuntimeError(
                    this,
                    "Function '" + value1.getName() + 
                    "' has not been defined."));
                return;
              }
              
              // This is a real function (not built-in). Begin the activation
              // record
              mem.beginActivationRecord(origSp);

              // Name this activation record
              declarator = value2.children[1];
              function_decl = declarator.children[0];
              depth = ++playground.c.lib.Node._depth;
              mem.nameActivationRecord("Stack: Activation Record " + 
                                       depth + ": " + 
                                       function_decl.children[0].value);
            }
            
            // Push the arguments onto the stack
            //
            // FIXME: validate that argument types match definition
            this.children[1].process(
              data,
              bExecuting,
              function()
              {
                // Is this a built-in function, or a user-generated one?
                if (value1.getSpecAndDecl()[0].getType() == "builtIn")
                {
                  // Prepend failure and then the success functions
                  data.args.unshift(failure);
                  data.args.unshift(
                    function(ret)
                    {
                      // Save the return value
                      value3 = ret;

                      // Restore the old argument array, if there was one.
                      data.args = oldArgs;

                      // Restore the stack pointer
                      mem.setReg("SP", "unsigned int", origSp);
                      success(value3);
                    });
                  
                  // Call the function now
                  value2.apply(null, data.args);
                }
                else
                {
                  // Push the return address (our current line number) onto
                  // the stack
                  sp = mem.stackPush("unsigned int", this.line);

                  // Add "symbol info" to show that this was a return address
                  intSize = playground.c.machine.Memory.typeSize["int"];
                  mem.setSymbolInfo(
                    sp,
                    {
                      getName         : function() 
                      {
                        return "called from line #"; 
                      },
                      getType         : function() { return "int"; },
                      getUnsigned     : function() { return false; },
                      getSize         : function() { return intSize; },
                      getPointerCount : function() { return 0; },
                      getArraySizes   : function() { return []; },
                      getIsParameter  : function() { return false; }
                    });

                  // Process that function. Save its return value in value3
                  value2.process(
                    data,
                    bExecuting,
                    function(v)
                    {
                      value3 = v;
                      
                      // We're finished with this activation record.
                      mem.endActivationRecord();

                      // We've completed a level of function call. Reduce depth.
                      playground.c.lib.Node._depth--;

                      // Restore the old argument array, if there was one.
                      data.args = oldArgs;

                      // Restore the stack pointer
                      mem.setReg("SP", "unsigned int", origSp);
                      success(value3);
                    }.bind(this),
                    failure);
                }
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "function_decl" :
        /*
         * function_decl
         *   0 : direct_declarator
         *   1 : parameter_type_list
         *   2 : identifier_list // K&R only; not implemented; always null
         */
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        // Process the direct declarator. It may add a declarator.
        this.children[0].process(
          data,
          bExecuting,
          function()
          {
            var             i;
            var             bDefinition = false;
            var             forwardDeclSymtab = null;

            // Find our enclosing function definition
            for (subnode = this.parent; subnode; subnode = subnode.parent)
            {
              if (subnode.type == "function_definition")
              {
                bDefinition = true;
                break;
              }
            }

            // If we found subnode, this is a function definition. Otherwise,
            // it's a forward declaration.
            if (subnode)
            {
              // We've now found a function definition. Retrieve or create the
              // symbol table for this function's parameters. If there had been
              // a forward declaration, we'll find the symbol table already
              // existing. Otherwise, we'll create it new.
              symtab = playground.c.lib.Symtab.getByName(
                data.entry.getName(),
                playground.c.lib.Symtab.getCurrent());

              if (! symtab)
              {
                // There was no forward declaration. Create a new symbol table.
                symtab = new playground.c.lib.Symtab(
                  playground.c.lib.Symtab.getCurrent(), 
                  data.entry.getName(),
                  this.line);
              }
              else
              {
                // There was a forward declaration. Save its symbol table, so
                // we can later compare its symbols to what we find in the
                // defintion, but create a new symbol table for the
                // definition.
                forwardDeclSymtab = symtab;
                
                // Remove the old symbol table
                playground.c.lib.Symtab.remove(symtab);
                
                // Create a new symbol table for the defintion of the function
                symtab = new playground.c.lib.Symtab(
                  playground.c.lib.Symtab.getCurrent(), 
                  data.entry.getName(),
                  this.line);
              }

              // Add a function declarator for this symbol.
              declarator = new playground.c.lib.Declarator(this);
              declarator.setType("function");
              data.specAndDecl.push(declarator);

              // We now know the subnode of the definition.
              declarator.setFunctionNode(subnode);

              // Save the function's symbol table and name in the function
              // definition node
              subnode._symtab = symtab;
              subnode._functionName = data.entry.getName();
              
              // This symbol is no longer extern
              specOrDecl = data.specifiers;
              specOrDecl.setStorage(null);
            }
            else
            {
              // Mark this symbol as extern so the definition isn't flagged as
              // a redeclaration.
              data.specifiers.setStorage("extern");

              // Add a function declarator for this symbol.
              declarator = new playground.c.lib.Declarator(this);
              declarator.setType("function");
              data.specAndDecl.push(declarator);

              // Create a symbol table for this function's arguments
              symtab = new playground.c.lib.Symtab(
                playground.c.lib.Symtab.getCurrent(), 
                data.entry.getName(),
                this.line);
            }
            
            // Process the remaining children
            if (this.children.length > 0)
            {
              i = 1;
              this.children[i].process(
                data,
                bExecuting,
                function()
                {
                  if (++i < this.children.length)
                  {
                    this.children[i].process(
                      data,
                      bExecuting,
                      arguments.callee.bind(this),
                      failure);
                  }
                  else
                  {
                    // If this is a declaration, not a defintion, ...
                    if (! bDefinition)
                    {
                      // ... pop this function's symbol table from the
                      // stack. Otherwise, it'll get popped off following the
                      // complete function definition.
                      playground.c.lib.Symtab.popStack();
                    }
                    else
                    {
                      // FIXME: 
                      //
                      // Ensure that the definition matches the forward
                      // declaration. We have forwardDeclSymtab available, to
                      // compare parameters. At present, there is nothing that
                      // saves the forward declaration's specAndDecl.
                    }
                    success();
                  }
                }.bind(this),
                failure);
            }
            else
            {
              throw new Error("Oh no! My children are missing!");
            }
          }.bind(this),
          failure);
        break;

      case "function_definition" :
        /*
         * function_definition
         *   0: type specifier
         *   1: declarator
         *   2: declaration_list // K&R only; not implemented; always null
         *   3: compound_statement
         */

        // If we're not executing yet...
        if (! bExecuting)
        {
          // Save old specifiers and specAndDecl before overwriting them
          oldId = data.id;
          oldEntry = data.entry;
          oldSpecifiers = data.specifiers;
          oldSpecAndDecl = data.specAndDecl;

          // Create our own data object with a new specifier for this
          // declaration
          data.id = "function_definition";
          data.specifiers = new playground.c.lib.Specifier(this);
          data.specAndDecl = [];

          // Process the children
          this.__processSubnodes(
            data,
            bExecuting,
            function()
            {
              // Add the specifier to the end of the specifier/declarator list
              data.specAndDecl.push(data.specifiers);

              // Restore saved data members
              data.id = oldId;
              data.entry = oldEntry;
              data.specifiers = oldSpecifiers;
              data.specAndDecl = oldSpecAndDecl;

              // Pop this function's symbol table from the stack
              playground.c.lib.Symtab.popStack();
              success();
            }.bind(this),
            failure);
        
          break;
        }

        // We're executing. The symbol table entry for this function must
        // exist. Retrieve it from the node where we saved it.
        symtab2 = this._symtab;

        // Push it onto the symbol table stack as if we'd just created it
        playground.c.lib.Symtab.pushStack(symtab2);

        // Set the current frame pointer to the location of the stack pointer
        // plus one word. The arguments and return address have already been
        // pushed onto the stack. The word we're adding is because we want the
        // frame pointer to be pointing at the arguments, not pointing at the
        // return address.
        symtab2.setFramePointer(
          playground.c.lib.Node.__mem.getReg("SP", "unsigned int") + WORDSIZE);

        this._tryIt(
          // try
          function(succ, fail)
          {
            // Save current symbol table so we know where to pop to upon return
            symtab = playground.c.lib.Symtab.getCurrent();

            // Process the paremeter list
            declarator = this.children[1];
            function_decl = declarator.children[0];
            function_decl.children[1].process(
              data,
              bExecuting,
              function()
              {
                // Process the compound statement
                this.children[3].process(
                  data,
                  bExecuting,
                  function()
                  {
                    // Create a specifier for the value
                    specOrDecl = new playground.c.lib.Specifier(
                      this, "int", "char", "unsigned");

                    // A return statement in the function will cause the
                    // catch() block to be executed. If one doesn't exist,
                    // use 127.
                    value3 =
                      {
                        value       : 127,
                        specAndDecl : [ specOrDecl ]
                      };

                    // Pop this function's symbol table from the stack
                    playground.c.lib.Symtab.popStack();

                    // Obtain the symbol table entry for this function
                    entry = symtab.getParent().get(this._functionName, true);

                    // Get the specifier/declarator list for this function
                    specAndDecl = entry.getSpecAndDecl();

                    // Remove the "function" declarator, to leave the return
                    // type
                    specAndDecl.shift();

                    // Set this specAndDecl for the return value
                    value3.specAndDecl = specAndDecl;

                    success(value3);
                  }.bind(this),
                  fail);
              }.bind(this),
              fail);
          }.bind(this),
        
          // catch
          function(error, succ, fail)
          {
            // Did we get back a return value?
            if (error instanceof playground.c.lib.Return)
            {
              // Yup. It contains the return value
              value3 = error.returnCode;
              specAndDecl = value3.specAndDecl;

              // Retore symbol table to where it was when we called the
              // function
              while (playground.c.lib.Symtab.getCurrent() != symtab)
              {
                playground.c.lib.Symtab.popStack();
              }
              
              // Pop this function's symbol table from the stack
              playground.c.lib.Symtab.popStack();

              // Obtain the symbol table entry for this function
              entry = symtab.getParent().get(this._functionName, true);

              // Get the specifier/declarator list for this function
              specAndDecl = entry.getSpecAndDecl();

              // Remove the "function" declarator, to leave the return type
              specAndDecl.shift();

              // Set this specAndDecl for the return value
              value3.specAndDecl = specAndDecl;

              succ(value3);
            }
            else
            {
              // It's not a return code. Re-throw the error
              this._throwIt(error, succ, fail);
            }
          }.bind(this),
        
          success,
          failure);
        
        break;

      case "goto" :
        throw new playground.c.lib.NotYetImplemented("goto");
        break;

      case "greater-equal" :
        /*
         * greater-equal :
         *   0 : relational_expression
         *   1 : shift_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = new playground.c.lib.Specifier(this, "int");

                success(
                  { 
                    value       : value1.value >= value2.value ? 1 : 0,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "greater-than" :
        /*
         * greater-than :
         *   0 : relational_expression
         *   1 : shift_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = new playground.c.lib.Specifier(this, "int");

                success(
                  { 
                    value       : value1.value > value2.value ? 1 : 0,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "identifier" :
        if (! bExecuting)
        {
          // If we're declaring something...
          if (data.specifiers && 
              (! data.bIsParameter || ! this.value.match(/^struct#/)))
          {
            // This symbol shouldn't exist. Create a symbol table entry for it
            entry = playground.c.lib.Symtab.getCurrent().add(
              this.value, this.line, false, data.bIsParameter, data.bIsDefine);

            if (! entry)
            {
              // This entry already exists. Retrieve it.
              entry = 
                playground.c.lib.Symtab.getCurrent().get(this.value, true);
              bNewEntry = false;

              // If the entry was extern, allow a new symbol
              // definition. Otherwise, flag this as a duplicate declaration.
              specAndDecl = entry.getSpecAndDecl();
              if (specAndDecl[specAndDecl.length - 1].getStorage() != "extern")
              {
                this.error("Identifier '" + this.value + "' " +
                           "was previously declared near line " +
                           entry.getLine(),
                           true);
                // not reached
                break;
              }
            }
            else
            {
              // The entry is brand new
              bNewEntry = true;
            }

            // Attach the specifier/declarator list to this symbol, if it's
            // not a typedef, or is a brand new entry.
            if (data.specifiers.getStorage() !== "typedef" || bNewEntry)
            {
              entry.setSpecAndDecl(data.specAndDecl);
            }
            
            // If we're in the middle of declaring a structure variable...
            if (data.structSymtab)
            {
              // ... then save the structure symbol table with this symbol
              entry.setStructSymtab(data.structSymtab);
            }
            else
            {
              // Otherwise, save the entry's structSymtab. (It may be null.)
              data.structSymtab = entry.getStructSymtab();
            }
          }
          else
          {
            // Retrieve the supposedly existing entry
            entry = playground.c.lib.Symtab.getCurrent().get(this.value, false);
            
            // If it doesn't exist...
            if (! entry)
            {

              // Get the structure name without the prefixed "struct#"
              name = this.value.replace(/^struct#/, "");
              
              if (name != this.value)
              {
                this.error("Struct, union, or enum '" + name + 
                           "' is not declared.",
                           true);
              }
              else
              {
                this.error("Identifier '" + name + "' is not declared.",
                           true);
              }
              // not reached
              break;
            }
          }
          
          // Save the entry.
          data.entry = entry;

          // Process any children
          this.__processSubnodes(data, bExecuting, success, failure);
        }
        else
        {
          // We're executing. Obtain the symbol table entry for this identifier
          entry = playground.c.lib.Symtab.getCurrent().get(this.value, false);
          if (! entry)
          {
            this._throwIt(new playground.c.lib.RuntimeError(
                            this,
                            "Undeclared variable: " + this.value),
                          success,
                          failure);
            break;
          }
          success(entry);
        }
        break;

      case "identifier_list" :
        /*
         * identifier_list
         *   0: identifier
         *   ...
         */
        throw new Error("K&R-style declarations are not supported");
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
          this.__processSubnodes(data, bExecuting, success, failure);
          break;
        }
        
        // We're executing. Get the value of the expression
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            // If the retrieved value is non-zero...
            if (value1.value)
            {
              // ... then process child 1
              this.children[1].process(data, bExecuting, success, failure);
            }
            else
            {
              // otherwise process child 2
              this.children[2].process(data, bExecuting, success, failure);
            }
          }.bind(this),
          failure);
        break;

      case "init_declarator" :
        /*
         * init_declarator
         *   0 : declarator
         *   1 : initializer?
         */

        var init_declarator_initialize = function(success, failure)
        {
          bOldIsInitializer = data.bIsInitializer;
          data.bIsInitializer = true;

          // We're executing. Assign the initial value
          this.__assignHelper(data, 
                              function(oldVal, newVal)
                              {
                                return newVal;
                              },
                              false,
                              function()
                              {
                                data.bIsInitializer = bOldIsInitializer;
                                success();
                              },
                              failure);
        }.bind(this);

        if (! bExecuting)
        {
          // Save specAndDecl before overwriting it
          oldSpecAndDecl = data.specAndDecl;

          // Create a list to hold specifiers and declarators.
          data.specAndDecl = [];
          
          // Process the declarator, which also creates the symbol table entry
          this.children[0].process(
            data,
            bExecuting,
            function()
            {
              var             specOrDecl;

              // If we're not executing, and we find that the declarator is an
              // array without a length, then determine the length by the number
              // of children of the initializer (child 1). If that node
              // isn't an initializer_list (or a string_literal, if we're
              // initializing a character array), then generate a run-time
              // error.
              if (! bExecuting &&
                  ! data.bIsParameter &&
                  this.type == "init_declarator" &&
                  data.entry instanceof playground.c.lib.SymtabEntry &&
                  data.entry.getSpecAndDecl() &&
                  (specOrDecl = data.entry.getSpecAndDecl()[0]) &&
                  specOrDecl.getType() == "array" &&
                  specOrDecl.getArrayCount() === null)
              {
                // Array length is unknown. If this is a char array and
                // there's a character string initializer...
                if (data.entry.getSpecAndDecl().length == 1 &&
                    data.specifiers &&
                    data.specifiers.getType() == "int" &&
                    data.specifiers.getSize() == "char" &&
                    this.children[1].children.length == 1 &&
                    this.children[1].children[0].type == "string_literal")
                {
                  // Array length is length of string, including null terminator
                  specOrDecl.setArrayCount(
                    this.children[1].children[0].value.length + 1);
                  
                }
                else if (this.children[1].type == "initializer_list")
                {
                  // There is an initializer list. Use its length to set the
                  // array's length.
                  specOrDecl.setArrayCount(this.children[1].children.length);
                }
                else
                {
                  // There's no way to ascertain the array length.
                  failure(
                    new playground.c.lib.RuntimeError(
                      this,
                      "Array is not given a length, either explicitly via " +
                      "an array size, nor implicitly with an initializer."));
                  return;
                }
              }

              // Add the specifier to the end of the specifier/declarator list
              data.specAndDecl.push(data.specifiers);

              // Add the structure symbol table, if there is one
              data.entry.setStructSymtab(data.structSymtab);

              // Calculate the offset in the symbol table for this symbol
              // table entry, based on the now-complete specifiers and
              // declarators
              data.entry.calculateOffset();

              // If this is a root entry (global variable)...
              if (data.entry.getSymtab().getParent() === null &&
                  data.entry.getSpecAndDecl()[0].getType() != "function")
              {
                // ... then initialize it.
                init_declarator_initialize(
                  function()
                  {
                    // Restore data members
                    data.specAndDecl = oldSpecAndDecl;
                    success();
                  },
                  failure);
              }
              else
              {
                // Restore data members
                data.specAndDecl = oldSpecAndDecl;

                success();
              }
            }.bind(this),
            failure);
        }
        else
        {
          init_declarator_initialize(success, failure);
        }
        break;

      case "init_declarator_list" :
        /*
         * init_declarator_list
         *   0: init_declarator
         *   ...
         */
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "initializer_list" :
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "int" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setType("int");
        success();
        break;

      case "label" :
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        data.specifiers.setType("label");
        throw new playground.c.lib.NotYetImplemented("label");
        success();
        break;

      case "left-shift" :
        /*
         * left-shift :
         *   0 : shift_expression
         *   1 : additive_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Complete the operation, coercing to the appropriate type
                specOrDecl = 
                  new playground.c.lib.Specifier(this, "int", "unsigned");

                success(
                  { 
                    value       : value1.value << value2.value,
                    specAndDecl : [ specAndDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal << newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      case "less-equal" :
        /*
         * less-equal :
         *   0 : relational_expression
         *   1 : shift_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = new playground.c.lib.Specifier(this, "int");

                success(
                  { 
                    value       : value1.value <= value2.value ? 1 : 0,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "less-than" :
        /*
         * less-than :
         *   0 : relational_expression
         *   1 : shift_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = new playground.c.lib.Specifier(this, "int");

                success(
                  { 
                    value       : value1.value < value2.value ? 1 : 0,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "long" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setSize("long");
        success();
        break;

      case "mod" :
        /*
         * mod :
         *   0 : multiplicative_expression
         *   1 : cast_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Complete the operation, coercing to the appropriate type
                specAndDecl =
                  this.__coerce(value1.specAndDecl, 
                                value2.specAndDecl,
                                "mod (%)");

                // Ensure we ended up with an int. Can't do this op otherwise.
                if (specAndDecl[0].getType() != "int")
                {
                  failure(
                    new playground.c.lib.RuntimeError(
                      this,
                      "Operation requires two integer values."));
                  return;
                }

                success(
                  { 
                    value       : value1.value % value2.value,
                    specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal % newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      case "multiply" :
        /*
         * multiply :
         *   0 : multiplicative_expression
         *   1 : cast_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Complete the operation, coercing to the appropriate type
                specAndDecl =
                  this.__coerce(value1.specAndDecl, 
                                value2.specAndDecl,
                                "multiply (*)");
                f = specAndDecl[0].getType() == "int" 
                      ? Math.floor 
                      : function (n) { return n; };
                success(
                  { 
                    value       : f(value1.value * value2.value),
                    specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal * newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      case "negative" :
        /*
         * negative :
         *   0 : unary_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the unary expression
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            // Complete the operation
            success(
              { 
                value       : - value1.value,
                specAndDecl : value1.specAndDecl
              });
          }.bind(this),
          failure);
        break;

      case "not" :
        /*
         * not :
         *   0 : unary_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the unary expression
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            // Create a specifier for the value
            specOrDecl = new playground.c.lib.Specifier(this, "int");

            // Complete the operation
            success(
              { 
                value       : ! value1.value,
                specAndDecl : [ specOrDecl ]
              });
          }.bind(this),
          failure);
        break;

      case "not-equal" :
        /*
         * not-equal :
         *   0 : equality_expression
         *   1 : relational_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = new playground.c.lib.Specifier(this, "int");

                // Complete the operation, coercing to the appropriate type
                success(
                  { 
                    value       : value1.value !== value2.value ? 1 : 0,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "or" :
        /*
         * or :
         *   0 : logical_or_expression
         *   1 : logical_and_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = new playground.c.lib.Specifier(this, "int");

                success(
                  { 
                    value       : value1.value || value2.value ? 1 : 0,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "parameter_declaration" :
        /*
         * parameter_declaration
         *   0: declaration_specifiers
         *   1: declarator?
         *   2: abstract_declarator?
         */

        // Save information that we might overwrite
        oldId = data.id;
        oldSpecifiers = data.specifiers;
        oldSpecAndDecl = data.specAndDecl;

        // Update the data object with a new specifier for this declaration
        data.id = "parameter_declaration";
        data.specifiers = new playground.c.lib.Specifier(this);
        data.specAndDecl = [];

        // Process the specifiers
        this.children[0].process(
          data,
          bExecuting,
          function()
          {
            // Process the declarator
            this.children[1].process(
              data,
              bExecuting,
              function()
              {
                // Process the abstract_declarator
                this.children[2].process(
                  data,
                  bExecuting,
                  function()
                  {
                    if (! bExecuting)
                    {
                      // Add the specifier to the end of the
                      // specifier/declarator list
                      data.specAndDecl.push(data.specifiers);

                      // If it's not a void parameter list...
                      if (data.entry)
                      {
                        // Calculate the symbol offset required for this
                        // symbol table entry, based on the now-complete
                        // specifiers and declarators
                        data.entry.calculateOffset();
                      }
                    }
                    
                    // Restore data object members that we'd saved
                    data.id = oldId;
                    data.specifiers = oldSpecifiers;
                    data.specAndDecl = oldSpecAndDecl;

                    success();
                  }.bind(this),
                  failure);
              }.bind(this),
              function(e)
                {
                  failure(e);
                });
          }.bind(this),
          function(e)
          {
            failure(e);
          });
        break;

      case "parameter_list" :
        /*
         * parameter_list
         *   0: parameter_declaration
         *   ...
         *   n: ellipsis?
         */
        
        // Save the current parameter flag (for later possible addition of
        // nexted functions)
        bOldIsParameter = data.bIsParameter;
        data.bIsParameter = true;

        this.__processSubnodes(
          data,
          bExecuting,
          function()
          {
            data.bIsParameter = bOldIsParameter;
            success();
          }.bind(this),
          failure);
        break;

      case "pointer" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specAndDecl)
        {
          success();
          break;
        }
        
        // Add a pointer declarator for this symbol
        declarator = new playground.c.lib.Declarator(this);
        declarator.setType("pointer");
        data.specAndDecl.push(declarator);
        
        // Process additional pointers
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "positive" :
        /*
         * positive :
         *   0 : unary_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the unary expression
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);
            success(value1);
          }.bind(this),
          failure);
        break;

      case "post_decrement_op" :
        /*
         * post_decrement_op
         *   0: unary_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal - newVal;
                            },
                            true,
                            success,
                            failure,
                            true,
                            true);
        break;

      case "primary_expression" :
        /*
         * primary_expression
         *   0: primary_expression |
         *      array_expression | 
         *      structure_reference |
         *      pointer_access
         *   ...
         */
        this.children[0].process(data, bExecuting, success, failure);
        break;

      case "post_increment_op" :
        /*
         * post_increment_op
         *   0: unary_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal + newVal;
                            },
                            true,
                            success,
                            failure,
                            true,
                            true);
        break;

      case "pre_decrement_op" :
        /*
         * pre_decrement_op
         *   0: unary_expression
         */
        
        // Only applicable when executing
        if (! bExecuting)
        {
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal - newVal;
                            },
                            true,
                            success,
                            failure,
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal + newVal;
                            },
                            true,
                            success,
                            failure,
                            true,
                            false);
        break;

      case "register" :
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        data.specifiers.setStorage("register");
        success();
        break;

      case "return" :
        /*
         * return :
         *   0 : expression
         */
        if (! bExecuting)
        {
          success();
        }
        else
        {
          // Process the return expression
          this.children[0].process(
            data,
            bExecuting,
            function(v)
            {
              value3 = v;
              
              // Was there a return expression?
              if (typeof value3 != "undefined")
              {
                // Retrieve the expression value
                value3 = this.getExpressionValue(value3, data);

                // Return via throwing an error, to unwrap intervening call
                // frames. This isn't really a failure.
                failure(new playground.c.lib.Return(this, value3));
              }
              else
              {
                // There was no return expression. Use 127.
                // Create a specifier for the value
                specOrDecl = 
                  new playground.c.lib.Specifier(this,
                                                 "int", "char", "unsigned");
                value3 =
                  {
                    value       : 127,
                    specAndDecl : [ specOrDecl ]
                  };

                // Return via throwing an error, to unwrap intervening call
                // frames. This isn't really a failure.
                failure(new playground.c.lib.Return(this, value3));
              }
            }.bind(this),
            failure);
        }
        break;

      case "right-shift" :
        /*
         * right-shift :
         *   0 : shift_expression
         *   1 : additive_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                value2 = this.getExpressionValue(v, data);

                // Create a specifier for the value
                specOrDecl = 
                  new playground.c.lib.Specifier(this, "int", "unsigned");

                success(
                  { 
                    value       : value1.value >> value2.value,
                    specAndDecl : [ specOrDecl ]
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal >> newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      case "short" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setSize("short");
        success();
        break;

      case "signed" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setSigned("signed");
        success();
        break;

      case "sizeof" :
        // Save data members that get overwritten
        oldEntry = data.entry;
        
        // Initialize data.entry to null. If it's non-null upon return,
        // they're taking the size of a variable; otherwise, they want the
        // size of a type.
        data.entry = null;

        // Process the subnodes to discover what to take the size of
        this.__processSubnodes(
          data,
          bExecuting,
          function(v)
          {
            var             byteCount;

            // Did we get a symbol table entry? When executing, the symbol
            // table entry will be in v. When not executing, it will be in
            // data.entry.
            if (data.entry || v instanceof playground.c.lib.SymtabEntry)
            {
              // Yup. Get the specifier/declarator list from that entry
              specAndDecl = (v || data.entry).getSpecAndDecl().slice(0);
              
              // Determine and return the size of an object with this
              // specifier/declarator list.
              byteCount = specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
              
              // We'll be returning value3, so save the byte count there.
              value3 = { value : byteCount };
            }
            else
            {
              // Otherwise, this was a 'type_name'. We have a map containing
              // specAndDecl and a pre-calculated size. All we care about is
              // the size.
              value3 = { value : v.size };
            }

            // The return value is an int
            value3.specAndDecl = [ new playground.c.lib.Specifier("int") ];
            
            // Restore prior data member values
            data.entry = oldEntry;
            
            success(value3);
          },
          failure);
        break;

      case "specifier_qualifier_list" :
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "statement_list" :
        /*
         * statement_list
         *   0: statement
         *   ...
         */

        // We're finished with declarations. Ensure that symbols don't get
        // defined in "identifier". First, save current data members
        oldEntry = data.entry;
        oldSpecifiers = data.specifiers;
        oldSpecAndDecl = data.specAndDecl;
        
        // Now overwrite (delete) them
        delete data.entry;
        delete data.specifiers;
        delete data.specAndDecl;

        this.__processSubnodes(
          data,
          bExecuting,
          function()
          {
            // Restore overwritten data members
            data.entry = oldEntry;
            data.specifiers = oldSpecifiers;
            data.specAndDecl = oldSpecAndDecl;

            success();
          }.bind(this),
          failure);
        break;

      case "static" :
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        data.specifiers.setStorage("static");
        success();
        break;

      case "string_literal" :
        // Have we already allocated space for this string?
        if (! this._mem)
        {
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
        
        // Create an initially-empty specifier/declarator list
        specAndDecl = [];

        // Create a declarator to indicate that it's a pointer, and add it to
        // the specifier/declarator list
        specAndDecl.push(new playground.c.lib.Declarator(this, "pointer"));

        // Create a specifier to indicate that it's a char *
        specAndDecl.push(new playground.c.lib.Specifier(this, "int", "char"));

        // Return the pointer to the string in global memory
        success(
          {
            value       : this._mem, 
            specAndDecl : specAndDecl
          });
        break;

      case "struct" :
        /*
         * struct
         *   0 : struct_declaration_list
         *   1 : identifier
         */

        // structures, unions, and enums are handled nearly identically, here.
        function case_struct_union_enum(sueType)
        {
          // Only applicable before executing and when in a declaration
          if (bExecuting &&
              ! data.specifiers &&
              sueType != StructUnionEnum.Enum)
          {
            success();
            return;
          }

          switch(sueType)
          {
          case StructUnionEnum.Struct :
            data.specifiers.setType("struct");
            break;
            
          case StructUnionEnum.Union :
            data.specifiers.setType("union");
            break;
            
          case StructUnionEnum.Enum :
            data.specifiers.setType("enum");
            break;
          }

          if (data.specifiers.getStorage() != "typedef")
          {
            data.specifiers.setStorage("extern");
          }

          // Save information that we might overwrite
          oldEntry = data.entry;
          oldSpecAndDecl = data.specAndDecl;
          oldIsUnion = data.bIsUnion;

          data.entry = null;
          data.specAndDecl = [];
          data.structSymtab = null;
          data.bIsUnion = (sueType === StructUnionEnum.Union);

          // Process the identifier
          this.children[1].process(
            data,
            bExecuting,
            function(v)
            {
              var             bNeedPopStack = false;
              var             name;

              // When executing, we are given the entry.
              data.entry = data.entry || v;

              // Retrieve or create the symbol table for this struct's,
              // union's, or enum's members
              entry = 
                playground.c.lib.Symtab.getCurrent().get(data.entry.getName());

              // Did it exist?
              if (entry)
              {
                // Yup. Retrieve the struct/union/enum symbol table from it
                symtab = entry.getStructSymtab();

                // If we still didn't find a struct/union/enum symbol table...
                if (! symtab)
                {
                  // ... then create it.
                  symtab = new playground.c.lib.Symtab(
                    playground.c.lib.Symtab.getCurrent(),
                    data.entry.getName(),
                    this.line);

                  // Save the symbol table with the entry for this
                  // struct/union/enum name
                  data.entry.setStructSymtab(symtab);

                }
                else
                {
                  // Push the existing symbol table onto the symbol table stack
                  playground.c.lib.Symtab.pushStack(symtab);
                }

                // If there is a struct_declaration_list or enumerator list
                // here, then the symbol table had better be empty.
                if (this.children[0].type != "_null_" && 
                    symtab.getNumSymbols() != 0)
                {
                  // Get the structure name without the prefixed "struct#"
                  name = data.entry.getName().replace(/^struct#/, "");

                  failure(new playground.c.lib.RuntimeError(
                            this,
                            "Redeclaration of struct/union/enum " + name));
                  return;
                }
              }
              else
              {
                // It didn't exist. Create it.
                symtab = new playground.c.lib.Symtab(
                  playground.c.lib.Symtab.getCurrent(),
                  data.entry.getName(),
                  this.line);

                // Save the symbol table with the entry for this
                // struct/union/enum name
                data.entry.setStructSymtab(symtab);
              }

              // If we have a symbol table, we'll need to pop it later
              // Enum values, however, don't get added to that symbol table
              // (at present)
              if (sueType == StructUnionEnum.Enum)
              {
                playground.c.lib.Symtab.popStack();
              }
              else if (symtab)
              {
                bNeedPopStack = true;
              }

              // Save this symbol table to store it with variables of this type
              data.structSymtab = symtab;
              data.specifiers.setStructSymtab(symtab);

              // Process the struct_declaration_list or enumerator_list
              this.children[0].process(
                data,
                bExecuting,
                function()
                {
                  // Add the specifiers to the specifier/declarator list
                  data.specAndDecl.push(data.specifiers);

                  // If this is a union...
                  if (sueType === StructUnionEnum.Union)
                  {
                    // ... then calculate the size of the union
                    symtab.calculateUnionSize();
                  }

                  // Restore overwritten data members
                  data.entry = oldEntry;
                  data.specAndDecl = oldSpecAndDecl;
                  data.bIsUnion = oldIsUnion;

                  // Revert to the prior scope, if we'd somehow pushed a symbol
                  // table (either creating a new one, or manually pushing it).
                  if (bNeedPopStack)
                  {
                    playground.c.lib.Symtab.popStack();
                  }

                  success();
                }.bind(this),
                failure);
            }.bind(this),
            failure);
        }

        case_struct_union_enum.bind(this)(StructUnionEnum.Struct);
        break;

      case "struct_declaration" :
        /*
         * struct_declaration
         *   0: specifier_qualifier_list
         *   1: struct_declarator_list
         */

        // Save data members which we'll overwrite
        oldId = data.id;
        oldEntry = data.entry;
        oldSpecifiers = data.specifiers;
        oldSpecAndDecl = data.specAndDecl;
        oldStructSymtab = data.structSymtab;

        // Create our own data object with a new specifier for this declaration.
        // These specifiers are added in case struct_declarator
        data.id = "struct_declaration";
        data.specifiers = new playground.c.lib.Specifier(this);
        data.specAndDecl = [];

        // Process the specifiers
        this.children[0].process(
          data,
          bExecuting,
          function()
          {
            // Process the declarators
            this.children[1].process(
              data, 
              bExecuting,
              function()
              {
                // Restore data members
                data.id = oldId;
                data.entry = oldEntry;
                data.specifiers = oldSpecifiers;
                data.specAndDecl = oldSpecAndDecl;
                data.structSymtab = oldStructSymtab;
                success();
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "struct_declaration_list" :
        /*
         * struct_declaration_list
         *   0: struct_declaration
         *   ...
         */
        
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "struct_declarator" :
        /*
         * struct_declarator
         *   0: declarator?
         *   1: constant_expression (bitfield)
         */

        if (this.children[1].type != "_null_")
        {
          failure(new playground.c.lib.RuntimeError(
                    this,
                    "Structure bit fields are not supported."));
          return;
        }

        this.__processSubnodes(
          data,
          bExecuting,
          function()
          {
            if (data.entry)
            {
              // Append the specifiers to the specifier/declarator list
              specAndDecl = data.entry.getSpecAndDecl();
              specAndDecl.push(data.specifiers);
              data.entry.setSpecAndDecl(specAndDecl);

              // Calculate the offset in the symbol table for this symbol
              // table entry, based on the now-complete specifiers and
              // declarators.
              data.entry.calculateOffset(data.bIsUnion);
            }

            success();
          },
          failure);
        break;

      case "struct_declarator_list" :
        /*
         * struct_declarator_list
         *   0: struct_declarator
         *   ...
         */
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "structure_reference" :
        /*
         * structure_reference
         *   0: postfix_expression | dereference
         *   1: identifier
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // Get the address of the structure or union variable or expression
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            var             symtab;

            value1 = v;
            
            // If we got a symbol, retrieve its address. Otherwise, we already
            // have an address.
            if (value1 instanceof playground.c.lib.SymtabEntry)
            {
              value1 =
                {
                  specAndDecl : v.getSpecAndDecl(),
                  value       : v.getAddr()
                };
            }

            // Get the symbol table of the struct/union members. It's in the
            // specifier.
            specAndDecl = value1.specAndDecl[value1.specAndDecl.length - 1];
            symtab = specAndDecl.getStructSymtab();
            
            // Push the struct symbol table onto the symtab stack
            playground.c.lib.Symtab.pushStack(symtab);

            // Process the struct/union member
            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                // We're finished with use of the structure symbol table. Pop
                // it off of the symtab stack.
                playground.c.lib.Symtab.popStack();

                // We must have received a symtab entry.
                if (! (v instanceof playground.c.lib.SymtabEntry))
                {
                  failure(new playground.c.lib.RuntimeError(
                            this,
                            "A structure or union reference must have a " +
                            "member name to the right of the dot."));
                  return;
                }

                // The entry must be in the struct/union symtab
                if (v.getSymtab() != symtab)
                {
                  failure(new playground.c.lib.RuntimeError(
                            this,
                            "Unrecognized struct or union member: " +
                            v.getName()));
                  return;
                }

                // Get this member's offset from the beginning of the struct,
                // and add it to the previously-determined address.
                value1.value += v.getOffset();
                value1.specAndDecl = v.getSpecAndDecl();
                
                // We're providing the address of this member. Indicate such.
                // Prepend an "address" declarator if there isn't already one
                // at the beginning of the specifier/declarator list
                specOrDecl = value1.specAndDecl[0];
                if (! (specOrDecl instanceof playground.c.lib.Declarator) ||
                    specAndDecl.getType() != "address")
                {
                  value1.specAndDecl.unshift(
                    new playground.c.lib.Declarator(this, "address"));
                }

                success(value1);
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        break;

      case "subtract" :
        /*
         * subtract :
         *   0 : additive_expression
         *   1 : multiplicative_expression
         */
        if (! bExecuting)
        {
          success();
          break;
        }

        // We're executing. Get the value of the left and right expressions
        this.children[0].process(
          data, 
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);

            this.children[1].process(
              data,
              bExecuting,
              function(v)
              {
                var             byteCount;

                value2 = this.getExpressionValue(v, data);

                // If the first value is a pointer and the second is a
                // specifier, ...
                if ((value1.specAndDecl[0].getType() == "pointer" ||
                     value1.specAndDecl[0].getType() == "array") &&
                    value2.specAndDecl[0] .getType() == "int")
                {
                  // ... then figure out the size of what's pointed to
                  specAndDecl = value1.specAndDecl.slice(1);
                  byteCount =
                    specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
                  
                  // Add the size of a pointed-to item to the pointer address
                  value1.value -= value2.value * byteCount;

                  success(
                    { 
                      value       : value1.value,
                      specAndDecl : value1.specAndDecl.slice(0)
                    });
                  
                  return;
                }

                // If the second value is a pointer and the first is a
                // specifier, ...
                if ((value2.specAndDecl[0].getType() == "pointer" ||
                     value2.specAndDecl[0].getType() == "array") &&
                    value1.specAndDecl[0] .getType() == "int")
                {
                  // ... then figure out the size of what's pointed to
                  specAndDecl = value2.specAndDecl.slice(1);
                  byteCount =
                    specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
                  
                  // Add the size of a pointed-to item to the pointer address
                  value2.value -= value1.value * byteCount;

                  success(
                    { 
                      value       : value2.value,
                      specAndDecl : value2.specAndDecl.slice(0)
                    });
                  
                  return;
                }

                // Complete the operation, coercing to the appropriate type
                specAndDecl = 
                  this.__coerce(value1.specAndDecl, 
                                value2.specAndDecl,
                                "subtraction (-)");
                f = specAndDecl[0].getType() == "int" 
                      ? Math.floor 
                      : function (n) { return n; };

                success(
                  { 
                    value       : f(value1.value - value2.value),
                    specAndDecl : specAndDecl
                  });
              }.bind(this),
              failure);
          }.bind(this),
          failure);
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal - newVal;
                            },
                            true,
                            success,
                            failure);
        break;

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
            throw new Error("Internal error: expected statement list");
          }
          
          // Process the compound statement.
          this.children[1].process(data, bExecuting, success, failure);
          return;
        }

        this._tryIt(
          // try
          function(succ, fail)
          {
            // Save current symbol table so we know where to pop to upon
            // return
            symtab = playground.c.lib.Symtab.getCurrent();

            // Evaluate the expression on which we will switch
            this.children[0].process(
              data,
              bExecuting,
              function(v)
              {
                var             i;

                value1 = this.getExpressionValue(v, data);

                // Get a reference to the statement list
                subnode = this.children[1].children[1];

                // If we haven't evaluated case expressions yet...
                if (! subnode.cases)
                {
                  // ... then create a map of case expression values
                  subnode.cases = {};
                  subnode.caseAndBreak = [];

                  // Run through each case and evaluate it.
                  if (subnode.children.length > 0)
                  {
                    i = 0;
                    (function(child)
                     {
                       var             map;
                       var             value;
                       var             fSelf = arguments.callee;

                       // Is this a case label?
                       if (child.type == "case")
                       {
                         // Yup. Throw an error if the case expression is not
                         // constant
                         data.constantOnly = "case";

                         // Get its expression value. It (child 0) becomes the
                         // key in the cases map, and child 1, the statement,
                         // becomes the value of that key in the cases map.
                         child.children[0].process(
                           data,
                           bExecuting,
                           function(v)
                           {
                             value = this.getExpressionValue(v, data).value;

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
                                 next  : i + 1
                               };
                             subnode.cases[value] = map;
                             subnode.caseAndBreak.push(map);

                             // Stop testing for constant expressions
                             delete data.constantOnly;

                             ++i;
                             if (i < subnode.children.length)
                             {
                               fSelf.bind(this)(subnode.children[i]);
                             }
                             else
                             {
                               switch_find_case.bind(this)();
                             }
                           }.bind(this),
                           fail);
                         
                         return;
                       }

                       if (child.type == "default")
                       {
                         // Did we already find a default?
                         if (subnode.cases["default"])
                         {
                           // Yup. This is an error.
                           this.error("Found multiple 'default' labels " +
                                      "in 'switch'",
                                      true);
                           return;     // not reached
                         }

                         // Add this default's node to the cases map
                         map =
                           {
                             order : subnode.caseAndBreak.length,
                             next  : i + 1
                           };
                         subnode.cases["default"] = map;
                         subnode.caseAndBreak.push(map);
                       }
                       else if (child.type == "break")
                       {
                         // Do not add break to the cases map, but do add it to
                         // the caseAndBreak array.
                         map =
                           {
                             order : subnode.caseAndBreak.length,
                             node  : child
                           };
                         subnode.caseAndBreak.push(map);
                       }

                       ++i;
                       if (i < subnode.children.length)
                       {
                         fSelf.bind(this)(subnode.children[i]);
                       }
                       else
                       {
                         switch_find_case.bind(this)();
                       }
                     }).bind(this)(subnode.children[i]);
                  }
                }
                else
                {
                  switch_find_case.bind(this)();
                }

                function switch_find_case()
                {
                  var             i;
                  var             thisCase;

                  // Get map of nodes for each case
                  cases = subnode.cases;
                  caseAndBreak = subnode.caseAndBreak;
                  thisCase = cases[value1.value] || cases["default"];

                  // Did we find a case to execute?
                  if (typeof thisCase != "undefined")
                  {
                    // Yup. Process it and all following nodes (until a break is
                    // hit)
                    i = thisCase.next;
                    (function()
                     {
                       var             fSelf = arguments.callee;

                       // If this is a case or default statement, skip it
                       if (subnode.children[i].type == "case" ||
                           subnode.children[i].type == "default")
                       {
                         if (++i < subnode.children.length)
                         {
                           fSelf.bind(this)();
                         }
                         else
                         {
                           success();
                         }
                       }
                       else
                       {
                         subnode.children[i].process(
                           data,
                           bExecuting,
                           function()
                           {
                             if (++i < subnode.children.length)
                             {
                               fSelf.bind(this)();
                             }
                             else
                             {
                               success();
                             }
                           }.bind(this),
                           fail);
                       }
                     }).bind(this)();
                  }
                  else
                  {
                    console.log("Case not found in switch: " + value1.value);
                    success();
                  }
                }
              }.bind(this),
              fail);
          }.bind(this),
        
          // catch
          function(error, succ, fail)
          {
            // was a break statement executed?
            if (error instanceof playground.c.lib.Break)
            {
              // Yup. Retore symbol table to where it was when we entered the
              // statement from which we are breaking
              while (playground.c.lib.Symtab.getCurrent() != symtab)
              {
                playground.c.lib.Symtab.popStack();
              }
              
              succ();
            }
            else
            {
              // It's not a break. Re-throw the error
              this._throwIt(error, succ, fail);
            }
          }.bind(this),
          
          success,
          failure);
        break;

      case "translation_unit" :
        /*
         * translation_unit
         *   0: external_declaration
         *   ...
         */
        
        // Process all subnodes
        this.__processSubnodes(data, bExecuting, success, failure);
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
          success();
          break;
        }

        // Retrieve and evaluate the logical expression from child 0
        this.children[0].process(
          data,
          bExecuting,
          function(v)
          {
            value1 = this.getExpressionValue(v, data);
            
            // If it's true, return the value of child 1
            if (value1.value)
            {
              this.children[1].process(data, bExecuting, success, failure);
            }
            else
            {
              this.children[2].process(data, bExecuting, success, failure);
            }
          }.bind(this),
          failure);
        break;

      case "typedef" :
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        data.specifiers.setStorage("typedef");
        success();
        break;

      case "type_name" :
        /*
         * type_name
         *   0: specifier_qualifier_list
         *   1: abstract_declarator?
         *
         * This node type is used only for sizeof and cast, so generates a map
         * containing the specifier/declarator list, and the size of an object
         * of this type. That information is static -- it can not change
         * during the course of execution, so the map is cached as this.data,
         * in case this node is traversed again. (Parent nodes may choose to
         * copy that map, too.)
         */

        // Have we already generated the specifier/declarator list and size?
        if (this.data)
        {
          // Yup. Nothing to do.
          success(this.data);
          break;
        }

        // save data elements before overwriting them
        oldId = data.id;
        oldSpecifiers = data.specifiers;
        oldSpecAndDecl = data.specAndDecl;

        // Create our own data object with a new specifier for this declaration
        data.id = "type_name";
        data.specifiers = new playground.c.lib.Specifier(this);
        data.specAndDecl = [];

        // Process the specifier_qualifier_list
        this.children[0].process(
          data,
          bExecuting,
          function()
          {
            // Process the declarators
            this.children[1].process(
              data,
              bExecuting,
              function()
              {
                // Add the specifier to the end of the specifier/declarator
                // list
                specAndDecl = data.specAndDecl;
                specAndDecl.push(data.specifiers);

                this.data =
                  {
                    specAndDecl : specAndDecl,
                    size        : specAndDecl[0].calculateByteCount(1,
                                                                    specAndDecl,
                                                                    0)
                  };

                // Restore data elements
                data.id = oldId;
                data.specifiers = oldSpecifiers;
                data.specAndDecl = oldSpecAndDecl;

                success(this.data);
              }.bind(this),
              failure);
          }.bind(this),
          failure);
        
        break;

      case "type_name_token" :
        // Retrieve the entry for this type name
        entry = playground.c.lib.Symtab.getCurrent().get(this.value, false);

        // Get a clone of the specifier/declarator list
        specAndDecl = entry.getSpecAndDecl().slice(0);
        
        // Get a reference to the trailing specifier
        specOrDecl = specAndDecl.pop();
        
        // Clone its type, size, and signedness
        data.specifiers = specOrDecl.cloneTypedef();
        
        // Save the remainder of the type's specifier/declarator list
        data.specAndDecl = specAndDecl;

        // If there's a structure symbol table, we need it too.
        data.structSymtab = entry.getStructSymtab();

        success();

        break;

      case "type_qualifier_list" :
        this.__processSubnodes(data, bExecuting, success, failure);
        break;

      case "union" :
        // Treat union almost identically to struct. The differences are
        // handled in the function that deals with structures.
        case_struct_union_enum.bind(this)(StructUnionEnum.Union);
        break;

      case "unsigned" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setSigned("unsigned");
        success();
        break;

      case "void" :
        // Only applicable before executing and when in a declaration
        if (bExecuting && ! data.specifiers)
        {
          success();
          break;
        }
        
        data.specifiers.setType("void");
        success();
        break;

      case "volatile" :
        // Only applicable before executing
        if (bExecuting)
        {
          success();
          break;
        }
        
        data.specifiers.setVolatile("volatile");
        success();
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
          success();
          break;
        }

        // Assign the new value
        this.__assignHelper(data, 
                            function(oldVal, newVal)
                            {
                              return oldVal ^ newVal;
                            },
                            true,
                            success,
                            failure);
        break;

      default:
        console.log("Unexpected node type: " + this.type);
        failure(new Error("Unexpected node type: " + this.type));
        break;
      }
    },


    /**
     * Process all sub-nodes of a node (which are non-null)
     */
    __processSubnodes : function(data, bExecuting, success, failure, startWith)
    {
      var             i;

      if (! success || ! failure)
      {
        throw new Error("Missing success/failure functions");
      }

      if (this.children.length > 0)
      {
        i = startWith || 0;
        this.children[i].process(
          data,
          bExecuting,
          function(ret)
          {
            if (++i < this.children.length)
            {
              this.children[i].process(
                data,
                bExecuting,
                arguments.callee.bind(this),
                failure);
            }
            else
            {
              success(ret);
            }
          }.bind(this),
          failure);
      }
      else
      {
        success();
      }
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
     * @param bUseOld {Boolean}
     *   true if the old value of the right-hand side is used;
     *   false if it is not used
     * 
     * @param success {Function}
     *   Function to call upon successful completion of this call
     * 
     * @param failure {Function}
     *   Function to call upon failed completion of this call
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
    __assignHelper : function(data, fOp, bUseOld, 
                              success, failure, bUnary, bPostOp)
    {
      var             i;
      var             type;
      var             value;
      var             value1;
      var             value3;
      var             addr;
      var             str;
      var             size;
      var             initializerList;
      var             specOrDecl;
      var             specAndDecl;
      var             bFirst;

      // Retrieve the lvalue
      this.children[0].process(
        data,
        true,
        function(v)
        {
          // If it was a symbol table entry...
          if (! (v instanceof playground.c.lib.SymtabEntry) &&
              v.specAndDecl[0].getType() != "address")
          {
            this.error("The left hand side of an assignment must be " +
                       "a variable, pointer dereference, " +
                       "or array element reference");
            success();
            return;
          }

          // Retrieve the value
          value1 = this.getExpressionValue(v, data, true);

          // Get a shallow copy of the specifier/declarator list
          specAndDecl = value1.specAndDecl.slice(0);

          // Only loop a maximum of one time
          bFirst = true;

          do
          {
            // Get the first specifier/declarator
            specOrDecl = specAndDecl[0];

            // Determine the memory type to use for saving the value
            switch(specOrDecl.getType())
            {
            case "pointer" :
            case "function" :
              type = "pointer";
              break;

            case "array" :
            case "address" :
              // Find out the type based on the next specifier/declarator
              if (bFirst)
              {
                bFirst = false;
                specAndDecl.shift();
                continue;
              }

              // There were two "address" declarators in a row. It's a pointer.
              type = "pointer";
              break;

            default :
              if (specOrDecl instanceof playground.c.lib.Specifier)
              {
                type = specOrDecl.getCType();
              }
              else
              {
                throw new Error("Internal error: unexpected type: " + 
                                specOrDecl.getType());
              }
              break;
            }

            // Normal exit from the loop
            break;
          } while (true);

          // Get a copy of the original specifier/declarator list again
          specAndDecl = value1.specAndDecl.slice(0);

          // Retrieve the current value
          if (type != "struct" && type != "union" && type != "enum")
          {
            value =
              playground.c.lib.Node.__mem.get(value1.value, type, bUseOld);
          }

          // Determine the value to assign there. If it's a unary operator
          // (pre/post increment/decrement), then use the retrieved
          // value. Otherwise, get the value from the rhs of the expression.
          if (bUnary)
          {
            // If the value being assigned to is a pointer...
            if (value1.specAndDecl[0].getType() == "pointer")
            {
              // ... then figure out the size of what's pointed to
              specAndDecl = value1.specAndDecl.slice(1);
              size = specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
            }

            value3 = 
              { 
                value       : 1, 
                specAndDecl : [ new playground.c.lib.Specifier("int") ]
              };
            
            saveAndReturn.bind(this)(success);
            return;
          }
          
          // Not unary. See if we're handling an initializer list
          if (this.children[1].type == "initializer_list")
          {
            initializerList = this.children[1].children;

            // Ensure the lvalue is a non-scalar if more than one initializer
            if (initializerList.length > 1)
            {
              // FIXME: implement this test.
            }

            // Ensure there are no more initializers than a fixed array length
            if (((! (specAndDecl[0] instanceof playground.c.lib.Declarator) &&
                  initializerList.length > 1)) ||
                ((specAndDecl[0] instanceof playground.c.lib.Declarator &&
                  initializerList.length > specAndDecl[0].getArrayCount())))
            {
              // FIXME: implement this
              failure(
                new playground.c.lib.RuntimeError(
                  this,
                  "Array size is " + specAndDecl[0].getArrayCount() + ", " +
                  "initializer length is " + 
                  initializerList.length +
                  ". Initializers do not fit in array."));
              return;
            }

            if (initializerList.length > 0)
            {
              i = 0;
              initializerList[i].process(
                data,
                true,
                function(v)
                {
                  var             fSelf = arguments.callee;

                  initializeValue.call(
                    this,
                    function()
                    {
                      if (++i < initializerList.length)
                      {
                        initializerList[i].process(
                          data,
                          true,
                          fSelf.bind(this),
                          failure);
                      }
                      else
                      {
                        success();
                      }
                    }.bind(this),
                    v);
                }.bind(this),
                failure);
            }
            else
            {
              success();
            }
            
            return;
          }

          // See if we're initializing a char array from a character string
          if (v instanceof playground.c.lib.SymtabEntry &&
              v.getSpecAndDecl().length == 2 &&
              v.getSpecAndDecl() &&
              (specOrDecl = v.getSpecAndDecl()[0]) &&
              specOrDecl.getType() == "array" &&
              (specOrDecl = v.getSpecAndDecl()[1]) &&
              specOrDecl.getType() == "int" &&
              specOrDecl.getSize() == "char" &&
              this.children[1].children.length == 1 &&
              this.children[1].children[0].type == "string_literal")
          {
            // We are. Copy the string in to the array address.
            // Get a reference to the string, for faster reference
            str = this.children[1].children[0].value;

            // If we're initializing an array and the initializer is too long...
            specOrDecl = v.getSpecAndDecl()[0];
            if (specOrDecl.getType() == "array" &&
                str.length > specOrDecl.getArrayCount())
            {
              // ... then generate a run-time error
              failure(
                new playground.c.lib.RuntimeError(
                  this,
                  "Array size is " + specOrDecl.getArrayCount() + ", " +
                  "initializer length (including null terminator) is " + 
                  (str.length + 1) +
                  ". Initializers do not fit in array."));
              return;
            }
            
            // Copy the string to memory
            addr = v.getAddr();
            str.split("").forEach(
              function(c, i)
              {
                playground.c.lib.Node.__mem.set(addr + i, 
                                                "char", 
                                                c.charCodeAt(0));
              });

            // Null terminate the string
            playground.c.lib.Node.__mem.set(addr + str.length, "char", 0);
            success();
            return;
          }

          // No initializer list
          this.children[1].process(
            data,
            true,
            initializeValue.bind(this, success),
            failure);
          return;

          // ----------------------------------------------------------- //
          // utility functions
          // ----------------------------------------------------------- //

          function initializeValue(succ, v)
          {
            var             specAndDecl;

            if (typeof v != "undefined")
            {
              value3 = this.getExpressionValue(v, data);

              // If the value being assigned to is a pointer and the
              // RHS's type is some sort of int...
              if ((value1.specAndDecl[0].getType() == "pointer" ||
                   value1.specAndDecl[0].getType() == "array"))
              {
                // ... then figure out the size of what's pointed to
                specAndDecl = value1.specAndDecl.slice(1);
                size = specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
              }
              else
              {
                // otherwise, get the size of the thing itself.
                specAndDecl = value1.specAndDecl.slice(0);
                size = specAndDecl[0].calculateByteCount(1, specAndDecl, 0);
              }

              saveAndReturn.bind(this)(succ);
            }
            else
            {
              succ();
            }
          }
          function saveAndReturn(succ)
          {
            // Ensure they're not writing to a constant
            if (! data.bIsInitializer && 
                value1.specAndDecl[0] instanceof playground.c.lib.Specifier &&
                value1.specAndDecl[0].getConstant() == "constant")
            {
              // They are! Bad programmer! Bad!
              failure(new playground.c.lib.RuntimeError(
                        this,
                        "Can not alter a const variable."));
              return;
            }

            // If this is a write to a structure or union...
            if (type == "struct" || type == "union")
            {
              // then we want to just return its address. First, clone the
              // specifier/declarator list.
              specAndDecl = specAndDecl.slice(0);
              
              // Prepend an "address" declarator"
              specAndDecl.unshift(
                new playground.c.lib.Declarator(this, "address"));

              // Return the address of the struct
              succ(
                {
                  value       : value1.value,
                  specAndDecl : specAndDecl
                });
              
              return;
            }

            // Save the value at its new address
            playground.c.lib.Node.__mem.set(
              value1.value,
              type,
              fOp(value, value3.value));

            // If this is not a post-increment or post-decrement...
            if (! bPostOp)
            {
              // ... then retrieve and return the altered value
              value =
                playground.c.lib.Node.__mem.get(value1.value, type, bUseOld);
            }

            // Clone the specifier/declarator list
            specAndDecl = specAndDecl.slice(0);
            
            // If this is a unary operator on a pointer...
            if (bUnary && value1.specAndDecl[0].getType() == "pointer")
            {
              // ... then prepend an "address" declarator
              specAndDecl.unshift(
                new playground.c.lib.Declarator(this, "address"));
            }

            // Increment the address by the size of this element, in case
            // we're in an initializer list.
            value1.value += size;

            // Retrieve the value and return it
            succ(
              {
                value       : value,
                specAndDecl : specAndDecl.slice(0)
              });
          }

        }.bind(this),
        failure);
    },

    /**
     * Given two original operand types, determine the type to which to coerce
     * both operands.
     *
     * FIXME: This uses an old method of coersion. Newer compilers use the
     * "value" method of integer promotions. See, for example, page 48 of
     * http://www.open-std.org/jtc1/sc22/wg14/www/docs/n1256.pdf
     *
     * @param specAndDecl1 {String}
     *   A specifier/declarator list for the first type to be tested
     *
     * @param specAndDecl2 {String}
     *   A specifier/declarator list for the second type to be tested
     *
     * @param opDescription {String}
     *   Description of the operation for which these types are being
     *   coerced.
     *
     * @return {String}
     *   The C type to which to coerce the operands of an operation between
     *   operands originally of type1 and type2.
     */
    __coerce : function(specAndDecl1, specAndDecl2, opDescription)
    {
      var             spec1;
      var             spec2;
      var             type1;
      var             type2;
      var             sign1;
      var             sign2;
      var             size1;
      var             size2;
      
      spec1 = specAndDecl1[0];
      spec2 = specAndDecl2[0];
      
      // Ensure that we have native types
      if (! (spec1 instanceof playground.c.lib.Specifier) ||
          ! (spec2 instanceof playground.c.lib.Specifier))
      {
        throw new playground.c.lib.RuntimeError(
          this, 
          "Operation [" + opDescription + "] between '" +
            playground.c.lib.SymtabEntry.getInfo(specAndDecl1).description +
            "' and '" +
            playground.c.lib.SymtabEntry.getInfo(specAndDecl2).description +
            "' makes no sense");
      }

      type1 = spec1.getType();
      type2 = spec2.getType();
      sign1 = spec1.getSigned();
      sign2 = spec2.getSigned();
      size1 = spec1.getSize();
      size2 = spec2.getSize();
      
      // Ensure that we got types that can be coerced
      [ type1, type2 ].forEach(
        function(type)
        {
          switch(type)
          {
          case "int" :
          case "float" :
          case "double" :
            break;
            
          default :
            throw new playground.c.lib.RuntimeError(
              this, 
              "Operation [" + opDescription + "] between '" +
                playground.c.lib.SymtabEntry.getInfo(specAndDecl1).description +
                "' and '" +
                playground.c.lib.SymtabEntry.getInfo(specAndDecl2).description +
                "' makes no sense");
          }
        });
      
      // First, test for the common and easy case: both types are already the
      // same.
      if (type1 == type2)
      {
        return specAndDecl1;
      }

      // If one of the operands is double, then coerce to double
      if (type1 == "double")
      {
        return specAndDecl1;
      }
      if (type2 == "double")
      {
        return specAndDecl2;
      }

      // If one of the operands is float, then coerce to float
      if (type1 == "float")
      {
        return specAndDecl1;
      }
      if (type2 == "float")
      {
        return specAndDecl2;
      }

      // If one of the operands is unsigned long long, then coerce to
      // unsigned long long.
      if (type1 == "int" && sign1 == "unsigned" && size1 == "long long")
      {
        return specAndDecl1;
      }
      if (type2 == "int" && sign2 == "unsigned" && size2 == "long long")
      {
        return specAndDecl2;
      }

      // If one of the operands is unsigned long, then coerce to unsigned long.
      if (type1 == "int" && sign1 == "unsigned" && size1 == "long")
      {
        return specAndDecl1;
      }
      if (type2 == "int" && sign2 == "unsigned" && size2 == "long")
      {
        return specAndDecl2;
      }

      // If one of the operands is long, then coerce to long.
      if (type1 == "int" && size1 == "long")
      {
        return specAndDecl1;
      }
      if (type2 == "int" && size2 == "long")
      {
        return specAndDecl2;
      }

      // If one of the operands is unsigned int, then coerce to unsigned int.
      if (type1 == "int" && sign1 == "unsigned" && size1 === null)
      {
        return specAndDecl1;
      }
      if (type2 == "int" && sign2 == "unsigned" && size2 === null)
      {
        return specAndDecl2;
      }

      // In any other case, coerce to int.
      return [ new playground.c.lib.Specifier(this, "int") ];
    },
    
    /**
     * A try/catch facility, written in continuation-passing style.
     * 
     * @param tryBlock {Function}
     *   The 'try' portion
     * 
     * @param catchBlock {Function}
     *   The 'catch' portion
     * 
     * @param success {Function}
     *   Function to call upon successful completion of this call
     * 
     * @param failure {Function}
     *   Function to call upon failed completion of this call
     */
    _tryIt : function(tryBlock, catchBlock, success, failure)
    {
      try
      {
        tryBlock(
          success,
          function(error)
          {
            catchBlock(error, success, failure);
          });
      }
      catch(error)
      {
        catchBlock(error, success, failure);
      }
    },
    
    /**
     * "Throw" an error which may be caught by _tryIt()
     * 
     * @param error {playground.c.lib.RuntimeError}
     *   The error being thrown
     * 
     * @param success {Function}
     *   Function to call upon successful completion of this call
     * 
     * @param failure {Function}
     *   Function to call upon failed completion of this call
     */
    _throwIt : function(error, success, failure)
    {
      failure(error);
    }
  },
  
  defer : function(statics)
  {
    // Retrieve a reference to memory, for easy access
    playground.c.lib.Node.__mem = playground.c.machine.Memory.getInstance();

/*
    // Calculate the maximum recursion count, and use a portion of that for
    // the maximum recursion that we'll allow in our continuation-passing
    // style.
    playground.c.lib.Node._unwindInit =
      (function()
       {
         var             i = 0;
         
         try
         {
           (function()
            {
              ++i;
              arguments.callee();
            })();
         }
         catch(e)
         {
           console.log("e=" + e);
         }
         
         console.log("recursion count: " + i);
         return i / 50;
       })();
*/
    playground.c.lib.Node._unwindInit = 20;

    // Initialize the counter to begin recursion.
    playground.c.lib.Node._unwindCount = playground.c.lib.Node._unwindInit;
  }
});
