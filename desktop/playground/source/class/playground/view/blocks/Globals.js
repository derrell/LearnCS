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

qx.Class.define("playground.view.blocks.Globals",
{
  extend : Object,

  statics :
  {
    "globals" :
    {
      helpUrl: 'http://www.example.com/',

      category : "variables",

      init: function() 
      {
        this.setColour(24);
        this.appendDummyInput()
          .appendTitle("global variables and type definitions");
        this.appendStatementInput("declarations")
          .setCheck("Declaration");
        this.setTooltip('');
      }
    }
  },
  
  defer : function(statics)
  {
    playground.view.Blockly.registerBlocks(statics);
  }
});
