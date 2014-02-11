/**
 * Simulate a file input from a string.
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @ignore(require)
 */
if (typeof qx === "undefined")
{
  require("../machine/Memory");
}


qx.Class.define("playground.c.stdio.StringIn",
{
  extend : playground.c.stdio.AbstractFile,
  
  construct : function(inputStrAddr)
  {
    var             mem;
    var             memBytes;
    var             inputStr;
    var             i;

    // Get memory as an array
    mem = playground.c.machine.Memory.getInstance();
    memBytes = this._mem.toArray(0);

    // Copy the null-terminated input string (which is represented as the
    // ASCII character codes of each character) from the given address, one
    // character at a time, into an array.
    for (i = inputStrAddr; memBytes[i] != 0 && i < memBytes.length; i++)
    {
      inputStr.push(memBytes[i]);
    }
    
    // Convert each character code in the input string into its actual
    // character, and join it back together into a single JavaScript string
    this._inBuf = (String.fromCharCode.apply(null, inputStr)).join("");
  },
  
  members :
  {
    // overridden
    _isEof : function()
    {
      // If the input string has been exhausted, we're at end-of-file.
      return this._inBuf.length === 0;
    }
  }
});
