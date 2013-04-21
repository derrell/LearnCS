/**
 * An abstract FILE structure, common to Stdin, Stdout, and files opened with
 * fopen.
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
    
    // Save the mode, one of "r", "w", "rw"
    switch(mode)
    {
    case "r" :
      this._mode = 0x01;
      break;
      
    case "w" :
      this._mode = 0x02;
      break;
      
    case "rw" :
      this._mode = 0x03;
      break;
      
    default :
      throw new Error("Unrecognized stdio mode: " + mode);
    }
    
    // Initialize this stream
    this.init();
  },
  
  events :
  {
    /** Fired when new input data is available */
    "inputdata" : "qx.event.type.Event"
  },

  statics :
  {
    /** Value returned upon end of file */
    EOF : -1,
    
    /** Open files that need to be flushed upon program completion */
    _openFiles : [],
    
    /**
     *  Called upon program completion to flush output and close all files
     *  other than stdin, stdout
     */
    onProgramEnd : function()
    {
      var             i;
      var             stdin;
      var             stdout;
      var             openFiles;
      
      // Get the two always-open files
      stdin = playground.c.stdio.Stdin.getInstance();
      stdout = playground.c.stdio.Stdout.getInstance();
      
      // Get the open file array for quick access
      openFiles = playground.c.stdio.AbstractFile._openFiles;

      // For each open file...
      if (openFiles.length > 0)
      {
        (function(i)
         {
           var             fSelf = arguments.callee;
           var             handle;

           // Get the current file's handle
           handle = openFiles[i];

           // Call this file's flush function with the 'quiet' flag
           handle.flush(
             function()
             {
               // If there are more entries in the open file array...
               if (i < openFiles.length - 1)
               {
                 // ... then call the outer function again
                 fSelf(i + 1);

                 // While unwinding, remove array entries other than
                 // stdin/stdout
                 if (handle != stdin && handle != stdout)
                 {
                   openFiles.splice(i, 1);
                 }
               }
             },
             function()
             {
               throw new Error("Failed to flush files on program end");
             },
             true);
         })(0);
      }
    }
  },

  members :
  {
    /** The input buffer (array) */
    _inBuf : null,
    
    /** The output buffer (array) */
    _outBuf : null,
    
    /** Size of the input and output buffers. */
    _bufLen : 512,
    
    /** Whether this (output) file is line-buffered, i.e., flush at '\n' */
    _bLineBuf : false,

    /**
     * Reinitialize this stream. This is used only internally, when re-running
     * the program.
     */
    init : function()
    {
      // Create arrays for input/output buffering
      this._inBuf = [];
      this._outBuf = [];
      
      // If this file isn't already in the open files array...
      if (playground.c.stdio.AbstractFile._openFiles.indexOf(this) === -1)
      {
        // ... then add it to the array
        playground.c.stdio.AbstractFile._openFiles.push(this);
      }
    },

    /**
     * Read one character from the file. This function blocks until the
     * character is available to be read and returned, or EOF is encountered.
     * 
     * @param succ {Function}
     *   Function to call upon having successfully read a character from the
     *   file. The function is passed, as the one and only argument, the
     *   character that was read.
     * 
     * @param fail {Function}
     *   Function to call upon error reading a character. The function will be
     *   called with a playground.c.lib.RuntimeError instance.
     */
    getc : function(succ, fail)
    {
      // Ensure the file is opened for reading
      if (! (this._mode & 0x01))
      {
        fail(new playground.c.lib.RuntimeError(
               playground.c.lib.Node._currentNode,
               "Can not call getc() on this file. " +
               "It is not open for reading."));
      }

      // If there's a character available in the input buffer...
      if (this._inBuf.length > 0)
      {
        // ... then return that character, removing it from the input buffer
        succ(this._inBuf.shift());
        return;
      }

      // If we're at end-of-file...
      if (this._isEof())
      {
        // Yup. Indicate EOF.
        fail(new playground.c.stdio.EofError);
        return;
      }

      // Wait for new characters to be available in inbuf, and then try again.
      this.addListenerOnce(
        "inputdata",
        function(e)
        {
          this.getc(succ, fail);
        },
        this);
    },
    
    /**
     * Put a character back onto the input stream.
     * 
     * @param c {String}
     *   The single character to put back onto the input stream.
     */
    ungetc : function(c, succ, fail)
    {
      // Ensure the file is opened for reading
      if (! (this._mode & 0x01))
      {
        throw new playground.c.lib.RuntimeError(
          playground.c.lib.Node._currentNode,
          "Can not call ungetc() on this file. " +
          "It is not open for reading.");
      }

      // Put the character onto the input stream, as the next character to read
      this._inBuf.unshift(c);
      
      // Fire an event, in case someone is waiting on a read
      this.fireEvent("inputdata");
    },

    /**
     * Read bytes from the file. This function blocks until the specified
     * number of bytes are available to be read and returned.
     *
     * @param numBytes {Integer}
     *   The number of bytes to read from the file.
     *
     * @param succ {Function}
     *   Function to call upon having successfully read a character from the
     *   file. The function is passed, as the one and only argument, the
     *   character that was read.
     * 
     * @param fail {Function}
     *   Function to call upon error reading a character. The function will be
     *   called with a playground.c.lib.RuntimeError instance.
     */
    read : function(numBytes, succ, fail)
    {
      var             ret;

      // Ensure the file is opened for reading
      if (! (this._mode & 0x01))
      {
        fail(new playground.c.lib.RuntimeError(
               playground.c.lib.Node._currentNode,
               "Can not call read() on this file. " +
               "It is not open for reading."));
      }

      // Do we have enough data in the input buffer to fulfill the request?
      if (this._inBuf.length > numBytes)
      {
        // Yup. Get the return data by copying the beginning portion of inbuf.
        ret = this._inBuf.slice(0, numBytes);
        
        // Now strip those bytes off of the beginning of inbuf
        this._inBuf.splice(0, numBytes);
        
        // Give 'em what they came for!
        succ(ret);
        
        return;
      }

      // If we're at end-of-file...
      if (this._isEof())
      {
        // Yup. Indicate EOF.
        fail(new playground.c.stdio.EofError);
        return;
      }

      // Wait for new characters to be available in inbuf, and then try again.
      this.addListenerOnce(
        "inputdata",
        function(e)
        {
          this.read(numBytes, succ, fail);
        },
        this);
    },
    
    /**
     * Append a character to a output buffer for the file. If the output
     * buffer size is exceeded, the buffer is flushed. Alternatively, if the
     * file is line-buffered and there are embedded newlines, data in the
     * output buffer is flushed up through the final newline.
     * 
     * @param c {String}
     *   The character to be written to the file.
     * 
     * @param succ {Function}
     *   Function to call upon having successfully written the character to
     *   the output stream. No arguments are passed to this function.
     * 
     * @param fail {Function}
     *   Function to call upon error writing the character to the output
     *   stream. The function will be called with an instance of
     *   playground.c.lib.RuntimeError.
     */
    putc : function(c, succ, fail)
    {
      // Ensure the file is opened for writing
      if (! (this._mode & 0x02))
      {
        fail(new playground.c.lib.RuntimeError(
               playground.c.lib.Node._currentNode,
               "Can not call write() on this file. " +
               "It is not open for writing."));
      }

      // Append this character to the output buffer
      this._outBuf.push(c);
      
      // If the buffering mode indicates to flush now...
      if (this._shouldOutputNow())
      {
        // ... then let listeners know there's data available, and flush the
        // output buffer.
        this._output(this._outBuf.length);
      }
      succ();
    },
    
    /**
     * Append bytes to the output buffer for the file. If the output buffer
     * size is exceeded, the buffer is flushed. Alternatively, if the file is
     * line-buffered and there are embedded newlines, data in the output
     * buffer is flushed up through the final newline.
     *
     * FIXME: Currently, only the final character is inspected for
     *   newline. The flushing mechanism should be adjusted to work as
     *   documented above.
     *
     * @param c {String|Array}
     *   The string, or array of bytes, to be written to the file
     *
     * @param succ {Function}
     *   Function to call upon having successfully written the bytes to the
     *   output stream. No arguments are passed to this function.
     *
     * @param fail {Function}
     *   Function to call upon error writing the bytes to the output
     *   stream. The function will be called with an instance of
     *   playground.c.lib.RuntimeError.
     */
    write : function(bytes, succ, fail)
    {
      var             byteArr;

      // Ensure the file is opened for writing
      if (! (this._mode & 0x02))
      {
        fail(new playground.c.lib.RuntimeError(
               playground.c.lib.Node._currentNode,
               "Can not call write() on this file. " +
               "It is not open for writing."));
      }

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
      
      // If the buffering mode indicates to flush now...
      if (this._shouldOutputNow())
      {
        // ... then let listeners know there's data available, and flush the
        // output buffer.
        this._output(this._outBuf.length);
      }
      
      succ();
    },

    /**
     * Flush the output buffer to the file
     * 
     * @param succ {Function}
     *   Function to call upon having successfully flushed the output buffer
     *   to the file. No arguments are passed to this function.
     *
     * @param fail {Function}
     *   Function to call upon error flushing the output buffer to the
     *   file. The function will be called with an instance of
     *   playground.c.lib.RuntimeError.
     * 
     * @param bQuiet {Boolean}
     *   Whether to prevent the warning about flushing a file not open for
     *   writing.
     */
    flush : function(succ, fail, bQuiet)
    {
      // Ensure the file is opened for writing. It isn't a failure if not;
      // there's just nothing to do. We will generate a warning, though, since
      // it's not a reliable thing to do in any environment.
      if (this._mode & 0x02)
      {
        // If there's any data in the output buffer...
        if (this._outBuf.length > 0)
        {
          // ... then let listeners know there's data available, and flush the
          // output buffer.
          this._output(this._outBuf.length);
        }
      }
      else if (! bQuiet)
      {
        playground.c.Main.output(
          "\n\n" +
          "WARNING: calling flush() on a file opened only for reading\n" +
            "does not flush input characters. Flushing input reliably is\n" +
            "non-trivial.\n\n");
      }
      
      succ();
    },

    /**
     * Modify the line buffering flag. Output files that are line-buffered are
     * flushed upon receiving a newline character, rather than waiting until
     * the max buffer length is reached or the file is manually flushed.
     * 
     * @param bLineBuffered {Boolean}
     *   true to turn on line buffering; false otherwise.
     */
    setLineBuf : function(bLineBuffered)
    {
      // Set the line buffering flag
      this._bLineBuf = !! bLineBuffered;
    },

    /**
     * Check whether it's time to flush the output buffer.
     * 
     * @return {Boolean}
     *   true if the output buffer should be flushed; false otherwise.
     */
    _shouldOutputNow : function()
    {
      // If there's nothing in the output buffer...
      if (this._outBuf.length === 0)
      {
        // ... then they don't need to send any output.
        return false;
      }

      // If the buffer length has been reached...
      if (this._outBuf.length >= this._bufLen)
      {
        // ... then tell 'em to send the output.
        return true;
      }
      
      // If we're line-buffered and the last character is a newline...
      if (this._bLineBuf && this._outBuf[this._outBuf.length - 1] == '\n')
      {
        // ... then tell 'em to send the output
        return true;
      }
      
      // Otherwise, it's not yet time to send any output.
      return false;
    },

    /**
     * Determine if the stream is at end-of-file. 
     * 
     * This function will often be overridden by subclasses.
     * 
     * @return {Boolean}
     *   true if the stream is at end-of-file; false otherwise.
     */
    _isEof : function()
    {
      return false;
    },

    /*
     * Write output buffer data to the file. The output buffer will be
     * truncated by the length output to the file.
     * 
     * @param len {Integer} 
     *   The number of bytes to write. In most cases, this is the entire
     *   output buffer, but in the case of a write() to a line-buffered file,
     *   where there are embedded newlines in the data but trailing data after
     *   the final newline, this may not be the entire buffer.
     */
    _output : function(len)
    {
      throw new Error("_output() is abstract");
    }
  },
  
  destruct : function()
  {
    qx.event.Registration.removeAllListeners(this);    
  }
});
