/*
This code is derived from the Minix version of doprint.c, which is found,
among other places, at:

 http://www.cise.ufl.edu/~cop4600/cgi-bin/lxr/http/source.cgi/lib/stdio/doscan.c

That code is licensed such that educational use and modification is
permitted. The license is at:

 http://www.cise.ufl.edu/~cop4600/cgi-bin/lxr/http/source.cgi/LICENSE

The code here is derived rrom the Minix code, rewritten in JavaScript (as a
qooxdoo module), and using a local implementation of Stdio-like streams.

Copyright (c) 2013, Derrell Lipman
*/

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @ignore(require)
 */
if (typeof qx === "undefined")
{
  require("./machine/Memory");
}

//
// ctype functions
//

var isdigit = function(c)
{
  return c >= '0' && c <= '9';
};

var isxdigit = function(c)
{
  return (
    (c >= '0' && c <= '9') || 
    (c >= 'a' && c <= 'f') ||
    (c >= 'A' && c <= 'F'));
};

var isspace = function(c)
{
  return (c == ' '  || 
          c == '\t' || 
          c == '\n' || 
          c == '\v' || 
          c == '\f' || 
          c == '\r');
};


qx.Class.define("playground.c.stdio.Scanf",
{
  extend : qx.core.Object,
  
  /*
   * PRIVATE constructor!
   *   
   * Do not instantiate this class yourself.
   * Instead, use its static methods.
   */
  construct : function(formatAddr)
  {
    var             format = [];
    var             memBytes;
    var             i;

    // Get memory as an array
    this._mem = playground.c.machine.Memory.getInstance();
    memBytes = this._mem.toArray(0);
    

    // Copy the null-terminated format string (which is represented as the
    // ASCII character codes of each character) from the given address, one
    // character at a time, into an array.
    for (i = formatAddr; memBytes[i] != 0 && i < memBytes.length; i++)
    {
      format.push(memBytes[i]);
    }
    
    // Convert each character code in the format string into its actual
    // character.
    this._format = (String.fromCharCode.apply(null, format).split(""));
    
    // As characters are removed from the format array, they're shifted onto
    // this 'used' array, for the few cases where peeks at prior characters
    // are needed.
    this._formatUsed = [];

    // Gain easy access to EOF
    this.EOF = playground.c.stdio.AbstractFile.EOF;
    
    // Create flags
    this.Flags =
      {
        LONG       : 0x01,
        LONGDOUBLE : 0x02,
        SHORT      : 0x04,
        POINTER    : 0x08,
        NOASSIGN   : 0x10,
        WIDTHSPEC  : 0x20
      };
    
    // Maximum length of a number. (Clearly excessive)
    this.NUMLEN = 512;
  },
  
  members :
  {
    /** An input buffer used internally for collecting digits of numbers */
    _inpBuf : null,

    /**
     * Collect a number of characters which constitite an ordinal number.
     * When the type is 'i', the base can be 8, 10, or 16, depending on the
     * first 1 or 2 characters. This means that the base must be adjusted
     * according to the format of the number. At the end of the function, base
     * is then set to 0, so strtol() will get the right argument.
     *
     * @param success {Function}
     *   Function to call upon successful completion of this call. The
     *   function is passed the ascertained base.
     *
     * @param failure {Function}
     *   Function to call upon failed completion of this call
     *
     * @param c {Character}
     *   The next, already-retrieved chraracter from the input stream
     *
     * @param stream {playground.c.stdio.AbstractFile}
     *   The stream from which to retrieve input characters
     *
     * @param type {Character}
     *   The type of number to read. May be any of [i, p, x, d, u, o, b].
     *
     * @param width {Integer}
     *   The maximum number of digits to read
     */
    o_collect : function(success, failure, c, stream, type, width)
    {
      var             base;

      var o_collect_1 = function(succ, fail)
      {
        if (width && c == '0' && base == 16)
        {
          this._inpBuf.push(c);
          if (--width)
          {
            stream.getc(
              function(ch)
              {
                c = ch;
                o_collect_1_1(succ, fail);
              }.bind(this),
              fail);
          }
          else
          {
            o_collect_1_1(succ, fail);
          }
          return;

          var o_collect_1_1 = function(succ, fail)
          {
            if (c != 'x' && c != 'X')
            {
              if (type == 'i')
              {
                base = 8;
              }
              o_collect_2(succ, fail);
            }
            else if (width)
            {
              this._inpBuf.push(c);
              if (--width)
              {
                stream.getc(
                  function(ch)
                  {
                    c = ch;
                    o_collect_2(succ, fail);
                  }.bind(this),
                  fail);
              }
              else
              {
                o_collect_2(succ, fail);
              }
            }
          }.bind(this);
        }
        else if (type == 'i')
        {
          base = 10;
          o_collect_2(succ, fail);
        }
        else
        {
          o_collect_2(succ, fail);
        }
      }.bind(this);

      var o_collect_2 = function(succ, fail)
      {
        if (width)
        {
          if (((base == 10) && isdigit(c)) ||
              ((base == 16) && isxdigit(c)) ||
              ((base == 8) && isdigit(c) && (c < '8')) ||
              ((base == 2) && isdigit(c) && (c < '2')))
          {
            this._inpBuf.push(c);

            if (--width)
            {
              stream.getc(
                function(ch)
                {
                  c = ch;
                  o_collect_2(succ, fail);
                }.bind(this),
                fail);
            }
            else
            {
              o_collect_3(succ, fail);
            }
          }
          else
          {
            o_collect_3(succ, fail);
          }
        }
        else
        {
          o_collect_3(succ, fail);
        }
      }.bind(this);

      var o_collect_3 = function(succ, fail)
      {
        if (width && c != this.EOF)
        {
          stream.ungetc(c);
        }

        if (type == 'i')
        {
          base = 0;
        }

        succ(base);
      }.bind(this);

      
      this._inpBuf = [];

      switch (type)
      {
      case 'i':       // i means octal, decimal or hexadecimal
      case 'p':
      case 'x':
      case 'X':
        base = 16;
        break;

      case 'd':
      case 'u':
        base = 10;
        break;

      case 'o':
        base = 8;
        break;
      case 'b':
        base = 2;
        break;
      }

      if (c == '-' || c == '+')
      {
        this._inpBuf.push(c);
        if (--width)
        {
          stream.getc(
            function(ch)
            {
              c = ch;
              o_collect_1(success, failure);
            }.bind(this),
            failure);
        }
      }
      else
      {
        o_collect_1(success, failure);
      }
    },

    /* 
     * The function f_collect() reads a string that has the format of a
     * floating-point number. The function returns as soon as a format-error
     * is encountered, leaving the offending character in the input. This
     * means that 1.el leaves the 'l' in the input queue. Since all detection
     * of format errors is done here, doscan() doesn't call parseFloat() when
     * it's not necessary, although the use of the width field can cause
     * incomplete numbers to be passed to parseFloat(). (e.g. 1.3e+)
     * 
     * @param success {Function}
     *   Function to call upon successful completion of this call
     * 
     * @param failure {Function}
     *   Function to call upon failed completion of this call
     *
     * @param c {Character}
     *   The next, already-retrieved chraracter from the input stream
     * 
     * @param stream {playground.c.stdio.AbstractFile}
     *   The stream from which to retrieve input characters
     * 
     * @param width {Integer}
     *   The maximum number of digits to read
     */
    f_collect : function(success, failure, c, stream, width)
    {
      var             digit_seen = 0;
      
      var f_collect_1 = function(succ, fail)
      {
        if (width && isdigit(c))
        {
          digit_seen++;
          this._inpBuf.push(c);
          if (--width)
          {
            stream.getc(
              function(ch)
              {
                c = ch;
                f_collect_1(succ, fail);
              }.bind(this),
              fail);
          }
          else
          {
            f_collect_2(succ, fail);
          }
        }
        else
        {
          f_collect_2(succ, fail);
        }
      }.bind(this);

      var f_collect_2 = function(succ, fail)
      {
        if (width && c == '.')
        {
          var f_collect_2_1 = function(succ, fail)
          {
            if (width && isdigit(c))
            {
              digit_seen++;
              this._inpBuf.push(c);
              if (--width)
              {
                stream.getc(
                  function(ch)
                  {
                    c = ch;
                    f_collect_2_1(succ, fail);
                  }.bind(this),
                  fail);
              }
              else
              {
                f_collect_3(succ, fail);
              }
            }
            else
            {
              f_collect_3(succ, fail);
            }
          }.bind(this);

          this._inpBuf.push(c);
          if(--width)
          {
            stream.getc(
              function(ch)
              {
                c = ch;
                f_collect_2_1(succ, fail);
              }.bind(this),
              fail);
          }
          else
          {
            f_collect_2_1(succ, fail);
          }
        }
        else
        {
          f_collect_3(succ, fail);
        }
      }.bind(this);

      var f_collect_3 = function(succ, fail)
      {
        if (!digit_seen)
        {
          if (width && c != this.EOF)
          {
            stream.ungetc(c);
          }
          success();            // early return from f_collect()
        }
        else
        {
          digit_seen = 0;
          f_collect_4(succ, fail);
        }
      }.bind(this);

      var f_collect_4 = function(succ, fail)
      {
        if (width && (c == 'e' || c == 'E'))
        {
          var f_collect_4_1 = function(succ, fail)
          {
            if (width && (c == '+' || c == '-'))
            {
              this._inpBuf.push(c);
              if (--width)
              {
                stream.getc(
                  function(ch)
                  {
                    c = ch;
                    f_collect_4_2(succ, fail);
                  }.bind(this),
                  fail);
              }
              else
              {
                f_collect_4_2(succ, fail);
              }
            }
            else
            {
              f_collect_4_2(succ, fail);
            }
          }.bind(this);

          var f_collect_4_2 = function(succ, fail)
          {
            if (width && isdigit(c))
            {
              digit_seen++;
              this._inpBuf.push(c);
              if (--width)
              {
                stream.getc(
                  function(ch)
                  {
                    c = ch;
                    f_collect_4_2(succ, fail);
                  }.bind(this),
                  fail);
              }
              else
              {
                f_collect_4_3(succ, fail);
              }
            }
            else
            {
              f_collect_4_3(succ, fail);
            }
          }.bind(this);

          var f_collect_4_3 = function(succ, fail)
          {
            if (!digit_seen)
            {
              if (width && c != this.EOF)
              {
                stream.ungetc(c);
              }
              success();        // early return from f_collect()
            }
            else
            {
              f_collect_5(succ, fail);
            }
          }.bind(this);

          this._inpBuf.push(c);
          if (--width)
          {
            stream.getc(
              function(ch)
              {
                c = ch;
                f_collect_4_1(succ, fail);
              }.bind(this),
              fail);
          }
          else
          {
            f_collect_4_1(succ, fail);
          }
        }
        else
        {
          f_collect_5(succ, fail);
        }
      }.bind(this);

      var f_collect_5 = function(succ, fail)
      {
        if (width && c != this.EOF)
        {
          stream.ungetc(c);
        }
        succ();
      }.bind(this);

      this._inpBuf = [];

      if (c == '-' || c == '+')
      {
        this._inpBuf.push(c);
        if (--width)
        {
          stream.getc(
            function(ch)
            {
              c = ch;
              f_collect_1(success, failure);
            }.bind(this),
            failure);
        }
        else
        {
          f_collect_1(success, failure);
        }
      }
      else
      {
        f_collect_1(success, failure);
      }
    },

    /*
     * The routine that does the scanning 
     *
     * @param success {Function}
     *   Function to call upon successful completion of this call. This
     *   function is passed the number of successful conversions.
     * 
     * @param failure {Function}
     *   Function to call upon failed completion of this call
     *
     * @param stream {playground.c.stdio.AbstractFile}
     *   The stream from which to retrieve input characters
     * 
     * @param optargs... {Any}
     *   Additional arguments containing addresses in which to store 
     *   conversions made according to the format string.
     */
    doscan : function(success, failure, stream, optargs)
    {
      var             done = 0;       // number of items done 
      var             nrchars = 0;    // number of characters read 
      var             conv = 0;       // # of conversions 
      var             base;           // conversion base 
      var             val;            // an integer value 
      var             width = 0;      // width of field 
      var             flags;          // some flags 
      var             reverse;        // reverse the checking in [...] 
      var             kind;
      var             ic = this.EOF;  // the input character 
      var             ld_val;         // long double
      var             xtable;

      // Retrieve one character from the format string. That same character is
      // also saved on a 'used' list, for the few cases where we need to look
      // at previously-retrieved characters.
      //
      // This function is called frequently, simply to advance to the next
      // character of the format, so the return value is ignored.
      var getFormatChar = function()
      {
        // Retrieve a character from the format string
        var             ch = this._format.shift();
        
        // Copy it into the 'used' array
        this._formatUsed.unshift(ch);
        
        // Return the retrieved character
        return ch;
      }.bind(this);


      // Strip off the fixed arguments (success, failure, stream) from our
      // argument vector
      this._args.splice(0, 3);

      if (this._format.length === 0)
      {
        success(0);             // ultimate return
        return;
      }

      var doscan_1 = function(succ, fail)
      {
        if (isspace(this._format[0]))
        {
          // loop to skip whitespace in input
          var doscan_1_1 = function(succ, fail)
          {
            if (isspace(ic))
            {
              stream.getc(
                function(ch)
                {
                  ic = ch;
                  nrchars++;
                  doscan_1_1(succ, fail);
                }.bind(this),
                fail);
            }
            else
            {
              doscan_1_2(succ, fail);
            }
          }.bind(this);

          var doscan_1_2 = function(succ, fail)
          {
            if (ic != this.EOF)
            {
              stream.ungetc(ic);
            }
            nrchars--;
            doscan_2(succ, fail);
          }.bind(this);

          while (isspace(this._format[0]))
          {
            getFormatChar();    // skip whitespace
          }

          stream.getc(
            function(ch)
            {
              ic = ch;
              nrchars++;
              doscan_1_1(succ, fail);
            }.bind(this),
            fail);
        }
        else
        {
          doscan_2(succ, fail);
        }
      }.bind(this);

      var doscan_2 = function(succ, fail)
      {
        if (this._format.length === 0)
        {
          doscan_return();      // break: end of format
          return;
        }

        doscan_3(succ, fail);
      }.bind(this);

      var doscan_3 = function(succ, fail)
      {
        if (this._format[0] != '%')
        {
          stream.getc(
            function(ch)
            {
              ic = ch;
              nrchars++;
              if (ic != getFormatChar())
              {
                doscan_return(); // break: error
              }
              else
              {
                succ(true);     // continue
              }
            }.bind(this),
            fail);
        }
        else
        {
          doscan_4(succ, fail);
        }
      }.bind(this);

      var doscan_4 = function(succ, fail)
      {
        getFormatChar();

        if (this._format[0] == '%')
        {
          stream.getc(
            function(ch)
            {
              ic = ch;
              nrchars++;
              if (ic == '%')
              {
                getFormatChar();
                succ(true);     // continue
              }
              else
              {
                doscan_return(); // break
              }
            }.bind(this),
            fail);
        }
        else
        {
          doscan_5(succ, fail);
        }
      }.bind(this);

      var doscan_5 = function(succ, fail)
      {
        var doscan_5_1 = function(succ, fail)
        {
          var doscan_5_1_1 = function(succ, fail)
          {
            stream.getc(
              function(ch)
              {
                ic = ch;
                if (ic == this.EOF)
                {
                  doscan_return(); // break: outer while
                  return;
                }

                nrchars++;
                if (isspace(ic))
                {
                  doscan_5_1_1(succ, fail); // repeat this do-while loop
                }
                else
                {
                  doscan_6(succ, fail);
                }
              }.bind(this),
              fail);
          }.bind(this);

          doscan_5_1_1(succ, fail);
          return;
        }.bind(this);

        var doscan_5_2 = function(succ, fail)
        {                       // %c or %[
          stream.getc(
            function(ch)
            {
              ic = ch;
              if (ic == this.EOF)
              {
                succ(fail);         // break: outer while
                return;
              }

              nrchars++;
              doscan_6(succ, fail);
            }.bind(this),
            fail);
        }.bind(this);

        flags = 0;

        if (this._format[0] == '*')
        {
          getFormatChar();
          flags |= this.Flags.NOASSIGN;
        }

        if (isdigit(this._format[0]))
        {
          flags |= this.Flags.WIDTHSPEC;
          for (width = 0; isdigit(this._format[0]); )
          {
            width =
              width * 10 + getFormatChar().charCodeAt(0) - '0'.charCodeAt(0);
          }
        }

        switch (this._format[0])
        {
        case 'h':
          flags |= this.Flags.SHORT;
          getFormatChar();
          break;

        case 'l':
          flags |= this.Flags.LONG;
          getFormatChar();
          break;
        }

        kind = this._format[0];

        if ((kind != 'c') && (kind != '[') && (kind != 'n'))
        {
          doscan_5_1(succ, fail);
        }
        else if (kind != 'n')
        {
          doscan_5_2(succ, fail);
        }
        else
        {
          doscan_6(succ, fail);
        }
      }.bind(this);

      var doscan_6 = function(succ, fail)
      {
        var             i = 0;
        var             addr;

        switch (kind)
        {
        default:
          // not recognized, like %q
          success(conv || ic != this.EOF ? done : this.EOF); // ultimate return
          return;

        case 'n':
          if (! (flags & this.Flags.NOASSIGN))
          {                     // silly, though
            if (flags & this.Flags.SHORT)
            {
              this._mem.set(this._args.shift(), "short", nrchars);
            }
            else if (flags & this.Flags.LONG)
            {
              this._mem.set(this._args.shift(), "long", nrchars);
            }
            else
            {
              this._mem.set(this._args.shift(), "int", nrchars);
            }
          }
          doscan_7(succ, fail);
          break;

        case 'p':               // pointer
          flags |= this.Flags.POINTER;
          /* fallthrough */

        case 'b':               // binary
        case 'd':               // decimal
        case 'i':               // general integer
        case 'o':               // octal
        case 'u':               // unsigned
        case 'x':               // hexadecimal
        case 'X':               // ditto
          if (! (flags & this.Flags.WIDTHSPEC) || width > this.NUMLEN)
          {
            width = this.NUMLEN;
          }

          if (!width)
          {
            success(done);      // ultimate return
            return;
          }

          this.o_collect(
            function(b)
            {
              base = b;

              if (this._inpBuf.length == 0 ||
                  (this._inpBuf.length == 1 && 
                   (this._inpBuf[0] == '-' || this._inpBuf[0] == '+')))
              {
                success(done);      // ultimate return
                return;
              }

              // We had already counted the first character, so the number of
              // characters is the input buffer length - 1.
              nrchars += this._inpBuf.length - 1;

              if (! (flags & this.Flags.NOASSIGN))
              {
                val = parseInt(this._inpBuf.join(""), base);

                if (flags & this.Flags.LONG)
                {
                  this._mem.set(this._args.shift(), "unsigned long", val);
                }
                else if (flags & this.Flags.SHORT)
                {
                  this._mem.set(this._args.shift(), "unsigned short", val);
                }
                else
                {
                  this._mem.set(this._args.shift(), "unsigned int", val);
                }
              }
              
              doscan_7(succ, fail);
            }.bind(this),
            fail,
            ic,
            stream,
            kind,
            width);
          break;

        case 'c':
          if (! (flags & this.Flags.WIDTHSPEC))
          {
            width = 1;
          }

          if (! (flags & this.Flags.NOASSIGN))
          {
            addr = this._args.shift();
          }

          if (!width)
          {
            success(done);      // ultimate return
            return;
          }

          i = 0;

          var doscan_6_case_c_1 = function(succ, fail)
          {
            if (width && ic != this.EOF)
            {
              if (! (flags & this.Flags.NOASSIGN))
              {
                this._mem.set(addr + i++, "char", ic.charCodeAt(0));
              }

              if (--width)
              {
                stream.getc(
                  function(ch)
                  {
                    ic = ch;
                    nrchars++;
                    doscan_6_case_c_1(succ, fail);
                  }.bind(this),
                  fail);
              }
              else
              {
                doscan_6_case_c_2(succ, fail);
              }
            }
            else
            {
              doscan_6_case_c_2(succ, fail);
            }
          }.bind(this);

          var doscan_6_case_c_2 = function(succ, fail)
          {
            if (width)
            {
              if (ic != this.EOF)
              {
                stream.ungetc(ic);
              }
              nrchars--;
            }
            
            doscan_7(succ, fail);
          }.bind(this);

          doscan_6_case_c_1(succ, fail);
          break;

        case 's':
          var doscan_6_case_s_1 = function(succ, fail)
          {
            if (width && ic != this.EOF && !isspace(ic))
            {
              if (! (flags & this.Flags.NOASSIGN))
              {
                this._mem.set(addr + i++, "char", ic.charCodeAt(0));
              }

              if (--width)
              {
                stream.getc(
                  function(ch)
                  {
                    ic = ch;
                    nrchars++;
                    doscan_6_case_s_1(succ, fail);
                  }.bind(this),
                  fail);
              }
              else
              {
                doscan_6_case_s_2(succ, fail);
              }
            }
            else
            {
              doscan_6_case_s_2(succ, fail);
            }
          }.bind(this);

          var doscan_6_case_s_2 = function(succ, fail)
          {
            // terminate the string
            if (! (flags & this.Flags.NOASSIGN))
            {
              this._mem.set(addr + i++, "char", 0);
            }

            if (width)
            {
              if (ic != this.EOF)
              {
                stream.ungetc(ic);
              }
              nrchars--;
            }
            
            doscan_7(succ, fail);
          }.bind(this);

          if (! (flags & this.Flags.WIDTHSPEC))
          {
            width = 0xffff;
          }

          if (! (flags & this.Flags.NOASSIGN))
          {
            addr = this._args.shift();
          }

          if (!width)
          {
            success(done);      // ultimate return
            return;
          }
          
          i = 0;
          doscan_6_case_s_1(succ, fail);
          break;

        case '[':
          if (! (flags & this.Flags.WIDTHSPEC))
          {
            width = 0xffff;
          }

          if (!width)
          {
            success(done);      // ultimate return
            return;
          }

          if (getFormatChar() == '^' )
          {
            reverse = 1;
            getFormatChar();
          }
          else
          {
            reverse = 0;
          }

          xtable = {};
          
          if (this._format[0] == ']')
          {
            xtable[getFormatChar()] = 1;
          }

          while (this._format.length > 0 && this._format[0] != ']')
          {
            xtable[getFormatChar()] = 1;

            if (this._format[0] == '-')
            {
              getFormatChar();

              if (this._format.length > 0 &&
                  this._format[0] != ']' &&
                  this._format[0] >= this._formatUsed[1])
              {
                var c;

                for (c = this._formatUsed[1] + 1; c <= this._format[0] ; c++)
                {
                  xtable[c] = 1;
                }
                getFormatChar();
              }
              else
              {
                xtable['-'] = 1;
              }
            }
          }

          if (this._format.length === 0)
          {
            success(done);      // ultimate return
            return;
          }

          if (! ((xtable[ic] || 0) ^ reverse))
          {
            stream.ungetc(ic);
            success(done);      // ultimate return
            return;
          }

          if (! (flags & this.Flags.NOASSIGN))
          {
            addr = this._args.shift();
          }

          var doscan_6_case_charset_1 = function(succ, fail)
          {
            if (! (flags & this.Flags.NOASSIGN))
            {
              this._mem.set(addr + i++, "char", ic.charCodeAt(0));
            }

            if (--width)
            {
              stream.getc(
                function(ch)
                {
                  ic = ch;
                  nrchars++;
                  
                  if (width && ic != this.EOF && ((xtable[ic] || 0) ^ reverse))
                  {
                    doscan_6_case_charset_1(succ, fail);
                  }
                  else
                  {
                    doscan_6_case_charset_2(succ, fail);
                  }
                }.bind(this),
                fail);
            }
          }.bind(this);

          var doscan_6_case_charset_2 = function(succ, fail)
          {
            if (width)
            {
              if (ic != this.EOF)
              {
                stream.ungetc(ic);
              }
              nrchars--;
            }

            if (! (flags & this.Flags.NOASSIGN))
            {                     // terminate string
              this._mem.set(addr + i++, "char", 0);
            }
            
            succ(true);         // continue
          }.bind(this);

          doscan_6_case_charset_1(succ, fail);
          break;

        case 'e':
        case 'E':
        case 'f':
        case 'g':
        case 'G':
          if (! (flags & this.Flags.WIDTHSPEC) || width > this.NUMLEN)
          {
            width = this.NUMLEN;
          }

          if (!width)
          {
            success(done);      // ultimate return
            return;
          }

          this.f_collect(
            function()
            {
              if (this._inpBuf.length == 0 ||
                  (this._inpBuf.length == 1 &&
                   (this._inpBuf[0] == '-' || this._inpBuf[0] == '+')))
              {
                success(done);      // ultimate return
                return;
              }

              // We had already counted the first character, so the number of
              // characters is the input buffer length - 1.
              nrchars += this._inpBuf.length - 1;

              if (! (flags & this.Flags.NOASSIGN))
              {
                ld_val = parseFloat(this._inpBuf.join(""));

                if (flags & this.Flags.LONG)
                {
                  this._mem.set(this._args.shift(), "double", ld_val);
                }
                else
                {
                  this._mem.set(this._args.shift(), "float", ld_val);
                }
              }
              
              doscan_7(succ, fail);
            }.bind(this),
            fail,
            ic,
            stream,
            width);
          break;
        }
      }.bind(this);

      var doscan_7 = function(succ, fail)
      {
        conv++;

        if (! (flags & this.Flags.NOASSIGN) && kind != 'n')
        {
          done++;
        }

        getFormatChar();
        
        // do next iteration of main while() loop
        doscan_1(succ, fail);
      }.bind(this);
      
      var doscan_return = function()
      {
        success(conv || (ic != this.EOF) ? done : this.EOF); // ultimate return
      }.bind(this);

      // Main Loop. Returns early via direct call to success() in doscan_1, or
      // can break by returning false or continue by returning true.
      (function(succ, fail)
       {
         var             fSelf = arguments.callee;

         doscan_1(
           function(bContinue)
           {
             if (bContinue)
             {
               fSelf(succ, fail);
             }
             else
             {
               succ();
             }
           }.bind(this),
           fail);
       })(success, failure);
    }
  }
});
