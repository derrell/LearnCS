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

#require(playground.c.stdio.Stdin)
#require(playground.c.stdio.Stdout)
#require(playground.c.stdio.Stderr)
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

    /** File handle for stdin */
    _stdinFileHandle  : 0x1000,
    
    /** File handle for stdout */
    _stdoutFileHandle : 0x1001,

    /** File handle for stderr. All other file handles come after this one. */
    _stderrFileHandle : 0x1002,

    /** Next open file index */
    _nextFileHandle : null,

    include : function(name, line)
    {
      var             rootSymtab;
      var             mem;
      var             stdin;
      var             stdout;
      var             stderr;
      
      try
      {
        // Get the memory singleton instance
        mem = playground.c.machine.Memory.getInstance();

        // Get the root symbol table
        rootSymtab = playground.c.lib.Symtab.getByName("*");

        // Save the standard handles, if they exists
        stdin = playground.c.stdio.Stdio._openFileHandles[
                   playground.c.stdio.Stdio._stdinFileHandle];
        stdout = playground.c.stdio.Stdio._openFileHandles[
                   playground.c.stdio.Stdio._stdoutFileHandle];
        stderr = playground.c.stdio.Stdio._openFileHandles[
                   playground.c.stdio.Stdio._stderrFileHandle];

        // Initialize the open-file map and next file handle
        playground.c.stdio.Stdio._openFileHandles = {};
        playground.c.stdio.Stdio._nextFileHandle = 
          playground.c.stdio.Stdio._stderrFileHandle + 1;

        // Restore the standard handles, if they existed
        playground.c.stdio.Stdio._openFileHandles[
          playground.c.stdio.Stdio._stdinFileHandle] = stdin;
        playground.c.stdio.Stdio._openFileHandles[
          playground.c.stdio.Stdio._stdoutFileHandle] = stdout;
        playground.c.stdio.Stdio._openFileHandles[
          playground.c.stdio.Stdio._stderrFileHandle] = stderr;
        
        //
        // Add built-in functions.
        //
        [
          {
            name : "fopen",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.fopen.apply(null, args);
            }
          },
          {
            name : "fclose",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.fclose.apply(null, args);
            }
          },
          {
            name : "getchar",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.getchar.apply(null, args);
            }
          },
          {
            name : "fgetc",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.fgetc.apply(null, args);
            }
          },
          {
            name : "getc",
            func : function()
            {
              // getc is an alias for fgetc
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.fgetc.apply(null, args);
            }
          },
          {
            name : "ungetc",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.ungetc.apply(null, args);
            }
          },
          {
            name : "putchar",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.putchar.apply(null, args);
            }
          },
          {
            name : "printf",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.printf.apply(null, args);
            }
          },
          {
            name : "fprintf",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.fprintf.apply(null, args);
            }
          },
          {
            name : "scanf",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.scanf.apply(null, args);
            }
          },
          {
            name : "fscanf",
            func : function()
            {
              var args = Array.prototype.slice.call(arguments);
              playground.c.stdio.Stdio.fscanf.apply(null, args);
            }
          }
        ].forEach(
          function(info)
          {
            var             entry;
            var             declarator;
            var             node;

            // Simulate a node, for the specifiers and declarators
            node =
              {
                line : line,
                toString : function()
                {
                  return info.name;
                }
              };

            // Add this symbol to the symbol table
            entry = rootSymtab.add(info.name, 0, false);
            if (! entry)
            {
              throw new playground.c.lib.RuntimeError(
                node,
                info.name + " being redefined. " +
                  "Is stdio.h included multiple times?");
            }

            declarator = new playground.c.lib.Declarator(
              {
                line : line,
                toString : function()
                {
                  return info.name;
                }
              });
            declarator.setBuiltIn(info.func);

            // Add the declarator to the symbol table entry
            entry.setSpecAndDecl( [ declarator ]);
          },
          this);

        // Define constants
        [
          {
            name : "EOF",
            func : function(entry, node)
            {
              var             specifier;
              specifier = new playground.c.lib.Specifier(node, "int");
              specifier.setConstant("constant");

              entry.setSpecAndDecl(
                [
                  specifier
                ]);
              entry.calculateOffset();
              mem.set(entry.getAddr(), "int", -1);
            }
          },
          {
            name : "NULL",
            func : function(entry, node)
            {
              var             specifier;
              specifier = new playground.c.lib.Specifier(node, "void");
              specifier.setConstant("constant");

              entry.setSpecAndDecl(
                [
                  new playground.c.lib.Declarator(node, "pointer"),
                  specifier
                ]);
              entry.calculateOffset();
              mem.set(entry.getAddr(), "pointer", 0);
            }
          },
          {
            name : "stdin",
            func : function(entry, node)
            {
              var             specifier;
              specifier = new playground.c.lib.Specifier(node, "void");
              specifier.setConstant("constant");

              entry.setSpecAndDecl(
                [
                  new playground.c.lib.Declarator(node, "pointer"),
                  specifier
                ]);
              entry.calculateOffset();
              mem.set(entry.getAddr(), 
                      "pointer", 
                      playground.c.stdio.Stdio._stdinFileHandle);
            }
          },
          {
            name : "stdout",
            func : function(entry, node)
            {
              var             specifier;
              specifier = new playground.c.lib.Specifier(node, "void");
              specifier.setConstant("constant");

              entry.setSpecAndDecl(
                [
                  new playground.c.lib.Declarator(node, "pointer"),
                  specifier
                ]);
              entry.calculateOffset();
              mem.set(entry.getAddr(), 
                      "pointer", 
                      playground.c.stdio.Stdio._stdoutFileHandle);
            }
          },
          {
            name : "stderr",
            func : function(entry, node)
            {
              var             specifier;
              specifier = new playground.c.lib.Specifier(node, "void");
              specifier.setConstant("constant");

              entry.setSpecAndDecl(
                [
                  new playground.c.lib.Declarator(node, "pointer"),
                  specifier
                ]);
              entry.calculateOffset();
              mem.set(entry.getAddr(), 
                      "pointer", 
                      playground.c.stdio.Stdio._stderrFileHandle);
            }
          }
        ].forEach(
          function(info)
          {
            var             entry;
            var             node;

            // Simulate a node, for the specifiers and declarators
            node =
              {
                line : line,
                toString : function()
                {
                  return info.name;
                }
              };

            // Create the symbol table entry for this defined constant
            entry = rootSymtab.add(info.name, 0, false, false, true);
            if (! entry)
            {
              throw new playground.c.lib.RuntimeError(
                node,
                info.name + " being redefined. " +
                  "Is stdio.h included multiple times?");
            }

            // Call the provided function to initialize the value and create and
            // set she specifier/declarator list in the symbol table entry
            info.func(entry, node);
          });

        // Define types
        [
          {
            name : "FILE",
            func : function(entry, node)
            {
              var             specifier;
              specifier = new playground.c.lib.Specifier(node, "int");
              specifier.setStorage("typedef");

              entry.setSpecAndDecl(
                [
                  specifier
                ]);
            }
          }
        ].forEach(
          function(info)
          {
            var             entry;
            var             node;

            // Simulate a node, for the specifiers and declarators
            node =
              {
                line : line,
                toString : function()
                {
                  return info.name;
                }
              };

            // Create the symbol table entry for this typedef
            entry = rootSymtab.add(info.name, 0, true, false, false);
            if (! entry)
            {
              throw new playground.c.lib.RuntimeError(
                node,
                info.name + " being redefined. " +
                  "Is stdio.h included multiple times?");
            }

            // Call the provided function to initialize the value and create and
            // set she specifier/declarator list in the symbol table entry
            info.func(entry, node);
          });
      }
      catch(e)
      {
        return e;
      }
      
      return null;
    },
    
    finalize : function()
    {
      var             handle;
      var             remoteFile;

      if (Object.keys(playground.c.stdio.Stdio._openFileHandles).length > 0)
      {
        for (handle in playground.c.stdio.Stdio._openFileHandles)
        {
          if ([
                playground.c.stdio.Stdio._stdinFileHandle,
                playground.c.stdio.Stdio._stdoutFileHandle,
                playground.c.stdio.Stdio._stderrFileHandle
              ].indexOf(handle) != -1)
          {
            remoteFile = playground.c.stdio.Stdio._openFileHandles[handle];
            playground.c.Main.output(
              "*** Unclosed file opened at line " +
                remoteFile.getUserData("line") + "\n");
          }
        }
      }
    },

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

          // Save the path and line number
          remoteFile.setUserData("path", path);
          remoteFile.setUserData("line",
                                 playground.c.lib.Node._currentNode.line);

          // Create a return value and return it
          success(
            {
              value       : handle,
              specAndDecl : [ declPointer, specVoid ]
            });
        },
        function(reason)
        {
          var             declPointer;
          var             specVoid;

          // Create a pointer declarator for the return value
          declPointer = new playground.c.lib.Declarator(
            playground.c.lib.Node._currentNode,
            "pointer");
          
          // The return value is a pointer to void
          specVoid = new playground.c.lib.Specifier(
            playground.c.lib.Node._currentNode,
            "void");

          // Convert the failure to success(NULL)
          success(
            {
              value       : 0,  // NULL
              specAndDecl : [ declPointer, specVoid ]
            });
        },
        path);
    },

    fclose : function(success, failure, handle)
    {
      var             stream;
      
      // Convert the handle to the stream object
      stream = playground.c.stdio.Stdio._openFileHandles[handle];

      // See if this handle is in our open-files map
      if (stream)
      {
        // It is. Flush its output, ...
        stream.flush(
          function()
          {
            // ... remove it from the open files map, ...
            delete playground.c.stdio.Stdio._openFileHandles[handle];
            
            // and let 'em know we're done.
            success();
          },
          failure,
          true);
      }
      else
      {
        // Let 'em know they're trying to close something that isn't open
        failure(new playground.c.lib.RuntimeError(
                  playground.c.lib.Node._currentNode,
                  "This file handle is not currently open"));
        return;
      }
    },

    /**
     * Get a single character from stdin
     */
    getchar : function(success, failure)
    {
      playground.c.stdio.Stdin.getInstance().getc(
        function(ch)
        {
          var             specOrDecl;

          // Create a specifier for the return value
          specOrDecl = new playground.c.lib.Specifier(
            playground.c.lib.Node._currentNode,
            "int");

          success(
            {
              value       : typeof ch == "string" ? ch.charCodeAt(0) : ch,
              specAndDecl : [ specOrDecl ]
            });
        },
        failure);
    },
    
    /**
     * Write a single character to stdout
     * 
     * @param c {Character}
     *   The character to write
     */
    putchar : function(success, failure, c)
    {
      playground.c.stdio.Stdout.getInstance().putc(
        String.fromCharCode(c),
        function(ch)
        {
          var             specOrDecl;

          // Create a specifier for the return value
          specOrDecl = new playground.c.lib.Specifier(
            playground.c.lib.Node._currentNode,
            "int");

          success(
            {
              value       : ch,
              specAndDecl : [ specOrDecl ]
            });
        },
        failure);
    },
    
    /**
     * Get a single character from an open file
     *
     * @param handle {playground.c.stdio.AbstractFile}
     *   The handle to which output should be written
     */
    fgetc : function(success, failure, handle)
    {
      var             stream;
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // If we don't already have an AbstractFile object...
      if (! (handle instanceof playground.c.stdio.AbstractFile))
      {
        // ... retrieve it from the specified handle
        stream = playground.c.stdio.Stdio._openFileHandles[handle];

        // Did we find one?
        if (typeof stream == "undefined")
        {
          failure(new playground.c.lib.RuntimeError(
                    playground.c.lib.Node._currentNode,
                    "Invalid file handle, causing an attempt to access an " +
                    "uninitialized or illegal memory address. " +
                    "(This is sometimes called a 'Segmentation Fault'.)"));
          return;
        }
      }
      else
      {
        stream = handle;
      }
      
      // Read a character from the designated stream
      stream.getc(
        function(ch)
        {
          success(
            {
              value       : typeof ch == "string" ? ch.charCodeAt(0) : ch,
              specAndDecl : [ specOrDecl ]
            });
        },
        failure);
    },

    /**
     * Push a single character back onto an input stream
     *
     * @param c {Character}
     *   The character to be pushed back onto the input stream
     * 
     * @param handle {playground.c.stdio.AbstractFile}
     *   The file handle
     */
    ungetc : function(success, failure, c, handle)
    {
      var             stream;
      var             specOrDecl;

      // Create a specifier for the return value
      specOrDecl = new playground.c.lib.Specifier(
        playground.c.lib.Node._currentNode,
        "int");

      // If we don't already have an AbstractFile object...
      if (! (handle instanceof playground.c.stdio.AbstractFile))
      {
        // ... retrieve it from the specified handle
        stream = playground.c.stdio.Stdio._openFileHandles[handle];

        // Did we find one?
        if (typeof stream == "undefined")
        {
          success(
            {
              value       : playground.c.stdio.AbstractFile.EOF,
              specAndDecl : [ specOrDecl ]
            });
          return;
        }
      }
      else
      {
        stream = handle;
      }
      
      // Put the character back onto the input stream
      stream.ungetc(String.fromCharCode(c));

      success(
        {
          value       : String.fromCharCode(c),
          specAndDecl : [ specOrDecl ]
        });
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
      
      // Insert stdout as the stream argument to fprintf
      args.splice(2, 0, playground.c.Main.stdout);
      
      // Now fprintf can take it from here.
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
      var             stream;
      var             formatter;
      var             string;
      var             specOrDecl;

      // Delete the four fixed parameters (success, failure, handle,
      // formatAddr). We have them as named parameters already.
      args.splice(0, 4);

      try
      {
        // If we don't already have an AbstractFile object...
        if (! (handle instanceof playground.c.stdio.AbstractFile))
        {
          // ... retrieve it from the specified handle
          stream = playground.c.stdio.Stdio._openFileHandles[handle];
          
          // Did we find one?
          if (typeof stream == "undefined")
          {
            // Create a specifier for the return value
            specOrDecl = new playground.c.lib.Specifier(
              playground.c.lib.Node._currentNode,
              "int");

            failure(new playground.c.lib.RuntimeError(
                      playground.c.lib.Node._currentNode,
                      "Invalid file handle, causing an attempt to access an " +
                      "uninitialized or illegal memory address. " +
                      "(This is sometimes called a 'Segmentation Fault'.)"));
            return;
          }
        }
        else
        {
          stream = handle;
        }

        formatter = new playground.c.stdio.Printf(formatAddr);
        string = formatter.format.apply(formatter, args);
        stream.write(string.split(""), 
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
      
      // Insert stdin as the stream argument to fscanf
      args.splice(2, 0, playground.c.Main.stdin);
      
      // Now fscanf can take it from here.
      playground.c.stdio.Stdio.fscanf.apply(null, args);
    },

    fscanf : function(success, failure, handle, formatAddr, optargs)
    {
      var             scanf;
      var             stream;
      var             numConversions;
      var             specOrDecl;
      
      try
      {
        // If we don't already have an AbstractFile object...
        if (! (handle instanceof playground.c.stdio.AbstractFile))
        {
          // ... retrieve it from the specified handle
          stream = playground.c.stdio.Stdio._openFileHandles[handle];
          
          // Did we find one?
          if (typeof stream == "undefined")
          {
            // Create a specifier for the return value
            specOrDecl = new playground.c.lib.Specifier(
              playground.c.lib.Node._currentNode,
              "int");

            failure(new playground.c.lib.RuntimeError(
                      playground.c.lib.Node._currentNode,
                      "Invalid file handle, causing an attempt to access an " +
                      "uninitialized or illegal memory address. " +
                      "(This is sometimes called a 'Segmentation Fault'.)"));
            return;
          }
        }
        else
        {
          stream = handle;
        }

        // Get a Scanf instance, which retrieves the format string from memory
        scanf = new playground.c.stdio.Scanf(formatAddr);

        // Copy the arguments
        scanf._args = Array.prototype.slice.call(arguments);
      
        // Replace the handle with the one we've determined.
        scanf._args[2] = stream;

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
