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
  type   : "singleton",
  extend : playground.c.stdio.AbstractFile,
  
  /**
   * @lint ignoreUndefined(process.stdin)
   * @lint ignoreUndefined(process.stdin.resume)
   * @lint ignoreUndefined(process.stdin.on)
   * @lint ignoreUndefined(process.stdin._bEof)
   */
  construct : function()
  {
    var             handle;

    // Call the superclass constructor, indicating that this is an input file.
    this.base(arguments, "r");
    
    // We successfully opened the file. Assign a file handle.
    handle = playground.c.stdio.Stdio._stdinFileHandle;

    // Save our file instance at that handle index
    playground.c.stdio.Stdio._openFileHandles[handle] = this;
    
    // Arrange to be notified when there's input data available
    try
    {
      this._terminal = qx.core.Init.getApplication().getUserData("terminal");
      this._terminal.addListener(
        "textline",
        function(e)
        {
          // We've received input data. Add it to the input buffer.
          Array.prototype.push.apply(this._inBuf, e.getData().split(""));
          
          // Notify our superclass that data is available
          this.fireEvent("inputdata");
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
          Array.prototype.push.apply(this._inBuf, chunk.toString().split(""));
          
          // Notify our superclass that data is available
          this.fireEvent("inputdata");
        }.bind(this));
      process.stdin.on(
        "close",
        function()
        {
          process.stdin._bEof = true;
        });
    }
  },
  
  members :
  {
    // overridden
    getc : function(succ, fail)
    {
      var             base = arguments.callee.base.bind(this);

      // flush stdout
      playground.c.stdio.Stdout.getInstance().flush(
        function()
        {
          // Now we can call the superclass to do all of the work
          base(succ, fail);
        }.bind(this),
        fail);
    },
    
    read : function(succ, fail)
    {
      var             base = arguments.callee.base.bind(this);

      // flush stdout
      playground.c.stdio.Stdout.getInstance().flush(
        function()
        {
          // Now we can call the superclass to do all of the work
          base(succ, fail);
        }.bind(this),
        fail);
    },
    
    // overridden
    _isEof : function()
    {
      try
      {
        return this._terminal.getEof();
      }
      catch(e)
      {
        // No terminal. See if we've set the 'eof' flag.
        /** @lint ignoreUndefined(process.stdin._bEof) */
        return process.stdin._bEof;
      }
    },
    
    /**
     * Inject input into this stream
     * 
     * @param data {String}
     *   String to inject as input to stdin
     */
    inject : function(data)
    {
      Array.prototype.push.apply(this._inBuf, data);
    }
  }
});
