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

qx.Class.define("playground.view.blocks.Blocks",
{
  extend : Object,

  construct : function()
  {
    var             forceLoad;
    
    // Mention the name of the block classes, so that they get loaded
    forceLoad = 
      [
        playground.view.blocks.Globals,
        playground.view.blocks.Type,
        playground.view.blocks.Function,
        playground.view.blocks.Loop
      ];
  }
});
