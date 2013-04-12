/**
 * Symbol Table Entry's Declarator
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
if (typeof qx === "undefined" && typeof window === "undefined")
{
  qx = require("qooxdoo");
}

qx.Class.define("playground.c.lib.Declarator",
{
  extend : qx.core.Object,
  
  /**
   * Constructor for a new declarator
   * 
   * @param node {playground.c.lib.Node}
   *   The node at which this declarator is created
   * 
   * @param type {String?}
   *   An optional type. If provided, this.setType() is called.
   */
  construct : function(node, type)
  {
    this.base(arguments);
    this.__node = node;
    
    if (type)
    {
      this.setType(type);
    }
  },

  members :
  {
    __node         : null,
    __type         : null,
    __numElem      : null,
    __functionNode : null,
    __builtIn      : null,
    
    /**
     * Set the type of this declarator
     * 
     * @param value {String}
     *   One of:
     *     "array", "function", "pointer", or one of the internally-used 
     *     declarator types: "builtIn" or "address"
     */
    setType : function(value)
    {
      // Ensure we have a valid value
      if ([
            "array", "function", "pointer", "builtIn", "address"
          ].indexOf(value) === -1)
      {
        throw new Error(
          this.__node,
          "Internal error: Unexpected declarator type: " + value);
      }

      // Save the new value
      this.__type = value;
    },

    /**
     * Retrieve the type
     */
    getType : function()
    {
      return this.__type;
    },
    
    /**
     * Set the number of elements in an array
     * 
     * @param numElem {Number}
     *   The number of elements in this array (possibly of arryays)
     */
    setArrayCount : function(numElem)
    {
      // Ensure we have a valid value
      if (typeof numElem != "number" || numElem !== parseInt(numElem, 10))
      {
        throw new Error(
          this.__node,
          "Internal error: Unexpected array size: " + numElem);
      }
      
      // Set this declarator to be an array
      this.setType("array");

      // Save the new value
      this.__numElem = numElem;
    },

    /**
     * Retrieve the count of elements in an array
     */
    getArrayCount : function()
    {
      return this.__numElem;
    },

    /**
     * Set a function's node
     */
    setFunctionNode : function(node)
    {
      // Ensure we have a valid value
      if (! (node instanceof playground.c.lib.Node))
      {
        throw new Error(
          this.__node,
          "Internal error: Unexpected function node: " + node);
      }
      
      this.setType("function");
      
      // Save the new value
      this.__functionNode = node;
    },

    /**
     * Retrieve a function's node
     */
    getFunctionNode : function()
    {
      return this.__functionNode;
    },

    /**
     * Set a builtIn function
     */
    setBuiltIn : function(func)
    {
      // Ensure we have a valid value
      if (! (func instanceof Function))
      {
        throw new Error(
          this.__node,
          "Internal error: Unexpected built-in function: " + func);
      }
      
      this.setType("builtIn");
      
      // Save the new value
      this.__builtIn = func;
    },

    /**
     * Retrieve a built-in function
     */
    getBuiltIn : function()
    {
      return this.__builtIn;
    },

    /**
     * Get the byte account of this declarator.
     * 
     * @param multiplier {Number}
     *   Number of elements of this type to account for in the byte count
     * 
     * @return
     *   The calculated byte count of this declarator type
     */
    calculateByteCount : function(multiplier, specAndDecl, i)
    {
      var             count;

      // Determine the byte count for this type
      switch(this.__type)
      {
      case "array" :
        // An array with an array count multiplies and then calls recursively
        count = this.getArrayCount();
        if (count !== null)
        {
          // This had better not be the last specifier/declarator in the list
          if (specAndDecl.length == i + 1)
          {
            throw new Error("Internal error: " +
                            "unexpected end of specifier/declarator list");
          }
          
          return specAndDecl[i + 1].calculateByteCount(count * multiplier,
                                                       specAndDecl,
                                                       i + 1);
        }
        else
        {
          // We have an array with no count. That makes it a pointer, if it's
          // a parameter, and an error otherwise (which we can't detect from
          // here). Assume it's not an error.
          return playground.c.machine.Memory.typeSize["pointer"] * multiplier;
        }
        break;
        
      case "function" :
      case "pointer" :
      case "builtIn" :
        // Pointers of all types are the same size. Just multiply by previous
        // byte count.
        return playground.c.machine.Memory.typeSize["pointer"] * multiplier;
        break;
        
      default:
        throw new Error("Internal error: unexpected type: " + this.__type);
      }
    },
    
    /**
     * Display this specifier
     */
    display : function()
    {
      var             line = [];
      
      line.push("\tDeclarator at line " + 
                this.__node.line +
                " (" + this.__node + ")");
      line.push("\t    type    : " + JSON.stringify(this.__type));
      switch(this.__type)
      {
      case "array" :
        line.push("\t    numElem : " + JSON.stringify(this.__numElem));
        break;
        
      case "function" :
        line.push("\t    beginning at node : " + this.__functionNode);
        break;
        
      case "pointer" :
        break;
        
      case "builtIn" :
//        line.push("\t    function : " + this.__builtIn);
        break;
      }
      
      console.log(line.join("\n"));
    }
  }
});
