/**
 * Simulate a file output to a string.
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 */
if (typeof qx === "undefined")
{
  require("../machine/Memory");
}


qx.Class.define("playground.c.stdio.StringOut",
{
  extend : playground.c.stdio.AbstractFile,
  
  construct : function(outputStrAddr, maxLen)
  {
    // Save the address to which we'll flush the string output
    this._outputStrAddr = outputStrAddr;
    
    // Ensure some reasonable maxLen value
    if (maxLen <= 0)
    {
      throw new Error("Maximum string length must be positive");
    }

    // Save the maximum number of bytes to write to that address
    this._maxLen = maxLen;
  },
  
  members :
  {
    // overridden
    putc : function(c, succ, fail)
    {
      // Is there room to add this character?
      if (this._maxLen > 0)
      {
        // Yup. We can handle one fewer characters now
        --this._maxLen;
    
        // Call the superclass constructor
        this.base(arguments, c, succ, fail);
      }
      else
      {
        // No room to add this character. Ignore it, but flush the buffer
        this.flush(succ, fail);
      }
    },
    
    // overridden
    write : function(bytes, succ, fail)
    {
      // Is there room to add some number of bytes?
      if (this._maxLen > 0)
      {
        // Yup. Ensure we don't write any more than there is room for
        bytes.splice(0, this._maxLen);

        // We can handle fewer additional characters now
        this._maxLen -= bytes.length;
    
        // Call the superclass constructor
        this.base(arguments, bytes, succ, fail);
      }
      else
      {
        // No room to add these bytes. Ignore them, but flush the buffer
        this.flush(succ, fail);
      }
    },

    // overridden
    _output : function(len)
    {
      var             mem;
      var             i;

      // If there's something in the output buffer...
      if (this._outBuf.length > 0)
      {
        // ... then we'll write it to the specified output address.
        // Get a reference to the memory instance
        mem = playground.c.machine.Memory.getInstance();

        // Write the string, as character codes, at the specified address
        for (i = 0; i <= len && i < this._outBuf.length; i++)
        {
          playground.c.lib.Node.__mem.set(this._outputStrAddr + i, 
                                          "char",
                                          this._outBuf.charCodeAt(i));
        }
      }
      
      // If there's room for a final null terminator...
      if (this._outBuf.length < this._maxLen)
      {
        // ... then add it
        playground.c.lib.Node.__mem.set(
          this._outputStrAddr + this._outBuf.length, 
          "char",
          0);
      }
      
      // Strip that many bytes off of the output buffer
      this._outBuf.splice(0, len);
    }
  }
});
