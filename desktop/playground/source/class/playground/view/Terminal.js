/**
 * Terminal window
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.view.Terminal",
{
  extend : qx.ui.groupbox.GroupBox,
  
  construct : function()
  {
    // Call the superclass constructor, and give us a legend.
    this.base(arguments, "Terminal");
    
    // Create the embedded text field, which is the actual point of user
    // interaction
    this._textField = new qx.ui.form.TextField();
    
    // The terminal must use a fixed-width font, and we want a changeValue
    // event on every key input
    this._textField.set(
      {
        font       : "monospace",
        liveUpdate : true
      });
    
    // Trap keyboard input
    this.addListener("changeValue", this._onChangeValue);
    
    // Prepare to store input characters
    this._inbuf = [];
  },
  
  members :
  {
    /** Input buffer */
    _inbuf : null,

    /** Event listener for changeValue event */
    _onChangeValue : function(e)
    {
      
    }
  }
});
