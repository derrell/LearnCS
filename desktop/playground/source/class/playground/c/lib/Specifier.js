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
#ignore(qx.bConsole)
 */

/**
 * @lint ignoreUndefined(require)
 * @lint ignoreUndefined(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
  qx.bConsole = true;
  require("../machine/Memory");
}

qx.Class.define("playground.c.lib.Specifier",
{
  extend : qx.core.Object,
  
  /**
   * Constructor for a new specifier
   * 
   * @param node {playground.c.lib.Node}
   *   The node at which this specifier is created
   * 
   * @param type {String?}
   *   An optional type. If provided, this.setType() is called.
   * 
   * @param size {String?}
   *   An optional size. If provided, this.setSize() is called.
   * 
   * @param sign {String?}
   *   An optional signedness. If provided, this.setSigned() is called.
   */
  construct : function(node, type, size, sign)
  {
    this.base(arguments);
    this.__node = node;
    
    if (type)
    {
      this.setType(type);
    }
    
    if (size)
    {
      this.setSize(size);
    }
    
    if (sign)
    {
      this.setSigned(sign);
    }
  },

  members :
  {
    __node         : null,
    __storage      : null,
    __type         : null,
    __sign         : null,
    __size         : null,
    __constant     : null,
    __volatile     : null,
    __structSymtab : null,
    
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
             "auto", "register", "static", "extern", "typedef", null
           ].indexOf(value) === -1)
      {
        throw new Error(
          "Internal error: Unexpected storage type: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified.
      // Allow typedef to override extern, however.
      if ((this.__storage == "extern" && value == "typedef") ||
          (this.__storage == "typedef" && value == "extern"))
      {
        // do nothing
      }
      else if (this.__storage !== null && 
               this.__storage != value &&
               value !== null)  // allow setting back to null
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specify " + value + 
            " in addition to previously specified " + this.__storage +
            ". Is there possibly a missing semicolon?");
      }
      
      // Save the new value
      this.__storage = value;
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
     *     "int",  "float",  "double",
     *     "void", "struct", "union",  "enum", 
     *     "label"
     */
    setType : function(value)
    {
      // Ensure we have a valid value
      if ([
            "int",  "float",  "double",
            "void", "struct", "union",  "enum", 
            "label"
          ].indexOf(value) === -1)
      {
        throw new Error(
          "Internal error: Unexpected specifier type: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__type !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specify " + value + 
            " in addition to previously specified " + this.__type +
            ". Is there possibly a missing semicolon?");
      }
      
      // Ensure the type doesn't conflict with the signedness
      if (this.__sign !== null && value != "int")
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
      return this.__type || "int";
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
        throw new Error(
          "Internal error: Unexpected signedness: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__sign !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specify " + value + 
            " in addition to previously specified " + this.__sign +
            ". Is there possibly a missing semicolon?");
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
      if ((this.__type || "int") == "int")
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
     *     "char", "short", "long"
     * 
     *   If "long" is specified twice, we store "long long"
     */
    setSize : function(value)
    {
      // Ensure we have a valid value
      if ( [ "char", "short", "long" ].indexOf(value) === -1)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Internal error: Unexpected size: " + value);
      }

      // Ensure a size isn't applied to something other than an int
      if (this.__type !== null && this.__type != "int")
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specify " + value + 
            " in addition to previously specified " + this.__type +
            ". Is there possibly a missing semicolon?");
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
      if ( [ "constant", "enum_value" ].indexOf(value) === -1)
      {
        throw new Error(
          "Internal error: Unexpected constant: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__constant !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specify " + value + 
            " in addition to previously specified " + this.__constant +
            ". Is there possibly a missing semicolon?");
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
        throw new Error(
          "Internal error: Unexpected volatility: " + value);
      }

      // Ensure that two mutually-exclusive types haven't been specified
      if (this.__volatile !== null)
      {
        throw new playground.c.lib.RuntimeError(
          this.__node,
          "Can not specify " + value + 
            " in addition to previously specified " + this.__volatile +
            ". Is there possibly a missing semicolon?");
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
     * Save the symbol table of a struct or union
     * 
     * @param symtab {playground.c.lib.Symtab}
     *   The symbol table which holds the struct or union members
     */
    setStructSymtab : function(symtab)
    {
      this.__structSymtab = symtab;
    },
    
    /**
     * Retrieve the symbol table of a struct or union
     */
    getStructSymtab : function()
    {
      return this.__structSymtab;
    },

    /**
     * Get the byte account of this specifier.
     * 
     * @param multiplier {Number}
     *   Number of elements of this type to account for in the byte count
     * 
     * @return {Number}
     *   The calculated byte count of this specifier type
     */
    calculateByteCount : function(multiplier)
    {
      var             byteCount;
      var             structSymtab;

      // Determine the byte count for this type
      switch(this.__type || "int")
      {
      case "int" :
        switch(this.__size)
        {
        case "short" :
        case "long" :
        case "long long" :
        case "char" :
          byteCount = playground.c.machine.Memory.typeSize[this.__size];
          break;

        default :
          byteCount = playground.c.machine.Memory.typeSize["int"];
          break;
        }
        break;
        
      case "float" :
      case "double" :
        byteCount = playground.c.machine.Memory.typeSize[this.__type];
        break;
        
      case "enum" :
        byteCount = playground.c.machine.Memory.typeSize["int"];
        break;

      case "struct" :
      case "union" :
        structSymtab = this.getStructSymtab();
        byteCount = structSymtab ? structSymtab.getSize() : 0;
        break;

      case "label" :
        throw new playground.c.lib.NotYetImplemented(this.__type +
                                                     " (in Specifier)");
        break;
      }

      return byteCount * multiplier;
    },

    /**
     * Get the C type appropriate for memory access.
     */
    getCType : function()
    {
      // Determine the byte count for this type
      switch(this.__type || "int")
      {
      case "int" :
        return (this.__sign ? this.__sign + " " : "") + (this.__size || "int");
        
      case "float" :
      case "double" :
      case "struct" :
      case "union" :
      case "enum" :
        return this.__type;
        
      case "label" :
        throw new playground.c.lib.NotYetImplemented(this.__type +
                                                     " ( in Specifier)");

      default :
        throw new Error("Unexpected type: " + this.__type);
      }
    },

    /**
     * Clone a typedef as a non-typedef
     */
    cloneTypedef : function()
    {
      var             specifier;
      
      specifier = new playground.c.lib.Specifier(this.__node);
      specifier.__type = this.__type;
      specifier.__size = this.__size;
      specifier.__sign = this.__sign;
      specifier.__structSymtab = this.__structSymtab;
      
      return specifier;
    },

    /**
     * Promote this specifier, with a possibly altered type.
     * 
     * @return {playground.c.lib.Specifier}
     *   The promoted specifier. All storage, constant, and volatile
     *   information is excluded from the new specifier, and the size is set
     *   to one appropriate for a function argument, i.e., small size values
     *   are increased to at least sizeof int.
     */
    promote : function()
    {
      var             specifier;
      
      // Get a new specifier with the same node as our current specifier.
      specifier = new playground.c.lib.Specifier(this.__node);
      
      // Copy the type
      specifier.__type = this.__type;
      
      // Copy the sign, if it's been set
      if (this.__sign)
      {
        specifier.__sign = this.__sign;
      }
      
      // If our current specifier's type is "long" or "long long" then add
      // those to the new specifier. (Nothing is done if the current
      // specifier's size is "char" or "short", which keeps the new
      // specifier's type at an assumed "int".)
      if (! this.__type || this.__type == "int")
      {
        if (this.__size == "long" || this.__size == "long long")
        {
          specifier.__size = this.__size;
        }
      }
      
      return specifier;
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
