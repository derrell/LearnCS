/**
 * The standard input file. This file reads from the terminal.
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

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
    open : function(succ, fail, path)
    {
      var             failureCode;

      // If the file is to be opened for writing, fail the request. We don't
      // yet support writing to files.
      if (this._mode & 0x02)
      {
        failureCode = 
          playground.c.stdio.ABstractFile.FailureCode.PermissionDenied;

        fail(
          {
            type       : "failed",
            statusCode : failureCode
          });

        return;
      }

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
        });

      // Prepare for timeout
      req.addListener(
        "timeout",
        function(e)
        {
          fail(
            {
              type       : "timeout"
            });
        });

      // Prepare for an aborted request (should never occur)
      req.addListener(
        "aborted",
        function(e)
        {
          fail(
            {
              type       : "aborted"
            });
        });

      // Prepare for successfully opening the file
      req.addListener(
        "completed",
        function(e)
        {
          // Split the file data up into its constituent bytes. That becomes
          // our new input buffer.
          this._inBuf = e.getContent().split("");
          succ();
        });

      // Send the request for the file data
      req.send();
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
