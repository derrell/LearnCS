/*
This code is derived from the php.js version of sscanf.js, which is found in
the phpjs github package at:

   https://github.com/kvz/phpjs

That code is licensed under GPL Version 2, and the MIT license, version 3.26.


Copyright (c) 2013, Derrell Lipman
This version has been modified by Derrell Lipman:
  - pointers (addresses) are in the virtual machine's Memory class
  - converted to a qooxdoo module
  - removed PHPism shown in example 3 in the original comment below. Addresses
    in which to place conversions are required, and no reordering is possible.

TBD:
  - replace format.charAt() and inputStr.charAt() with array indexes, i.e.,
    don't join() the array into a string in the constructor

  // +   original by: Brett Zamir (http://brett-zamir.me)
  // %      note 1: Since JS does not support scalar reference variables,
  // %        any additional arguments to the function will
  // %      note 1: only be allowable here as strings referring to a global
  // %        variable (which will then be set to the value
  // %      note 1: found in 'str' corresponding to the appropriate
  // %        conversion specification in 'format'
  // %      note 2: I am unclear on how WS is to be handled here because
  // %        documentation seems to me to contradict PHP behavior
  // *     example 1: sscanf('SN/2350001', 'SN/%d');
  // *     returns 1: [2350001]
  // *     example 2: var myVar; // Will be set by function
  // *     example 2: sscanf('SN/2350001', 'SN/%d', 'myVar');
  // *     returns 2: 1
  // *     example 3: sscanf("10--20", "%2$d--%1$d"); // Must escape '$' in
  // *       PHP, but not JS
  // *     returns 3: [20, 10]
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

qx.Class.define("playground.c.Scanf",
{
  extend : qx.core.Object,
  
  /*
   * PRIVATE constructor!
   *   
   * Do not instantiate this class yourself.
   * Instead, use its static method.
   */
  construct : function(inputStrAddr, formatAddr)
  {
    var             inputStr = [];
    var             format = [];
    var             memBytes;
    var             i;

    this.retArr = [];
    this._NWS = /\S/;
    this._args = arguments;
    this._width = 0;
    this._assign = true;


    // Get memory as an array
    this._mem = playground.c.machine.Memory.getInstance();
    memBytes = this._mem.toArray(0);
    

    // Copy the null-terminated input string (which is represented as the
    // ASCII character codes of each character) from the given address, one
    // character at a time, into an array.
    for (i = inputStrAddr; memBytes[i] != 0 && i < memBytes.length; i++)
    {
      inputStr.push(memBytes[i]);
    }
    
    // Convert each character code into its actual character, and join it back
    // together into a single JavaScript string
    this._inputStr = (String.fromCharCode.apply(null, inputStr)).join("");


    // Copy the null-terminated format string (which is represented as the
    // ASCII character codes of each character) from the given address, one
    // character at a time, into an array.
    for (i = formatAddr; memBytes[i] != 0 && i < memBytes.length; i++)
    {
      format.push(memBytes[i]);
    }
    
    // Convert each character code into its actual character, and join it back
    // together into a single JavaScript string
    this._format = (String.fromCharCode.apply(null, format)).join("");

    
  },
  
  statics :
  {
    fscanf : function(stream)
    {
      var             inputStrAddr;
      var             formatAddr;
      var             scanf;
      var             numConversions;
      
      this._args = Array.prototype.slice.call(arguments);

      // Obtain the input and format string addresses, and get an instace of a
      // Scanf class (which will obtain the input and format strings from the
      // given addresses)
      inputStrAddr = this._args.shift();
      formatAddr = this._args.shift();
      scanf = new playground.c.Scanf(inputStrAddr, formatAddr);

      // Now process the request
      numConversions = scanf.process.apply(scanf, this._args);
      return numConversions;
    }
  },
  
  members :
  {
    process : function()
    {
      // PROCESS
      for (var i = 0, j = 0; i < this.format.length; i++) 
      {
        if (this.format.charAt(i) === '%') 
        {
          if (this.format.charAt(i + 1) === '%') 
          {
            if (this._inputStr.charAt(j) === '%') 
            { // a matched percent literal
              ++i, ++j; // skip beyond duplicated percent
              continue;
            }
            // Format indicated a percent literal, but not actually present
            return this._setExtraConversionSpecs(i + 2);
          }

          // CHARACTER FOLLOWING PERCENT IS NOT A PERCENT

          // We need 'g' set to get lastIndex
          var prePattern = new RegExp('^(?:(\\d+)\\$)?(\\*)?(\\d*)([hlL]?)', 'g');

          var preConvs = prePattern.exec(this.format.slice(i + 1));

          var tmpDigit = this.digit;
          if (tmpDigit && preConvs[1] === undefined) 
          {
            throw 'All groups in sscanf() must be expressed as numeric ' +
                  'if any have already been used';
          }
          this.digit = preConvs[1] ? parseInt(preConvs[1], 10) - 1 : undefined;

          this._assign = ! preConvs[2];
          this._width = parseInt(preConvs[3], 10);
          var sizeCode = preConvs[4];
          i += prePattern.lastIndex;

          // Fix: Does PHP do anything with these? Seems not to matter
          if (sizeCode)
          { // This would need to be processed later
            switch (sizeCode) 
            {
            case 'h':
              // Treats subsequent as short int (for d,i,n) or unsigned short int
              // (for o,u,x)
            case 'l':
              // Treats subsequent as long int (for d,i,n), or unsigned long int
              // (for o,u,x); or as double (for e,f,g) instead of float or wchar_t
              // instead of char
            case 'L':
              // Treats subsequent as long double (for e,f,g)
              break;
            default:
              throw 'Unexpected size specifier in sscanf()!';
              break;
            }
          }

          // PROCESS CHARACTER
          try
          {
            switch (this.format.charAt(i + 1)) 
            {
              // For detailed explanations, see
              // http://web.archive.org/web/20031128125047/http://www.uwm.edu/cgi-bin/IMT/wwwman?topic=scanf%283%29&msection=
              // Also
              // http://www.mathworks.com/access/helpdesk/help/techdoc/ref/sscanf.html
              // p, S, C arguments in C function not available
              // DOCUMENTED UNDER SSCANF

            case 'F':
              // Not supported in PHP sscanf; the argument is treated as a float,
              // and presented as a floating-point number (non-locale aware)
              // sscanf doesn't support locales, so no need for two (see %f)
              break;

            case 'g':
              // Not supported in PHP sscanf; shorter of %e and %f
              // Irrelevant to input conversion
              break;

            case 'G':
              // Not supported in PHP sscanf; shorter of %E and %f
              // Irrelevant to input conversion
              break;

            case 'b':
              // Not supported in PHP sscanf; the argument is treated as an
              // integer, and presented as a binary number
              // Not supported - couldn't distinguish from other integers
              break;

            case 'i':
              // Integer with base detection (Equivalent of 'd', but base 0
              // instead of 10)
              j = this._addNext(
                (sizeCode == "h"
                   ? "short"
                   : (sizeCode == "l"
                      ? "long"
                      : "int")),
                j,
                /([+-])?(?:(?:0x([\da-fA-F]+))|(?:0([0-7]+))|(\d+))/, 
                function (num, sign, hex, oct, dec) 
                {
                  return (hex 
                          ? parseInt(num, 16) 
                          : (oct ? parseInt(num, 8) : parseInt(num, 10)));
                });
              break;

            case 'n':
              // Number of characters processed so far
              this.retArr[this.digit !== undefined
                          ? this.digit
                          : this.retArr.length - 1] = 
                {
                  value : j,
                  type  : "int"
                };
              break;

              // DOCUMENTED UNDER SPRINTF

            case 'c':
              // Get character; suppresses skipping over whitespace! (but
              // shouldn't be whitespace in format anyways, so no difference
              // here)
              // Non-greedy match
              j = this._addNext(
                "char", j, new RegExp('.{1,' + (this._width || 1) + '}'));
              break;

            case 'D':
              // sscanf documented decimal number; equivalent of 'd';
            case 'd':
              // Optionally signed decimal integer
              j = this._addNext(
                (sizeCode == "h"
                   ? "short"
                   : (sizeCode == "l"
                      ? "long"
                      : "int")),
                j,
                /([+-])?(?:0*)(\d+)/, 
                function (num, sign, dec) 
                {
                  // Ignores initial zeroes, unlike %i and parseInt()
                  var decInt = parseInt((sign || '') + dec, 10);

                  if (false)    // djl -- just put it in memory; allow overflow
                  {
                    if (decInt < 0)
                    { // PHP also won't allow less than -2147483648
                      // integer overflow with negative
                      return decInt < -2147483648 ? -2147483648 : decInt;
                    } 
                    else
                    { // PHP also won't allow greater than -2147483647
                      return decInt < 2147483647 ? decInt : 2147483647;
                    }
                  }
                  else
                  {
                    return decInt;
                  }
                });
              break;

            case 'f':
              // Although sscanf doesn't support locales, this is used instead
              // of '%F'; seems to be same as %e
            case 'E':
              // These don't discriminate here as both allow exponential float
              // of either case
            case 'e':
              j = this._addNext(
                (sizeCode == "l"
                   ? "double"
                   : "float"),
                j,
                /([+-])?(?:0*)(\d*\.?\d*(?:[eE]?\d+)?)/,
                function (num, sign, dec) 
                {
                  if (dec === '.') 
                  {
                    return null;
                  }
                  // Ignores initial zeroes, unlike %i and parseFloat()
                  return parseFloat((sign || '') + dec);
                });
              break;

            case 'u':
              // unsigned decimal integer
              // We won't deal with integer overflows due to signs
              j = this._addNext(
                (sizeCode == "h"
                   ? "short"
                   : (sizeCode == "l"
                      ? "long"
                      : "int")),
                j,
                /([+-])?(?:0*)(\d+)/, 
                function (num, sign, dec) 
                {
                  // Ignores initial zeroes, unlike %i and parseInt()
                  var decInt = parseInt(dec, 10);
                  
                  if (false)    // djl -- just put it in memory; allow overflow
                  {
                    if (sign === '-')
                    { 
                      // PHP also won't allow greater than 4294967295
                      // integer overflow with negative
                      return 4294967296 - decInt;
                    } 
                    else
                    {
                      return decInt < 4294967295 ? decInt : 4294967295;
                    }
                  }
                  else
                  {
                    return decInt;
                  }
                });
              break;

            case 'o':
              // Octal integer // Fix: add overflows as above?
              j = this._addNext(
                (sizeCode == "h"
                   ? "short"
                   : (sizeCode == "l"
                      ? "long"
                      : "int")),
                j,
                /([+-])?(?:0([0-7]+))/, 
                function (num, sign, oct) 
                {
                  return parseInt(num, 8);
                });
              break;

            case 's':
              // Greedy match
              j = this._addNext("pointer", j, /\S+/);
              break;

            case 'X':
              // Same as 'x'?
            case 'x':
              // Fix: add overflows as above?
              // Initial 0x not necessary here
              j = this._addNext(
                (sizeCode == "h"
                   ? "short"
                   : (sizeCode == "l"
                      ? "long"
                      : "int")),
                j,
                /([+-])?(?:(?:0x)?([\da-fA-F]+))/, 
                function (num, sign, hex) 
                {
                  return parseInt(num, 16);
                });
              break;

            case '':
              // If no character left in expression
              throw 'Missing character after percent mark in ' +
                'sscanf() format argument';

            default:
              throw 'Unrecognized character after percent mark in ' +
                'sscanf() format argument';
            }
          } 
          catch (e) 
          {
            if (e === 'No match in string')
            { // Allow us to exit
              return this._setExtraConversionSpecs(i + 2);
            }
          }
          ++i; // Calculate skipping beyond initial percent too
        } 
        else if (this.format.charAt(i) !== this._inputStr.charAt(j)) 
        {
          // Fix: Double-check i whitespace ignored in string and/or formats
          this._NWS.lastIndex = 0;
          if ((this._NWS).test(this._inputStr.charAt(j)) ||
              this._inputStr.charAt(j) === '')
          { // Whitespace doesn't need to be an exact match)
            return this._setExtraConversionSpecs(i + 1);
          }
          else
          {
            // Adjust strings when encounter non-matching whitespace, so they
            // align in future checks above
            this._inputStr =
              this._inputStr.slice(0, j) + this._inputStr.slice(j + 1);
            i--;
          }
        } 
        else
        {
          j++;
        }
      }

      // POST-PROCESSING
      return this._finish();
    },

    _setExtraConversionSpecs : function(offset) 
    {
      // djl: I don't think this is correct. If a conversion fails, the
      // function should return immediately with however many conversions were
      // already done. Nothing additional should be pushed onto retArr.
      if (false)                // djl
      {
        // Since a mismatched character sets us off track from future
        // legitimate finds, we just scan to the end for any other conversion
        // specifications (besides a percent literal), setting them to null
        // sscanf seems to disallow all conversion specification components
        // (of sprintf) except for type specifiers

        // Do not allow % in last char. class;
        var matches = this.format.slice(offset).match(/%[cdeEufgosxX]/g);

        // b, F, G give errors in PHP, but 'g', though also disallowed, doesn't
        if (matches) 
        {
          var lgth = matches.length;
          while (lgth--) 
          {
            this.retArr.push(null);
          }
        }
      }

      return this._finish();
    },

    _finish : function() 
    {
      var             i;
      var             sp;
      var             addr;
      var             ret;

      if (this._args.length === 2) 
      {
        if (false)              // djl: this isn't # of conversions. Wrong.
        {
          return this.retArr;
        }
        else
        {
          return 0;             // The correct return should be 0 conversions
        }
      }

      // Get the stack pointer address
      sp = this._mem.getReg("SP", "unsigned int");
      
      // Increment past the two fixed arguments (input string and format)
      sp += playground.c.machine.Memory.typeSize["pointer"] * 2;

      for (i = 0; i < this.retArr.length; ++i) 
      {
        // Get quick reference to this return element
        ret = this.ret[i];

        // Retrieve the address where this value should be placed
        addr = this._mem.get(sp, "pointer");
        
        // Put this element's value at the retrieved address
        this._mem.set(addr, ret.type, ret.value);
        
        // Increment the stack address to the next argument. Every argument is
        // on a WORD boundary, even when pointers are shorter than a word, so
        // we can just increment to the next word.
        sp += playground.c.machine.Memory.WORDSIZE;
      }

      return i;
    },

    _addNext : function(type, j, regex, cb)
    {
      if (this._assign) 
      {
        var remaining = this._inputStr.slice(j);
        var check = this._width ? remaining.substr(0, this._width) : remaining;
        var match = regex.exec(check);
        var testNull = match ? (cb ? cb.apply(null, match) : match[0]) : null;
        if (testNull === null) 
        {
          throw 'No match in string';
        }
        
        // A valid conversion. Add it to the return array.
        this.retArr[this.digit !== undefined
                    ? this.digit
                    : this.retArr.length] =
          {
            value : testNull,
            type  : type
          };
        return j + match[0].length;
      }
      return j;
    }
  }
});
