/**
 * Abstract syntax tree nodes
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
  require("./Scanf");
  require("./Printf");
}

qx.Class.define("playground.c.stdio.Stdio",
{
  type   : "static",
  
  statics :
  {
    /** Mappings to open files */
    _openFileHandles : {},

    /** Next open file index */
    _nextFileHandle : 0x1000,

    fopen : function(success, failure, path, rw)
    {
      var             remoteFile;
      var             handle;
      
      // Create a remote file instance
      remoteFile = new playground.c.stdio.RemoteFile(rw);
      
      // Try to open the requested file
      remoteFile.open(
        function()
        {
          var             declPointer;
          var             specVoid;

          // We successfully opened the file. Assign a file handle.
          handle = playground.c.stdio.Stdio._nextFileHandle++;
          
          // Save this remote file instance at that handle
          playground.c.stdio.Stdio._openFileHandles[handle] = remoteFile;
          
          // Create a pointer declarator for the return value
          declPointer = new playground.c.lib.Declarator(
            playground.c.lib.Node._currentNode,
            "pointer");
          
          // The return value is a pointer to void
          specVoid = new playground.c.lib.Specifier(
            playground.c.lib.Node._currentNode,
            "void");

          // Create a return value and return it
          success(
            {
              value       : handle,
              specAndDecl : [ declPointer, specVoid ]
            });
        },
        failure,
        path);
    },

    fclose : function(success, failure, handle)
    {
      // See if this handle is in our open-files map
      if (playground.c.stdio.Stdio._openFileHandles[handle])
      {
        // It is. Flush its output, ...
        handle.flush(
          function()
          {
            // ... remove it from the open files map, ...
            delete playground.c.stdio.Stdio._openFileHandles[handle];
            
            // and let 'em know we're done.
            success();
          },
          failure);
      }
      else
      {
        // Let 'em know they're trying to close something that isn't open
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "This file handle is not currently open"));
      }
    },

    /**
     * Print a formatted string to stdout
     * 
     * @param formatAddr {Integer}
     *   The address of the format string
     * 
     * @param optargs {Any}
     *   Additional arguments, as specified by the format string
     */
    printf : function(success, failure, formatAddr, optargs)
    {
      var args = Array.prototype.slice.call(arguments);
      var handle = playground.c.Main.stdout;
      
      // Insert stdout as the handle argument to fprintf
      args.splice(2, 0, playground.c.Main.stdout);
      
      // Now fprintf can handle this.
      playground.c.stdio.Stdio.fprintf.apply(null, args);
    },
    
    /**
     * Print a formatted string to a specified handle
     *
     * @param handle {playground.c.stdio.AbstractFile}
     *   The handle to which output should be written
     *
     * @param formatAddr {Integer}
     *   The address of the format string
     *
     * @param optargs {Any}
     *   Additional arguments, as specified by the format string
     */
    fprintf : function(success, failure, handle, formatAddr, optargs)
    {
      var             args = Array.prototype.slice.call(arguments);
      var             formatter;
      var             string;

      // Delete the four fixed parameters (success, failure, handle,
      // formatAddr). We have them as named parameters already.
      args.splice(0, 4);

      try
      {
        formatter = new playground.c.stdio.Printf(formatAddr);
        string = formatter.format.apply(formatter, args);
        handle.write(string.split(""), 
                     function()
                     {
                       var             specOrDecl;

                       // Create a specifier for the return value
                       specOrDecl = new playground.c.lib.Specifier(
                         playground.c.lib.Node._currentNode,
                         "int");

                       success(
                         {
                           value       : 23, // FIXME! Return # of conversions.
                           specAndDecl : [ specOrDecl ]
                         });
                     },
                     failure);
      }
      catch(e)
      {
        failure(e);
      }
    },

    scanf : function(success, failure, formatAddr, optargs)
    {
      var args = Array.prototype.slice.call(arguments);
      var handle = playground.c.Main.stdout;
      
      // Insert stdin as the handle argument to fscanf
      args.splice(2, 0, playground.c.Main.stdin);
      
      // Now fscanf can handle this.
      playground.c.stdio.Stdio.fscanf.apply(null, args);
    },

    fscanf : function(success, failure, handle, formatAddr, optargs)
    {
      var             scanf;
      var             numConversions;
      var             specOrDecl;
      
      try
      {
        // If we don't already have an AbstractFile object...
        if (! (handle instanceof playground.c.stdio.AbstractFile))
        {
          // ... retrieve it from the specified handle
          handle = playground.c.stdio.Stdio._openFileHandles[handle];
          
          // Did we find one?
          if (typeof handle == "undefined")
          {
            // Create a specifier for the return value
            specOrDecl = new playground.c.lib.Specifier(
              playground.c.lib.Node._currentNode,
              "int");

            success(
              {
                value       : playground.c.stdio.AbstractFile.EOF,
                specAndDecl : [ specOrDecl ]
              });
            return;
          }
        }

        // Get a Scanf instance, which retrieves the format string from memory
        scanf = new playground.c.stdio.Scanf(formatAddr);

        // Copy the arguments
        scanf._args = Array.prototype.slice.call(arguments);
      
        // Replace the handle with the one we've determined.
        scanf._args[2] = handle;

        // Delete the formatAddr parameter since we've already determined the
        // format string (and it's been stored in this.format).
        scanf._args.splice(3, 1);

        // Remove the success function and replace it with one of our own,
        // which converts the integer return value into a value/specAndDecl
        // object.
        scanf._args.shift();
        scanf._args.unshift(
          function(ret)
          {
            var             specOrDecl;

            // Create a specifier for the return value
            specOrDecl = new playground.c.lib.Specifier(
              playground.c.lib.Node._currentNode,
              "int");

            success(
              {
                value       : ret,
                specAndDecl : [ specOrDecl ]
              });
          });

        // Now process the request
        numConversions = scanf.doscan.apply(scanf, scanf._args);
      }
      catch(e)
      {
        failure(e);
      }
    }
  }
});
