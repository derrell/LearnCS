/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 */

/*
#ignore(Blockly)
#ignore(Blockly.Generator)
#ignore(Blockly.Variables)
 */

qx.Class.define("playground.language.Math",
{
  extend : qx.core.Object,

  statics :
  {
    blocks :
    {
      math_integer :
      {
        category: 'Math',
        
        semantics: { type : "integer" },
        
        helpUrl: 'http://en.wikipedia.org/wiki/Integer',
        
        init: function() 
        {
          this.setColour(230);
          this.addTitle(new Blockly.FieldTextInput(
                          '0', 
                          function(text) 
                          {
                            // Ensure that only a number may be entered.
                            // TODO: Handle cases like 'o', 'ten', '1,234',
                            // '3,14', etc.
                            var n = window.parseInt(text || 0, 10);
                            return window.isNaN(n) ? null : String(n);
                          }));
          this.setOutput(true);
          this.setTooltip('A number.');
        },
        
        generators :
        {
          JavaScript : function() 
          {
            return window.parseInt(this.getTitleText(0));
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
