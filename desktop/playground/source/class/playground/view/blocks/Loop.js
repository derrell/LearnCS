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

qx.Class.define("playground.view.blocks.Loop",
{
  extend : Object,

  statics :
  {
    "for_loop" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
        this.setColour(120);
        this.appendDummyInput()
           .appendTitle("loop");
        this.appendValueInput("condition")
          .appendTitle("while true:")
          .setCheck("Expression");
        this.appendStatementInput("body")
          .appendTitle("do")
          .setCheck("Statement");
        this.setInputsInline(true);
        this.setPreviousStatement(true, "Statement");
        this.setNextStatement(true, "Statement");
        this.setTooltip('');
        this.setMutator(new Blockly.Mutator([]));
      },

      decompose : function(workspace) 
      {
        var loopBlock = new Blockly.Block(workspace, 'for_loop_editor');

        loopBlock.initSvg();

        // Set editor values based on the current function settings
        loopBlock.setTitleValue(
          this.getInput("initialize") !== null ? "TRUE" : "FALSE", 
          "has_initialize");
        loopBlock.setTitleValue(
          this.getInput("condition") !== null ? "TRUE" : "FALSE", 
          "has_condition");
        loopBlock.setTitleValue(
          this.getInput("after_each") !== null ? "TRUE" : "FALSE", 
          "has_after_each");

        return loopBlock;
      },

      compose : function(loopBlock) 
      {
        var bHasInitialize =
          loopBlock.getTitleValue("has_initialize") == "TRUE";
        var bHasCondition =
          loopBlock.getTitleValue("has_condition") == "TRUE";
        var bHasAfterEach =
          loopBlock.getTitleValue("has_after_each") == "TRUE";

        // add or remove initialization
        playground.view.Blockly.addRemoveInput.call(
          this,
          "initialize", 
          bHasInitialize,
          function() 
          {
            this.appendStatementInput("initialize")
              .appendTitle("initialize")
              .setCheck("Statement");
          },
          [ "condition", "body" ]);

        // add or remove the condition
        playground.view.Blockly.addRemoveInput.call(
          this,
          "condition", 
          bHasCondition,
          function() 
          {
            this.appendValueInput("condition")
              .appendTitle("while true:")
              .setCheck("Expression");
          },
          [ "body" ]);

        // add or remove after-each-iteration
        playground.view.Blockly.addRemoveInput.call(
          this,
          "after_each", 
          bHasAfterEach,
          function() 
          {
            this.appendStatementInput("after_each")
              .appendTitle("after each iteration")
              .setCheck("Statement");
          },
          null);
      }
    },

    "for_loop_editor" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
        this.setColour(120);
        this.appendDummyInput()
          .appendTitle("loop");
        this.appendDummyInput()
          .setAlign(Blockly.ALIGN_RIGHT)
          .appendTitle("requires initialization?")
          .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                       "has_initialize");
        this.appendDummyInput()
          .setAlign(Blockly.ALIGN_RIGHT)
          .appendTitle("loop terminates on a condition?")
          .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                       "has_condition");
        this.appendDummyInput()
          .setAlign(Blockly.ALIGN_RIGHT)
          .appendTitle("requires post-iteration code?")
          .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                       "has_after_each");
        this.setTooltip('');
      }
    },

    "do_while_loop" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
        this.setColour(120);
        this.appendDummyInput()
          .appendTitle("loop at least once");
        this.appendStatementInput("body")
          .appendTitle("do");
        this.appendValueInput("condition")
          .appendTitle("while true:");
        this.setInputsInline(true);
        this.setPreviousStatement(true, "Statement");
        this.setNextStatement(true, "Statement");
        this.setTooltip('');
      }
    }
  },
  
  defer : function(statics)
  {
    playground.view.Blockly.registerBlocks(statics);
  }
});
