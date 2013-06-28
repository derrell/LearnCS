/*
 * LearnCS!
 *
 * Copyright:
 *   2013 Derrell Lipman
 *
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html
 *
 * Authors:
 *   Derrell Lipman
 */

/*
#asset(playground/*)
#ignore(require)
#ignore(Blockly)
*/

qx.Class.define("playground.view.blocks.Function",
{
  extend : Object,

  statics :
  {
    "function" :
    {
      helpUrl: 'http://www.example.com/',

      category : "function",

      init: function() 
      {
        this.setColour(290);
        this.appendDummyInput()
          .appendTitle("function")
          .appendTitle(new Blockly.FieldTextInput("NAME"), "name");
        this.appendValueInput("result_type")
          .appendTitle("produces result type")
          .setCheck("Type");
        this.appendStatementInput("inputs")
          .appendTitle("inputs")
          .setCheck("Declaration");
        this.appendStatementInput("declarations")
          .appendTitle("local variables", "local_vars")
          .setCheck("Declaration");
        this.appendStatementInput("body")
          .appendTitle("do")
          .setCheck([
                      "Statement", 
                      "Return with result",
                      "Return without result" 
                    ]);
        this.setTooltip('');
        this.setInputsInline(true);
        this.setMutator(new Blockly.Mutator([]));
      },

      decompose : function(workspace) 
      {
        var functionBlock = new Blockly.Block(workspace,
                                              'function_editor');

        functionBlock.initSvg();

        // Set editor values based on the current function settings
        functionBlock.setTitleValue(
          this.getInput("inputs") !== null ? "TRUE" : "FALSE", 
          "has_inputs");
        functionBlock.setTitleValue(
          this.getInput("result_type") !== null ? "TRUE" : "FALSE", 
          "has_result");
        functionBlock.setTitleValue(
          this.getInput("declarations") !== null ? "TRUE" : "FALSE", 
          "has_local_vars");

        return functionBlock;
      },

      compose : function(functionBlock) 
      {
        var bHasResult =
          functionBlock.getTitleValue("has_result") == "TRUE";
        var bHasInputs =
          functionBlock.getTitleValue("has_inputs") == "TRUE";
        var bHasLocalVars =
          functionBlock.getTitleValue("has_local_vars") == "TRUE";

        // add or remove result_type
        playground.view.Blockly.addRemoveInput.call(
          this,
          "result_type", 
          bHasResult,
          function() 
          {
            this.appendValueInput("result_type")
              .appendTitle("produces result type")
              .setCheck("Type");
          },
          [ "inputs", "declarations", "body" ]);

        // add or remove inputs
        playground.view.Blockly.addRemoveInput.call(
          this,
          "inputs", 
          bHasInputs,
          function() 
          {
            this.appendStatementInput("inputs")
              .appendTitle("inputs")
              .setCheck("Declaration");
          },
          [ "declarations", "body" ]);

        // add or remove local variables (declarations)
        playground.view.Blockly.addRemoveInput.call(
          this,
          "declarations", 
          bHasLocalVars,
          function() 
          {
            this.appendStatementInput("declarations")
              .appendTitle("local variables")
              .setCheck("Declaration");
          },
          [ "body" ]);
      }
    },

    "function_editor" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
        this.setColour(290);
        this.appendDummyInput()
          .appendTitle("function");
        this.appendDummyInput()
          .setAlign(Blockly.ALIGN_RIGHT)
          .appendTitle("produces a result?")
          .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                       "has_result");
        this.appendDummyInput()
          .setAlign(Blockly.ALIGN_RIGHT)
          .appendTitle("receives inputs?")
          .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                       "has_inputs");
        this.appendDummyInput()
          .setAlign(Blockly.ALIGN_RIGHT)
          .appendTitle("has local variables?")
          .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                       "has_local_vars");
        this.setTooltip('');
      }
    },

    "return_with_result" :
    {
      helpUrl: 'http://www.example.com/',

      category : "function",

      init: function() 
      {
        this.setColour(290);
        this.appendDummyInput()
          .appendTitle("leave function producing result");
        this.appendValueInput("retval");
        this.setPreviousStatement(true, "Return with result");
        this.setTooltip('');
      }
    },

    "return_no_result" :
    {
      helpUrl: 'http://www.example.com/',

      category : "function",

      init: function() 
      {
        this.setColour(290);
        this.appendDummyInput()
          .appendTitle("leave function without result");
        this.setPreviousStatement(true, "Return without result");
        this.setTooltip('');
      }
    }
  },
  
  defer : function(statics)
  {
    playground.view.Blockly.registerBlocks(statics);
  }
});
