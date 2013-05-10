/**
 * The standard output file. This file writes to the terminal.
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.c.stdio.Stderr",
{
  type   : "singleton",
  extend : playground.c.stdio.AbstractFile,
  
  construct : function()
  {
    var             declPointer;
    var             handle;

    // Call the superclass constructor, indicating that this is an output file.
    this.base(arguments, "w");
    
    // We successfully opened the file. Assign a file handle.
    handle = playground.c.stdio.Stdio._stderrFileHandle;

    // Save our file instance at that handle index
    playground.c.stdio.Stdio._openFileHandles[handle] = this;

    // Stderr is line-buffered
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
