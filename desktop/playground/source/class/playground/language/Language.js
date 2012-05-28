/**
 * Copyright (c) 2012 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 */

/*
#use(playground.language.Math)
#use(playground.language.qxmobileui.Container)
#use(playground.language.qxmobileui.WidgetBasic)
#use(playground.language.qxmobileui.WidgetForm)
 */

qx.Class.define("playground.language.Language",
{
  extend : qx.core.Object,
  
  statics :
  {
    __languageData : {},

    registerBlock : function(name, blocklyData)
    {
      // Save the data for this language
      this.__languageData[name] = blocklyData;
    },
    
    registerLanguage : function(statics)
    {
      var             name;

      // For each language component provided...
      for (name in statics)
      {
        // ... register it
        this.registerBlock(name, statics[name]);
      }
    },

    getLanguageData : function()
    {
      // Return the entire map of language data
      return this.__languageData;
    }
  }
});
