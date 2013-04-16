/**
 * FILE structure, common to Stdin, Stdout, and files opened with fopen
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.c.stdio.AbstractFile",
{
  type   : "abstract",
  extend : qx.core.Object,
  
  construct : function(mode)
  {
    this.base(arguments);
    
    // Save the mode, one of "r", "w", "a", "rw"
    this._mode = mode;
    
    // Create arrays for input/output buffering
    this._inBuf = [];
    this._outBuf = [];
  },
  
  members :
  {
    /** The input buffer (array) */
    _inBuf : null,
    
    /** The output buffer (array) */
    _outBuf : null,
    
    /** Size of the input buffer. */
    _inBufLen : 512,
    
    /** Size of the output buffer. Flush when this length is reached. */
    _outBufLen : 512,
    
    /** Whether this (output) file is line-buffered, i.e., flush at '\n' */
    _bLineBuf : false,

    open : function(name, succ, fail)
    {
      throw new Error("open() is abstract");
    },
    
    close : function(succ, fail)
    {
      throw new Error("close() is abstract");
    },
    
    getc : function(succ, fail)
    {
      // If there's a character available in the input buffer...
      if (this._inBuf.length > 0)
      {
        // ... then immediately return that character
        succ(this._inBuf.shift());
      }
      else
      {
        // Otherwise, await more input and then return a character
        this._awaitInput(
          function()
          {
            getc(succ, fail);
          },
          fail);
      }
    },
    
    ungetc : function(c, succ, fail)
    {
      
    },

    putc : function(c, succ, fail)
    {
      // Append this character to the output buffer
      this._outBuf.push(c);
      
      // Begin outputing of characters
      if (this._shouldOutputNow())
      {
        this._outputChar(succ, fail);
      }
      else
      {
        succ();
      }
    },
    
    write : function(bytes, succ, fail)
    {
      var             byteArr;

      // If there are no bytes to write...
      if (bytes.length === 0)
      {
        // ... then we're done.
        succ();
      }

      // If we received a string, ...
      if (typeof bytes == "string")
      {
        // ... then split it into an array of characters and append to outbuf
        Array.prototype.push.apply(this._outBuf, bytes.split(""));
      }
      else
      {
        // otherwise (it's already an array), just append it to outbuf.
        Array.prototype.push.apply(this._outBuf, bytes);
      }
      
      // Begin outputing of characters
      if (this._shouldOutputNow())
      {
        this._output(succ, fail);
      }
    },
    
    read : function(numBytes, succ, fail)
    {
      
    },
    
    flush : function(succ, fail)
    {
      
    },

    setbuf : function(buffer, maxLen)
    {
      
    },
    
    _shouldOutputNow : function()
    {
      
    },

    _output : function(succ, fail)
    {
      throw new Error("_output is abstract");
    },
    
    _awaitInput : function(succ, fail)
    {
      var             terminal;
      
/******* replace this with playground.c.AbstractSyntaxTree.input() *********/
      terminal = qx.core.Init.getApplication().getUserData("terminal");
      terminal.addListenerOnce(
        "textline",
        function(e)
        {
          Array.prototype.push.apply(this._inBuf, e.getData());
          succ();
        },
        this);
/***************************************************************************/
    }
  }
});
