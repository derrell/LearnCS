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
  extend : playground.c.stdio.AbstractFile,
  
  construct : function()
  {
    // Call the superclass constructor, indicating that this is an output file.
    this.base(arguments, "w");
  },
  
  members :
  {
    // overridden
    _output : function(len)
    {
      // Send the requested number of bytes to the terminal
      playground.c.Main.output(this._outBuf.slice(0, len));
      
      // Strip that many bytes off of the output buffer
      this._outBuf.splice(0, len);
    }
  }
});
