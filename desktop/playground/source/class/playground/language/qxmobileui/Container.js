/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

/*
#ignore(Blockly)
#ignore(Blockly.Generator)
#ignore(Blockly.Variables)
 */

qx.Class.define("playground.language.qxmobileui.Container",
{
  extend : qx.core.Object,

  statics :
  {
    blocks :
    {
      /**
       * A navigation container. It automatically consumes the entire screen.
       */
      container_navigation :
      {
        category : "Container",

        semantics : { type : "container" },

        init : function() 
        {
          this.setColour(280);
          this.addTitle("Application Container");
          this.addInput("", "", Blockly.NEXT_STATEMENT, 
                        null, { type : [ "page" ] });
        },

        generators :
        {
          JavaScript : function() 
          {
            var i;
            var block;
            var generator = Blockly.Generator.get('JavaScript');
            var code = [];

            // Generate the portion of this block that preceeds its children
            code.push("var page;");
            code.push("this._navigationContainer =" +
                      " new qx.ui.mobile.container.Navigation();",
                      "this.getRoot().add(this._navigationContainer, " +
                      "{ flex : 1 });");

            // Show the first child
            var bShow = true;

            // Generate the children
            for (block = this.getStatementInput(0), i = 0;
                 block; 
                 block = 
                   block.nextConnection && block.nextConnection.targetBlock(), 
                     ++i)
            {
              var blockCode = generator.blockToCode(block, true, true);
              if (blockCode.trim().length) 
              {
                code.push("this._navigationContainer.add(page = ");
                code.push(blockCode.trim() + ");");
                if (bShow) 
                {
                  code.push("page.show();");
                  bShow = false;
                }
              }
            }

            return code.join("\n");
          }
        }
      },

      /**
       * A Navigation Page (containing a Navigation Bar and a Scroll container.
       * The container may use either a horizontal or vertical layout.
       */
      container_navigationPage :
      {
        category: "Container",

        semantics: { type : "page" },

        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(280);
          this.addTitle("Navigation Page");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          this.addTitle("  layout:");
          this.addTitle(new Blockly.FieldDropdown(
                          function() 
                          {
                            return [ "vertical", "horizontal" ];
                          }));

          this.addInput("", "", Blockly.NEXT_STATEMENT, 
                        null, { type : [ "container", "widget" ] });
        },

        generators :
        {
          JavaScript : function() 
          {
            var             i;
            var             block;
            var             generator = Blockly.Generator.get('JavaScript');
            var             code = [];
            var             objName;

            // Determine the object name
            objName = (this.getTitleText(1).trim().length > 0
                       ? "this.obj_" + this.getTitleText(1)
                       : "this.obj_temp");


            // Generate the portion of this block that preceeds its children
            code.push(
              objName + " = ",
              "(qx.lang.Function.bind(function() {",
              "var o = new qx.ui.mobile.page.NavigationPage(",
              "  new qx.ui.mobile.layout." +
              (this.getTitleText(3) == "horizontal" ? "HBox()" : "VBox()") +
              ");");

            // Set the page's title
            code.push("o.setTitle(" +
                      "\"Page 1\"" +
                      ");");

            code.push("o.addListener(");
            code.push("\"initialize\", ");
            code.push("function()\n{");
            code.push("var container = o.getContent();");

            // Generate the children
            for (block = this.getStatementInput(0), i = 0;
                 block; 
                 block = 
                   block.nextConnection && block.nextConnection.targetBlock(), 
                     ++i)
            {
              var blockCode = generator.blockToCode(block, true, true);
              if (blockCode.trim().length) 
              {
                code.push("container.add(");
                code.push(blockCode.trim());
                code.push(");");
              }
            }

            code.push("},");
            code.push("this);");
            code.push("return o;");

            code.push("}, this))()");

            return code.join("\n");
          }
        }
      },

      /**
       * A composite container.  The container may use either a horizontal or
       * vertical layout.
       */
      container_composite :
      {
        category: "Container",

        semantics: { type : "container" },

        init: function() 
        {
          this.setPreviousStatement(true);
          this.setNextStatement(true);
          this.setColour(280);
          this.addTitle("Container");

          this.addTitle(new Blockly.FieldDropdown(
                          Blockly.Variables.dropdownCreate,
                          Blockly.Variables.dropdownChange))
            .setText('temp');

          this.addTitle("  layout:");
          this.addTitle(new Blockly.FieldDropdown(
                          function() 
                          {
                            return [ "vertical", "horizontal" ];
                          }));

          this.addTitle("  spacing:");
          this.addTitle(new Blockly.FieldTextInput(
                          '0',
                          function(text) 
                          {
                            var n = window.parseFloat(text || 0);
                            return window.isNaN(n) ? null : String(n);
                          }));

          this.addInput("", "", Blockly.NEXT_STATEMENT, 
                        null, { type : [ "container", "widget" ] });
        },

        generators :
        {
          JavaScript : function() 
          {
            var i;
            var block;
            var generator = Blockly.Generator.get('JavaScript');
            var code = [];

            // Generate the portion of this block that preceeds its children
            code.push(
              (this.getTitleText(1).trim().length > 0
               ? "this.obj_" + this.getTitleText(1) + " = "
               : "") +
              "(function() {",
              "var o = new qx.ui.mobile.container.Composite(\n" +
                "  new qx.ui.mobile.layout." +
                (this.getTitleText(3) == "horizontal" ? "HBox(" : "VBox(") +
                this.getTitleText(5) + ")" +
                ");");

            // Generate the children
            for (block = this.getStatementInput(0), i = 0;
                 block; 
                 block =
                   block.nextConnection && block.nextConnection.targetBlock(), 
                     ++i)
            {
              var blockCode = generator.blockToCode(block, true, true);
              if (blockCode.trim().length) 
              {
                code.push("o.add("+ blockCode.trim() + ");");
              }
            }

            // Generate the portion of this block that follows its children
            code.push("return o;",
                      "})()");

            return code.join("\n");
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
