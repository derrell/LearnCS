/**
 * Symbol Table Entry's Specifier
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

qx.Class.define("playground.c.lib.Specifier",
{
  extend : qx.core.Object,
  
  construct : function(node)
  {
    this.base(arguments);
    this.__node = node;
  },

  members :
  {
    __node     : null,
    __storage  : null,
    __type     : null,
    __sign     : null,
    __size     : null,
    __constant : null,
    __volatile : null,

    /**
     * Set the storage
     * 
     * @param value {String}
     *   One of:
     *     "auto", "register", "static", "extern", "typedef"
     */
    setStorage : function(value)
    {
      // Ensure we have a valid value
      if ( [
             "auto", "register", "static", "extern", "typedef"
           ].indexOf(value) === -1)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected storage type: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__storage !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specifiy " + value + 
            " in addition to previously specified " + this.__storage);
      }
      
      // Save the new value
      this.__type = value;
    },

    /**
     * Retrieve the storage
     */
    getStorage : function()
    {
      return this.__storage;
    },

    /**
     * Set the type.
     *
     * @param value {String}
     *   One of:
     *     "int",  "float",  "double", "char", 
     *     "void", "struct", "union",  "enum", 
     *     "label"
     */
    setType : function(value)
    {
      // Ensure we have a valid value
      if ([
            "int",  "float",  "double", "char", 
            "void", "struct", "union",  "enum", 
            "label"
          ].indexOf(value) === -1)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected specifier type: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__type !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specifiy " + value + 
            " in addition to previously specified " + this.__type);
      }
      
      // Ensure the type doesn't conflict with the signedness
      if (this.__sign !== null && value != "int" && value != "char")
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Type " + value + " can not be " + this.__sign);
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
     * Set the signedness
     * 
     * @param value {String}
     *   One of:
     *     "signed", "unsigned"
     */
    setSigned : function(value)
    {
      // Ensure we have a valid value
      if ( [ "signed", "unsigned" ].indexOf(value) === -1)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected signedness: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__sign !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specifiy " + value + 
            " in addition to previously specified " + this.__sign);
      }
      
      // Save the new value
      this.__sign = value;
    },
    
    /**
     * Retrieve the signedness. Defaults to "signed" if not specified and type
     * is an integer; otherwise to null.
     */
    getSigned : function()
    {
      // If there's a signedness specified, we can return it
      if (this.__sign)
      {
        return this.__sign;
      }
      
      // Otherwise, determine if there's a default signedness
      if (this.__type == "int" || this.__type == "char")
      {
        return "signed";
      }
      
      // There's no default. Return null.
      return null;
    },
    
    /**
     * Set the size
     * 
     * @param value {String}
     *   One of:
     *     "short", "long"
     * 
     *   If "long" is specified twice, we store "long long"
     */
    setSize : function(value)
    {
      // Ensure we have a valid value
      if ( [ "short", "long" ].indexOf(value) === -1)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected size: " + value);
      }

      // Save the type.
      this.__type = "int";

      // We can accept "long" if "long" is already specified, to create "long
      // long". No other combinations are allowed.
      if (this.__size == "long" && value == "long")
      {
        this.__size = "long long";
        return;
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__size !== null && this.__size != "int")
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specifiy " + value + 
            " in addition to previously specified " + this.__size);
      }
      
      // Save the new value
      this.__size = value;
    },
    
    /**
     * Retrieve the size
     */
    getSize : function()
    {
      return this.__size;
    },
    
    /**
     * Set the constantness
     * 
     * @param value {String}
     *   "constant" (only)
     */
    setConstant : function(value)
    {
      // Ensure we have a valid value
      if ( [ "constant" ].indexOf(value) === -1)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected constant: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__constant !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specifiy " + value + 
            " in addition to previously specified " + this.__constant);
      }
      
      // Save the new value
      this.__constant = value;
    },
    
    /**
     * Retrieve the constantness
     */
    getConstant : function()
    {
      return this.__constant;
    },
    
    /**
     * Set the volatility
     * 
     * @param value {String}
     *   "volatile" (only)
     */
    setVolatile : function(value)
    {
      // Ensure we have a valid value
      if ( [ "volatile" ].indexOf(value) === -1)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Programmer error: Unexpected volatility: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__volatile !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specifiy " + value + 
            " in addition to previously specified " + this.__volatile);
      }
      
      // Save the new value
      this.__volatile = value;
    },
    
    /**
     * Retrieve the volatility
     */
    getVolatile : function()
    {
      return this.__volatile;
    },
    
    /**
     * Display this specifier
     */
    display : function()
    {
      var             line = [];
      
      line.push("\tSpecifier at line " + this.__node.line +
                " (" + this.__node + ")");
      line.push("\t    storage  : " + JSON.stringify(this.__storage));
      line.push("\t    type     : " + JSON.stringify(this.__type));
      line.push("\t    sign     : " + JSON.stringify(this.__sign));
      line.push("\t    size     : " + JSON.stringify(this.__size));
      line.push("\t    constant : " + JSON.stringify(this.__constant));
      line.push("\t    volatile : " + JSON.stringify(this.__volatile));
      
      console.log(line.join("\n"));
    }
  }
});
