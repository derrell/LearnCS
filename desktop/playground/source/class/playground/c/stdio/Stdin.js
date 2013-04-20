/**
 * The standard input file. This file reads from the terminal.
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.c.stdio.Stdin",
{
  extend : playground.c.stdio.AbstractFile,
  
  /**
   * @lint ignoreUndefined(process.stdin)
   * @lint ignoreUndefined(process.stdin.resume)
   * @lint ignoreUndefined(process.stdin.on)
   */
  construct : function()
  {
    var             terminal;

    // Call the superclass constructor, indicating that this is an input file.
    this.base(arguments, "r");
    
    // Arrange to be notified when there's input data available
    try
    {
      terminal = qx.core.Init.getApplication().getUserData("terminal");
      terminal.addListener(
        "textline",
        function(e)
        {
          // We've received input data. Add it to the input buffer.
          Array.prototype.push.apply(this._inBuf, e.getData().split(""));
          
          // Notify our superclass that data is available
          this.fireDataEvent("inputdata");
        },
        this);
    }
    catch(e)
    {
      process.stdin.resume();
      process.stdin.on(
        "data",
        function(chunk)
        {
          // We've received input data. Add it to the input buffer.
          Array.prototype.push.apply(this._inBuf, chunk);
          
          // Notify our superclass that data is available
          this.fireDataEvent("inputdata");
        }.bind(this));
    }
  }
});
