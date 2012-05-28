/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 */

/*
#ignore(Blockly)
#ignore(Blockly.Variables)
#ignore(Blockly.JavaScript)
 */

qx.Class.define("playground.language.qxmobileui.WidgetBasic",
{
  extend : qx.core.Object,

  statics :
  {
    blocks :
    {
      /*
       * An atom widget. An item can easily align the common icon/text
       * combination in different ways.
       */
      qxmobileui_atom :
      {
        category: "Widget\0Basic",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Atom");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the text input
          this.addInput("  text:", "", Blockly.INPUT_VALUE, 
                        null, { type : "string" });

          // Add the icon (url) input
          this.addInput("  icon:", "", Blockly.INPUT_VALUE, 
                        null, { type : "string" });
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.basic.Atom(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'null') +
              ", " +
              (Blockly.JavaScript.valueToCode_(this, 1, true) || 'null') +
              ")";

            return code;
          }
        }
      },

      /*
       * An image widget.
       */
      qxmobileui_image :
      {
        category: "Widget\0Basic",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Image");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the icon (url) input
          this.addInput("  icon:", "", Blockly.INPUT_VALUE, 
                        null, { type : "string" });
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.basic.Image(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'null') +
              ")";

            return code;
          }
        }
      },

      /*
       * A label widget.
       */
      qxmobileui_label :
      {
        category: "Widget\0Basic",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Label");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the text input
          this.addInput("  text:", "", Blockly.INPUT_VALUE, 
                        null, { type : "string" });
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.basic.Label(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'null') +
              ")";

            return code;
          }
        }
      },
      
      /*
       * A slider widget.
       */
      qxmobileui_slider :
      {
        category: "Widget\0Basic",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Slider");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the initial value
          this.addInput("  initial value:", "", Blockly.INPUT_VALUE, 
                        null, { type : "integer" });

          // Add the minimum value
          this.addInput("  minimum:", "", Blockly.INPUT_VALUE, 
                        null, { type : "integer" });

          // Add the maximum value
          this.addInput("  maximum:", "", Blockly.INPUT_VALUE, 
                        null, { type : "integer" });
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var value = Blockly.JavaScript.valueToCode_(this, 0, true);
            var min = Blockly.JavaScript.valueToCode_(this, 1, true);
            var max = Blockly.JavaScript.valueToCode_(this, 2, true);
            var step = Blockly.JavaScript.valueToCode_(this, 3, true);
            var comma = "    ";
            var code = [];
            code.push(
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.form.NumberField().set(\n" +
              "  {\n");

            if (value) 
            {
              code.push(comma + (value ? "value : " + value + "\n"  : ""));
              comma = "   ,";
            }

            if (min) 
            {
              code.push(comma + (min ? "minimum : " + min + "\n"  : ""));
              comma = "   ,";
            }

            if (max) 
            {
              code.push(comma + (max ? "maximum : " + max + "\n"  : ""));
              comma = "   ,";
            }

            code.push("  })");

            return code.join("");
          }
        }
      }
    }
  },
  
  defer : function(statics)
  {
    // Register this set of blocks
    playground.language.Language.registerLanguage(statics.blocks);
  }
});
