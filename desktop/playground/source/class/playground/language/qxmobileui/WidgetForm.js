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

qx.Class.define("playground.language.qxmobileui.WidgetForm",
{
  extend : qx.core.Object,

  statics :
  {
    blocks :
    {
      /*
       * A button widget.
       */
      qxmobileui_button :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Button");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the button's label
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
              "new qx.ui.mobile.form.Button(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'null') +
              ")";

            return code;
          }
        }
      },

      /*
       * A checkbox widget.
       */
      qxmobileui_checkbox :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Checkbox");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.form.Checkbox()";

            return code;
          }
        }
      },

      /*
       * A number input field widget.
       */
      qxmobileui_numberInput :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Number Input Field");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the initial value
          this.addInput("  initial value:", "", Blockly.INPUT_VALUE, 
                        null, { type : "integer" });
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.form.NumberField(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'null') +
              ")";

            return code;
          }
        }
      },

      /*
       * A password input field widget.
       */
      qxmobileui_passwordInput :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Password Input Field");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the initial value
          this.addInput("  initial value:", "", Blockly.INPUT_VALUE, 
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
              "new qx.ui.mobile.form.PasswordField(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'null') +
              ")";

            return code;
          }
        }
      },

      /*
       * A radio button widget.
       */
      qxmobileui_radioButton :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Radio Button");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.form.RadioButton()";

            return code;
          }
        }
      },

      /*
       * A select box widget.
       */
      qxmobileui_selectBox :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Select Box");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.form.SelectBox()";

            return code;
          }
        }
      },

      /*
       * A text area widget.
       */
      qxmobileui_textArea :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Text Area");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the initial value
          this.addInput("  initial value:", "", Blockly.INPUT_VALUE, 
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
              "new qx.ui.mobile.form.TextArea(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'null') +
              ")";

            return code;
          }
        }
      },

      /*
       * A text input field widget.
       */
      qxmobileui_textInput :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Text Input Field");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          // Add the initial value
          this.addInput("  initial value:", "", Blockly.INPUT_VALUE, 
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
              "new qx.ui.mobile.form.TextField(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'null') +
              ")";

            return code;
          }
        }
      },

      /*
       * A toggle button widget.
       */
      qxmobileui_toggleButton :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("Toggle Button");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          this.addTitle("  initial value:");
          this.addTitle(new Blockly.FieldDropdown(
                          function() {
                            return [ "off", "on" ];
                          }));
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.form.ToggleButton(" +
              (Blockly.JavaScript.valueToCode_(this, 0, true) || 'false') +
              ")";

            return code;
          }
        }
      },

      /*
       * A list widget.
       */
      qxmobileui_list :
      {
        category: "Widget\0Form",
        
        semantics: { type : "widget" },
        
        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(120);
          this.addTitle("List");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');
        },
        
        generators :
        {
          JavaScript : function() 
          {
            var code =
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "new qx.ui.mobile.list.List()";

            return code;
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
