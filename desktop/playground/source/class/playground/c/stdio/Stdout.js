/**
 * The standard output file. This file writes to the terminal.
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.c.stdio.Stdout",
{
  type   : "singleton",
  extend : playground.c.stdio.AbstractFile,
  
  construct : function()
  {
    // Call the superclass constructor, indicating that this is an output file.
    this.base(arguments, "w");
    
    // Stdout is line-buffered
    this._bLineBuf = true;
  },
  
  members :
  {
    // overridden
    init : function()
    {
      // Flush any pending output
      if (this._outBuf && this._outBuf.length > 0)
      {
        this._output(this._outBuf.length);
      }
      
      // Now call the superclass method to complete the (re)initialization
      this.base(arguments);
    },

    // overridden
    _output : function(len)
    {
      // Send the requested number of bytes to the terminal
      playground.c.Main.output(this._outBuf.slice(0, len).join(""));
      
      // Strip that many bytes off of the output buffer
      this._outBuf.splice(0, len);
    }
  }
});
