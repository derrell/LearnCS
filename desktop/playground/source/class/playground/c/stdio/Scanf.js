/*
This code is derived from the Minix version of doprint.c, which is found, among other places, at:

 http://www.cise.ufl.edu/~cop4600/cgi-bin/lxr/http/source.cgi/lib/stdio/doscan.c

That code is licensed such that educational use and modification is permitted. The license is at:

 http://www.cise.ufl.edu/~cop4600/cgi-bin/lxr/http/source.cgi/LICENSE

The code here is derived rrom the Minix code, rewritten in JavaScript (as a
qooxdoo module), and using a local implementation of Stdio-like streams.

Copyright (c) 2013, Derrell Lipman
*/

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 */
if (typeof qx === "undefined")
{
  require("./machine/Memory");
}

qx.Class.define("playground.c.stdio.Scanf",
{
  extend : qx.core.Object,
  
  /*
   * PRIVATE constructor!
   *   
   * Do not instantiate this class yourself.
   * Instead, use its static method.
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
    this._format = (String.fromCharCode.apply(null, format));
    
    // As characters are removed from the format array, they're shifted onto
    // this 'used' array, for the few cases where peeks at prior characters
    // are needed.
    this._formatUsed = [];
  },
  
  statics :
  {
    scanf : function(success, failure, formatAddr, optargs)
    {
      var args = Array.prototype.slice.call(arguments);
      var stream = playground.c.Main.stdout;
      
      // Insert stdin as the stream argument to fscanf
      args.splice(2, 0, playground.c.Main.stdin);
      
      // Now fscanf can handle this.
      playground.c.stdio.Scanf.fscanf.apply(null, args);
    },

    fscanf : function(success, failure, stream, formatAddr, optargs)
    {
      var             scanf;
      var             numConversions;
      
      this._args = Array.prototype.slice.call(arguments);
      
      // Prepare the character set table
      this._Xtable = new Array(256);

      try
      {
        // Get a Scanf instance, which retrieves the format string from memory
        scanf = new playground.c.stdio.Scanf(formatAddr);

        // Delete the formatAddr parameter since we've already determined the
        // format string (and it's been stored in this.format).
        this._args.splice(3, 1);

        // Now process the request
        numConversions = scanf._doscan.apply(scanf, this._args);
      }
      catch(e)
      {
        failure(e);
      }
    }
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
            },
            fail);
        }
      }
      else
      {
        o_collect_1(success, failure);
      }
      return;

      var o_collect_1 = function(succ, fail)
      {
        if (width && c == '0' && base == 16)
        {
          this._inpBuf.push(c);
          if (--width)
          {
            c = getc(stream);
            stream.getc(
              function(ch)
              {
                c = ch;
                o_collect_1_1(succ, fail);
              },
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
                  },
                  fail);
              }
              else
              {
                o_collect_2(succ, fail);
              }
            }
          };
        }
        else if (type == 'i')
        {
          base = 10;
          o_collect_2(succ, fail);
        }
      };

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
                },
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
      };

      var o_collect_3 = function(succ, fail)
      {
        if (width && c != EOF)
        {
          stream.ungetc(c);
        }

        if (type == 'i')
        {
          base = 0;
        }

        succ(base);
      };
    },

    /* 
     * The function f_collect() reads a string that has the format of a
     * floating-point number. The function returns as soon as a format-error
     * is encountered, leaving the offending character in the input. This
     * means that 1.el leaves the 'l' in the input queue. Since all detection
     * of format errors is done here, _doscan() doesn't call strtod() when
     * it's not necessary, although the use of the width field can cause
     * incomplete numbers to be passed to strtod(). (e.g. 1.3e+)
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
              f_collect_1(succ, fail);
            },
            fail);
        }
        else
        {
          f_collect_1(succ, fail);
        }
      }
      else
      {
        f_collect_1(succ, fail);
      }
      return;

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
              },
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
      };

      var f_collect_2 = function(succ, fail)
      {
        if (width && c == '.')
        {
          this._inpBuf.push(c);
          if(--width)
          {
            c = getc(stream);
            stream.getc(
              function(ch)
              {
                c = ch;
                f_collect_2_1(succ, fail);
              },
              fail);
          }
          else
          {
            f_collect_2_1(succ, fail);
          }
          return;

          var f_collect_2_1 = function(succ, fail)
          {
            if (width && isdigit(c))
            {
              digit_seen++;
              this._inpBuf.push(c);
              if (--width)
              {
                c = getc(stream);
                stream.getc(
                  function(ch)
                  {
                    c = ch;
                    f_collect_2_1(succ, fail);
                  },
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
          };
        }
        else
        {
          f_collect_3(succ, fail);
        }
      };

      var f_collect_3 = function(succ, fail)
      {
        if (!digit_seen)
        {
          if (width && c != EOF)
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
      };

      var f_collect_4 = function(succ, fail)
      {
        if (width && (c == 'e' || c == 'E'))
        {
          this._inpBuf.push(c);
          if (--width)
          {
            stream.getc(
              function(ch)
              {
                c = ch;
                f_collect_4_1(succ, fail);
              },
              fail);
          }
          else
          {
            f_collect_4_1(succ, fail);
          }
          return;

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
                  },
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
          };

          var f_collect_4_2 = function(succ, fail)
          {
            if (width && isdigit(c))
            {
              digit_seen++;
              this._inpBuf.push(c);
              if (--width)
              {
                c = getc(stream);
                stream.getc(
                  function(ch)
                  {
                    c = ch;
                    f_collect_4_2(succ, fail);
                  },
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
          };

          var f_collect_4_3 = function(succ, fail)
          {
            if (!digit_seen)
            {
              if (width && c != EOF)
              {
                stream.ungetc(c);
              }
              success();        // early return from f_collect()
            }
            else
            {
              f_collect_5(succ, fail);
            }
          };
        }
        else
        {
          f_collect_5(succ, fail);
        }
      };

      var f_collect_5 = function(succ, fail)
      {
        if (width && c != EOF)
        {
          stream.ungetc(c);
        }
        succ();
      };
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
     */
    _doscan : function(success, failure, stream, optargs)
    {
      var             done = 0;       // number of items done 
      var             nrchars = 0;    // number of characters read 
      var             conv = 0;       // # of conversions 
      var             base;           // conversion base 
      var             val;            // an integer value 
      var             str;           // temporary pointer 
      var             tmp_string;    // ditto 
      var             width = 0;      // width of field 
      var             flags;          // some flags 
      var             reverse;        // reverse the checking in [...] 
      var             kind;
      var             ic = EOF;       // the input character 
      var             ld_val;         // long double

      // Retrieve one character from the format string. That same character is
      // also saved on a 'used' list, for the few cases where we need to look
      // at previously-retrieved characters.
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
        success(0);
        return;
      }

      while (1)
      {
        if (isspace(this._format[0]))
        {
          while (isspace(this._format[0]))
          {
            getFormatChar();    // skip whitespace
          }

          ic = getc(stream);
          nrchars++;
          while (isspace (ic))
          {
            ic = getc(stream);
            nrchars++;
          }
          if (ic != EOF)
          {
            stream.ungetc(ic);
          }
          nrchars--;
        }

        if (this._format.length === 0)
        {
          break;    // end of format
        }

        if (this._format[0] != '%')
        {
          ic = getc(stream);
          nrchars++;
          if (ic != getFormatChar())
          {
            break;     /* error */
          }
          continue;
        }
        getFormatChar();

        if (this._format[0] == '%')
        {
          ic = getc(stream);
          nrchars++;
          if (ic == '%')
          {
            getFormatChar();
            continue;
          }
          else
          {
            break;
          }
        }

        flags = 0;

        if (this._format[0] == '*')
        {
          getFormatChar();
          flags |= FL_NOASSIGN;
        }

        if (isdigit(this._format[0]))
        {
          flags |= FL_WIDTHSPEC;
          for (width = 0; isdigit(this._format[0]); )
          {
// FIXME
            width = width * 10 + getFormatChar() - '';
          }
        }

        switch (this._format[0])
        {
        case 'h':
          flags |= FL_SHORT;
          getFormatChar();
          break;

        case 'l':
          flags |= FL_LONG;
          getFormatChar();
          break;
        }

        kind = this._format[0];

        if ((kind != 'c') && (kind != '[') && (kind != 'n'))
        {
          do
          {
            ic = getc(stream);
            nrchars++;
          } while (isspace(ic));

          if (ic == EOF)
          {
            break;              // outer while
          }
        }
        else if (kind != 'n')
        {                       // %c or %[
          ic = getc(stream);
          if (ic == EOF)
          {
            break;              // outer while
          }
          nrchars++;
        }

        switch (kind)
        {
        default:
          // not recognized, like %q
          success(conv || (ic != EOF) ? done : EOF);
          return;

        case 'n':
          if (! (flags & FL_NOASSIGN))
          {                     // silly, though
            if (flags & FL_SHORT)
            {
              this._mem.set(this._args.shift(), "short", nrchars);
            }
            else if (flags & FL_LONG)
            {
              this._mem.set(this._args.shift(), "long", nrchars);
            }
            else
            {
              this._mem.set(this._args.shift(), "int", nrchars);
            }
          }
          break;

        case 'p':               // pointer
          set_pointer(flags);
          /* fallthrough */

        case 'b':               // binary
        case 'd':               // decimal
        case 'i':               // general integer
        case 'o':               // octal
        case 'u':               // unsigned
        case 'x':               // hexadecimal
        case 'X':               // ditto
          if (! (flags & FL_WIDTHSPEC) || width > NUMLEN)
          {
            width = NUMLEN;
          }

          if (!width)
          {
            success(done);
            return;
          }

          str = o_collect(ic, stream, kind, width, &base);
          if (str < inp_buf || (str == inp_buf && (*str == '-' || *str == '+')))
          {
            success(done);
            return;
          }

           // Although the length of the number is str-inp_buf+1
           // we don't add the 1 since we counted it already
          nrchars += str - inp_buf;

          if (! (flags & FL_NOASSIGN))
          {
            if (kind == 'd' || kind == 'i')
            {
              val = strtol(inp_buf, &tmp_string, base);
            }
            else
            {
              val = strtoul(inp_buf, &tmp_string, base);
            }

            if (flags & FL_LONG)
            {
              this._mem.set(this._args.shift(), "unsigned long", val);
            }
            else if (flags & FL_SHORT)
            {
              this._mem.set(this._args.shift(), "unsigned short", val);
            }
            else
            {
              this._mem.set(this._args.shift(), "unsigned int", val);
            }
          }
          break;

        case 'c':
          if (! (flags & FL_WIDTHSPEC))
          {
            width = 1;
          }

          if (! (flags & FL_NOASSIGN))
          {
            this._args.shift();
          }

          if (!width)
          {
            success(done);
            return;
          }

          while (width && ic != EOF)
          {
            if (! (flags & FL_NOASSIGN))
            {
              *str++ = (char) ic;
            }

            if (--width)
            {
              ic = getc(stream);
              nrchars++;
            }
          }

          if (width)
          {
            if (ic != EOF)
            {
              ungetc(ic,stream);
            }
            nrchars--;
          }
          break;

        case 's':
          if (! (flags & FL_WIDTHSPEC))
          {
            width = 0xffff;
          }

          if (! (flags & FL_NOASSIGN))
          {
            str = va_arg(ap, char *);
          }

          if (!width)
          {
            success(done);
            return;
          }

          while (width && ic != EOF && !isspace(ic))
          {
            if (! (flags & FL_NOASSIGN))
            {
              *str++ = (char) ic;
            }

            if (--width)
            {
              ic = getc(stream);
              nrchars++;
            }
          }

          // terminate the string
          if (! (flags & FL_NOASSIGN))
          {
            *str = '\0';    
          }

          if (width)
          {
            if (ic != EOF)
            {
              ungetc(ic,stream);
            }
            nrchars--;
          }
          break;

        case '[':
          if (! (flags & FL_WIDTHSPEC))
          {
            width = 0xffff;
          }

          if (!width)
          {
            success(done);
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

          for (str = Xtable; str < &Xtable[NR_CHARS]; str++)
          {
            *str = 0;
          }

          if (this._format[0] == ']')
          {
            Xtable[getFormatChar()] = 1;
          }

          while (this._format.length > 0 && this._format[0] != ']')
          {
            Xtable[getFormatChar()] = 1;

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
                  Xtable[c] = 1;
                }
                getFormatChar();
              }
              else
              {
                Xtable['-'] = 1;
              }
            }
          }

          if (this._format.length === 0)
          {
            success(done);
            return;
          }

          if (! (Xtable[ic] ^ reverse))
          {
            ungetc(ic, stream);
            success(done);
            return;
          }

          if (! (flags & FL_NOASSIGN))
          {
            str = va_arg(ap, char *);
          }

          do
          {
            if (! (flags & FL_NOASSIGN))
            {
              *str++ = (char) ic;
            }

            if (--width)
            {
              ic = getc(stream);
              nrchars++;
            }
          } while (width && ic != EOF && (Xtable[ic] ^ reverse));

          if (width)
          {
            if (ic != EOF)
            {
              stream.ungetc(ic);
            }
            nrchars--;
          }

          if (! (flags & FL_NOASSIGN))
          {                     // terminate string
            *str = '\0';    
          }
          break;

        case 'e':
        case 'E':
        case 'f':
        case 'g':
        case 'G':
          if (! (flags & FL_WIDTHSPEC) || width > NUMLEN)
          {
            width = NUMLEN;
          }

          if (!width)
          {
            success(done);
            return;
          }

          str = f_collect(ic, stream, width);

          if (str < inp_buf || (str == inp_buf && (*str == '-' || *str == '+')))
          {
            success(done);
            return;
          }

           // Although the length of the number is str-inp_buf+1
           // we don't add the 1 since we counted it already
          nrchars += str - inp_buf;

          if (! (flags & FL_NOASSIGN))
          {
            ld_val = strtod(inp_buf, &tmp_string);

            if (flags & FL_LONG)
            {
              this._mem.set(this._args.shift(), "double", val);
            }
            else
            {
              this._mem.set(this._args.shift(), "float", val);
            }
          }
          break;
        }
        conv++;

        if (! (flags & FL_NOASSIGN) && kind != 'n')
        {
          done++;
        }

        getFormatChar();
      }

      success(conv || (ic != EOF) ? done : EOF);
      return;
    }
  }
});
