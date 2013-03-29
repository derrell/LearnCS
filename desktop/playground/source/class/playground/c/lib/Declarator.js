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
if (typeof qx === 'undefined')
{
  var qx = require("qooxdoo");
}

qx.Class.define("playground.c.lib.Declarator",
{
  extend : qx.core.Object,
  
  construct : function(node)
  {
    this.base(arguments);
    this.__node = node;
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
     *     "array", "function", "pointer", "builtIn"
     */
    setType : function(value)
    {
      // Ensure we have a valid value
      if ([
            "array", "function", "pointer", "builtIn"
          ].indexOf(value) === -1)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected declarator type: " + value);
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
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected array size: " + numElem);
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
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected function node: " + node);
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
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected built-in function: " + func);
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
