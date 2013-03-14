/**
 * A view of C memory -- one word
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 *
 * (Derived from the qooxdoo showcase virtuallist example)
 */

qx.Class.define("playground.view.c.MemoryWord",
{
  extend    : qx.ui.container.Composite,
  implement : [ qx.ui.form.IModel ],
  include   : [ qx.ui.form.MModelProperty ],
  
  /**
   * Constructor
   */
  construct : function()
  {
    var             row;
    var             col;
    var             gridLayout;

    this.base(arguments);
    
    // Create a grid layout. Leave some horizontal space between elements.
    this.gridLayout = new qx.ui.layout.Grid(8, 0);
    this._setLayout(this.gridLayout);
    
    // Set column widths
    this.gridLayout.setColumnWidth(0, 120);
    this.gridLayout.setColumnAlign(0, "center", "middle");
    
    this.gridLayout.setColumnWidth(1, 40);
    this.gridLayout.setColumnAlign(1, "center", "middle");
    
    for (col = 2; col < 7; col++)
    {
      this.gridLayout.setColumnWidth(col, 20);
    }
    
    // Pre-create each of the child controls
    this.getChildControl("name1");
    this.getChildControl("name2");
    this.getChildControl("name4");
    this.getChildControl("type");
    this.getChildControl("addr1");
    this.getChildControl("addr2");
    this.getChildControl("addr4");
    this.getChildControl("value10");
    this.getChildControl("value11");
    this.getChildControl("value12");
    this.getChildControl("value13");
    this.getChildControl("value20");
    this.getChildControl("value22");
    this.getChildControl("value40");
    this.getChildControl("byte0");
    this.getChildControl("byte1");
    this.getChildControl("byte2");
    this.getChildControl("byte3");
    this.getChildControl("arStartEnd");
    
    this.initArray([]);
  },
  
  properties :
  {
    addr :
    {
      apply : "_applyAddr"
    },
    
    name :
    {
      apply : "_applyName"
    },
    
    type :
    {
      apply : "_applyType"
    },
    
    size :
    {
      apply : "_applySize"
    },
    
    pointer :
    {
      init  : 0,
      apply : "_applyPointer"
    },
    
    array :
    {
      deferredInit : true,
      apply        : "_applyArray"
    },

    param :
    {
      init  : false,
      apply : "_applyParam"
    },
    
    value0 :
    {
      nullable : true,
      apply    : "_applyValue0"
    },
    
    value1 :
    {
      nullable : true,
      apply    : "_applyValue1"
    },
    
    value2 :
    {
      nullable : true,
      apply    : "_applyValue2"
    },
    
    value3 :
    {
      nullable : true,
      apply    : "_applyValue3"
    },
    
    byte0 :
    {
      apply : "_applyByte0"
    },
    
    byte1 :
    {
      apply : "_applyByte1"
    },
    
    byte2 :
    {
      apply : "_applyByte2"
    },
    
    byte3 :
    {
      apply : "_applyByte3"
    },
    
    arStartEnd :
    {
      nullable : true,
      apply    : "_applyArStartEnd"
    }
  },

  members :
  {
    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var             control;
      
      switch(id)
      {
      case "name1" :
        control = new qx.ui.basic.Label();
        this._add(control, { row : 0, column : 0 } );
        break;
        
      case "name2" :
        control = new qx.ui.basic.Label();
        this._add(control, { row : 1, column : 0 } );
        break;
        
      case "name4" :
        control = new qx.ui.basic.Label();
        this._add(control, { row : 2, column : 0 } );
        break;
        
      case "type" :
        control = new qx.ui.basic.Label();
        this._add(control, { row : 3, column : 0 } );
        break;
        
      case "addr1" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 0, column : 1, rowSpan : 2 } );
        break;
        
      case "addr2" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 1, column : 1, rowSpan : 2 } );
        break;
        
      case "addr4" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 2, column : 1, rowSpan : 2 } );
        break;
        
      case "value10" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 0, column : 2 } );
        break;

      case "value11" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 0, column : 3 } );
        break;

      case "value12" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 0, column : 4 } );
        break;

      case "value13" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 0, column : 5 } );
        break;

      case "value20" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 1, column : 2, colSpan : 2 } );
        break;

      case "value22" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 1, column : 4, colSpan : 2 } );
        break;

      case "value40" :
        control = new qx.ui.basic.Label();
        control.setRich(true);
        this._add(control, { row : 2, column : 2, colSpan : 4 } );
        break;

      case "byte0" :
        control = new qx.ui.basic.Label();
        this._add(control, { row : 3, column : 2 } );
        break;

      case "byte1" :
        control = new qx.ui.basic.Label();
        this._add(control, { row : 3, column : 3 } );
        break;

      case "byte2" :
        control = new qx.ui.basic.Label();
        this._add(control, { row : 3, column : 4 } );
        break;

      case "byte3" :
        control = new qx.ui.basic.Label();
        this._add(control, {row : 3, column : 5 } );
        break;
        
      case "arStartEnd" :
        control = new qx.ui.basic.Label();
control.setVisibility("excluded");
        this._add(control, { row : 0, column : 6, rowSpan : 2 } );
        break;
      }
      
      // Don't let labels consume too much height
      if (control instanceof qx.ui.basic.Label)
      {
        control.set(
          {
            height    : 13,
            maxHeight : 13,
            margin    : 0
          });
      }

      return control || this.base(arguments, id);
    },
    
    // property apply function
    _applyAddr : function(value, old)
    {
      value =
        "<span style='font-weight: bold;'>" +
        ("0000" + value.toString(16)).substr(-4) +
        "</span>";

      this.getChildControl("addr1").setValue(value);
      this.getChildControl("addr2").setValue(value);
      this.getChildControl("addr4").setValue(value);
    },
    
    // property apply function
    _applyName : function(value, old)
    {
      value = value ? value.toString() : "";

      this.getChildControl("name1").setValue(value);
      this.getChildControl("name2").setValue(value);
      this.getChildControl("name4").setValue(value);
    },
    
    // property apply function
    _applyType : function(value, old)
    {
      var             i;
      var             model;
      var             pointer;
      var             array;
      var             bIsPointer;

      // Retrieve the full model for this word
      model = this.getModel();

      // Determine the actual type. Record whether it's really a pointer.
      pointer = model.getPointer();
      array = model.getArray();
      bIsPointer = (pointer !== 0 || (model.getParam() && array.length !== 0));

var typeSize =
{
  "char"               : 1,
  "unsigned char"      : 1,
  "short"              : 2,
  "unsigned short"     : 2,
  "int"                : 4,
  "unsigned int"       : 4,
  "long"               : 4,
  "unsigned long"      : 4,
  "long long"          : 4,
  "unsigned long long" : 4,
  "float"              : 4,
  "double"             : 4,
  "pointer"            : 2
};

//      switch(playground.c.machine.Memory.typeSize[value])
      switch(typeSize[bIsPointer ? "pointer" : value])
      {
      case 1:
        this.getChildControl("addr1").setVisibility("visible");
        this.getChildControl("addr2").setVisibility("excluded");
        this.getChildControl("addr4").setVisibility("excluded");

        this.getChildControl("name1").setVisibility("visible");
        this.getChildControl("name2").setVisibility("excluded");
        this.getChildControl("name4").setVisibility("excluded");

        this.getChildControl("value10").setVisibility("visible");
        this.getChildControl("value11").setVisibility("visible");
        this.getChildControl("value12").setVisibility("visible");
        this.getChildControl("value13").setVisibility("visible");
        
        this.getChildControl("value20").setVisibility("excluded");
        this.getChildControl("value22").setVisibility("excluded");

        this.getChildControl("value40").setVisibility("excluded");
        break;
        
      case 2:
        this.getChildControl("addr1").setVisibility("excluded");
        this.getChildControl("addr2").setVisibility("visible");
        this.getChildControl("addr4").setVisibility("excluded");

        this.getChildControl("name1").setVisibility("excluded");
        this.getChildControl("name2").setVisibility("visible");
        this.getChildControl("name4").setVisibility("excluded");

        this.getChildControl("value10").setVisibility("excluded");
        this.getChildControl("value11").setVisibility("excluded");
        this.getChildControl("value12").setVisibility("excluded");
        this.getChildControl("value13").setVisibility("excluded");
        
        this.getChildControl("value20").setVisibility("visible");
        this.getChildControl("value22").setVisibility("visible");

        this.getChildControl("value40").setVisibility("excluded");
        break;
        
      case 4:
        this.getChildControl("addr1").setVisibility("excluded");
        this.getChildControl("addr2").setVisibility("excluded");
        this.getChildControl("addr4").setVisibility("visible");

        this.getChildControl("name1").setVisibility("excluded");
        this.getChildControl("name2").setVisibility("excluded");
        this.getChildControl("name4").setVisibility("visible");

        this.getChildControl("value10").setVisibility("excluded");
        this.getChildControl("value11").setVisibility("excluded");
        this.getChildControl("value12").setVisibility("excluded");
        this.getChildControl("value13").setVisibility("excluded");
        
        this.getChildControl("value20").setVisibility("excluded");
        this.getChildControl("value22").setVisibility("excluded");

        this.getChildControl("value40").setVisibility("visible");
        break;
        
      default:
        throw new Error("Fix me if new sizes are added");
      }

      // If there's no name...
      if (! model.getName())
      {
        // ... then we won't display the value
        this.getChildControl("type").setValue("");
        return;
      }

      // If this is not a pointer...
      if (! bIsPointer && array.getLength() === 0)
      {
        // ... then simply display the type value as is
        this.getChildControl("type").setValue(value);
        return;
      }

      // Calculate the type. First add asterisks for each level of indirection
      if (pointer)
      {
        value += " ";
        for (i = 0; i < pointer; i++)
        {
          value += "*";
        }
      }
      
      // Now add array size. 
      // Special case: a parameter with empty brackets has length 1, value -1
      if (array.getLength() > 0)
      {
        value += " ";
        if (array.getLength() == 1 && array.getItem(0) == -1)
        {
          value += "[]";
        }
        else
        {
          for (i = 0; i < array.getLength(); i++)
          {
            value += "[" + array.getItem(i) + "]";
          }
        }
      }

      // Display tne calculated type value
      this.getChildControl("type").setValue(value);
    },
    
    // property apply function
    _applySize : function(value, old)
    {
    },
    
    // property apply function
    _applyPointer : function(value, old)
    {
      if (value || (this.getParam() && this.getArray().length > 0))
      {
      }
      else
      {
      }
    },
    
    // property apply function
    _applyArray : function(value, old)
    {
      if (this.getPointer() || (this.getParam() && value.length > 0))
      {
      }
      else
      {
      }
    },
    
    // property apply function
    _applyParam : function(value, old)
    {
      if (this.getPointer() || (value && this.getArray().length > 0))
      {
      }
      else
      {
      }
    },
    
    __fixValue : function(value)
    {
      var             model;
      var             type;
      var             array;
      var             param;
      var             pointer;
      var             bIsPointer;
      
      // If the value is not a number...
      if (typeof value != "number")
      {
        // ... then just display a dash
        return "-";
      }
      
      // Determine if we are displaying a pointer
      model = this.getModel();
      type = model.getType();
      pointer = model.getPointer();
      array = model.getArray();
      param = model.getParam();
      bIsPointer = (pointer !== 0 || (param && array.length !== 0));
      
      // How shall we display this value?
      if (bIsPointer)
      {
        // It's a pointer, so highlight it
        value =
          "<span style='font-weight: bold; color: blue;'>" + 
          ("0000" + value.toString(16)).substr(-4) +
          "</span>";
      }
      else if (type == "char" || type == "unsigned char")
      {
        // It's a character type. Display the character itself
        value = "'" + String.fromCharCode(value) + "'";
      }
      else
      {
        // Convert the number to a string
        value = value.toString();
      }

      return value;
    },

    // property apply function
    _applyValue0 : function(value, old)
    {
      value = this.__fixValue(value);
      this.getChildControl("value10").setValue(value);
      this.getChildControl("value20").setValue(value);
      this.getChildControl("value40").setValue(value);
    },
    
    // property apply function
    _applyValue1 : function(value, old)
    {
      this.getChildControl("value11").setValue(this.__fixValue(value));
    },
    
    // property apply function
    _applyValue2 : function(value, old)
    {
      value = this.__fixValue(value);
      this.getChildControl("value12").setValue(value);
      this.getChildControl("value22").setValue(value);
    },
    
    // property apply function
    _applyValue3 : function(value, old)
    {
      this.getChildControl("value13").setValue(this.__fixValue(value));
    },
    
    // property apply function
    _applyByte0 : function(value, old)
    {
      this.getChildControl("byte0").setValue(
        ("00" + value.toString(16)).substr(-2));
    },
    
    // property apply function
    _applyByte1 : function(value, old)
    {
      this.getChildControl("byte1").setValue(
        ("00" + value.toString(16)).substr(-2));
    },
    
    // property apply function
    _applyByte2 : function(value, old)
    {
      this.getChildControl("byte2").setValue(
        ("00" + value.toString(16)).substr(-2));
    },
    
    // property apply function
    _applyByte3 : function(value, old)
    {
      this.getChildControl("byte3").setValue(
        ("00" + value.toString(16)).substr(-2));
    },
    
    // property apply function
    _applyArStartEnd : function(value, old)
    {
      this.getChildControl("arStartEnd").setValue(value ? value.toString() : "");
    }
  }
});
