/**
 * The standard input file. This file reads from the terminal.
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
#ignore(require)
 */

/**
 * @lint ignoreUndefined(require)
 * @lint ignoreUndefined(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
  qx.bConsole = true;
  require("./AbstractFile.js");
  require("./EofError.js");
  require("./Printf.js");
  require("./Scanf.js");
  require("./Stdin.js");
  require("./Stdout.js");
  require("./RemoteFile.js");
  require("./StringIn.js");
  require("./StringOut.js");
}

qx.Class.define("playground.c.stdio.RemoteFile",
{
  extend : playground.c.stdio.AbstractFile,
  
  construct : function()
  {
    var             terminal;

    // Call the superclass constructor, indicating that this is an input file.
    this.base(arguments, "r");
    
    // We allow fewer bytes to be returned than requested, near EOF
    this._bPartialReadOk = true;
  },
  
  members :
  {
    // overridden
    open : function(succ, fail, pathAddr)
    {
      var             i;
      var             failureCode;
      var             path = [];

      // If the file is to be opened for writing, fail the request. We don't
      // yet support writing to files.
      if (this.mode & 0x02)
      {
        failureCode = 
          playground.c.stdio.AbstractFile.FailureCode.PermissionDenied;

        fail(
          {
            type       : "failed",
            statusCode : failureCode
          });

        return;
      }

      // Get memory as an array
      this._mem = playground.c.machine.Memory.getInstance().toArray(0);

      // Copy the null-terminated path string (which is represented as the
      // ASCII character codes of each character) from the given address, one
      // character at a time, into an array.
      for (i = pathAddr; this._mem[i] != 0 && i < this._mem.length; i++)
      {
        path.push(this._mem[i]);
      }

      // Convert each character code into its actual character
      path = String.fromCharCode.apply(null, path);

      try
      {
        // We'll retrieve this file from a remote store
        var req = new qx.io.remote.Request(path, "GET","text/plain");

        // Prepare for failure
        req.addListener(
          "failed",
          function(e)
          {
            var             status = e.getStatusCode();
            var             failureCode;

            switch(status)
            {
            case 404 :
              failureCode = 
                playground.c.stdio.AbstractFile.FailureCode.FileNotFound;
              break;

            default:
              failureCode =
                playground.c.stdio.AbstractFile.FailureCode.Unknown;
            }

            fail(
              {
                type       : "failed",
                statusCode : failureCode
              });
          }.bind(this));

        // Prepare for timeout
        req.addListener(
          "timeout",
          function(e)
          {
            fail(
              {
                type       : "timeout"
              });
          }.bind(this));

        // Prepare for an aborted request (should never occur)
        req.addListener(
          "aborted",
          function(e)
          {
            fail(
              {
                type       : "aborted"
              });
          }.bind(this));

        // Prepare for successfully opening the file
        req.addListener(
          "completed",
          function(e)
          {
            // Split the file data up into its constituent bytes. That becomes
            // our new input buffer.
            this._inBuf = e.getContent().split("");
            succ();
          }.bind(this));

        // Send the request for the file data
        req.send();
      }
      catch(e)
      {
        // We're not in the GUI environment and don't have qx.io.remote.Request
        // so just fail the request.
        failureCode = playground.c.stdio.AbstractFile.FailureCode.FileNotFound;
        fail(
          {
            type       : "failed",
            statusCode : failureCode
          });
      }
    },
    
    // overridden
    _isEof : function()
    {
      // We retrieved the entire file initially, so when there are no bytes
      // left in the input buffer and this function is called, we've reached
      // end of file.
      return true;
    }
  }
});
