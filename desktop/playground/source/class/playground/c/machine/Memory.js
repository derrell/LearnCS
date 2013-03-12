/**
 * Memory class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
#ignore(require)
#ignore(ArrayBuffer)
#ignore(Int8Array)
#ignore(Int16Array)
#ignore(Int32Array)
#ignore(Uint8Array)
#ignore(Uint16Array)
#ignore(Uint32Array)
#ignore(Uint8Array)
#ignore(Float32Array)
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 */
if (typeof qx === 'undefined')
{
  var qx = require("qooxdoo");
}


qx.Class.define("playground.c.machine.Memory",
{
  type      : "singleton",
  extend    : qx.core.Object,
  
  /**
   * Instantiate the singleton Memory object.
   */
  construct : function()
  {
    this.base(arguments);

    // Initialize memory
    this.initAll();
  },
  
  statics :
  {
    /** The array buffer containing the bytes of the machine's memory */
    _memory : null,
    
    /** The number of registers */
    NUM_REGS : 6,

    /** The size of one word (initialized in defer()) */
    WORDSIZE : null,

    /** Map of sizes of values, according to their C type */
    typeSize :
    {
      "char"               : 1,
      "unsigned char"      : 1,
      "short"              : 2,
      "unsigned short"     : 2,
      "int"                : 4,
      "unsigned int"       : 4,
      "long"               : 4,
      "unsigned long"      : 4,
      "long long"          : 4,
      "unsigned long long" : 4,
      "float"              : 4,
      "double"             : 4,
      "pointer"            : 2
    },

    /** Ranges of memory */
    info :
    {
      "prog" :                    // Program memory
      {
        start  : 0,
        length : 1024
      },

      "reg" :                     // Registers
      {
        start  : 7 * 1024,
        length : null // initialized in defer()
      },

      "es" :                      // Expression stack
      {
        start  : 8 * 1024,
        length : 1024
      },

      "gas" :                     // Globals and Statics
      {
        start  : 10 * 1024,
        length : 64
      },

      "heap" :                    // Heap
      {
        start  : 12 * 1024,
        length : 64
      },

      "rts" :
      {
        start : 0x9EA4,
        length : 68
      }

/*
      "rts" :                     // Run-time Stack
      {
        start  : 16 * 1024,
        length : 1024
      }
*/
    },

    /** The register names, and their locations in memory */
    register :
    {
      // Assigned here, but not yet actually valid; initialized in defer()
      "PC"  : null,
      "SP"  : null,
      "ESP" : null,
      "FP"  : null,
      "R1"  : null,
      "R2"  : null,
      "R3"  : null
    }
  },
  
  members :
  {
    __memSize : 0,

    /**
     * Initialize the memory module.
     *
     * @lint ignoreUndefined(ArrayBuffer)
     * @lint ignoreUndefined(Uint8Array)
     */
    initAll : function()
    {
      var             i;
      var             uint8Arr;

      // Ascertain the size of memory
      this.__memSize = 
        playground.c.machine.Memory.info.rts.start + 
        playground.c.machine.Memory.info.rts.length;

      // Our simulated machine's memory
      this._memory = new ArrayBuffer(this.__memSize);

      // Access the memory array as unsigned chars (octets)
      uint8Arr = new Uint8Array(this._memory);

      // Initialize the memory with random data
      for (i = 0; i < this.__memSize; i++)
      {
    //    uint8Arr[i] = Math.floor(Math.random() * 256);
        uint8Arr[i] = 0x5a;
      }
      
      // Initialize symbol information
      this._symbolInfo = {};
    },

    /**
     * Retrieve an accessor to typed value from memory
     *
     * @param type {String}
     *   One of the C data types, or "pointer"
     *
     * @param addr {Number}
     *   The address in simulated memory from which to retrieve the value
     *
     * @return {Number}
     *   The typed value retrieved from memory
     *
     * @lint ignoreUndefined(ArrayBuffer)
     * @lint ignoreUndefined(Int8Array)
     * @lint ignoreUndefined(Int16Array)
     * @lint ignoreUndefined(Int32Array)
     * @lint ignoreUndefined(Uint8Array)
     * @lint ignoreUndefined(Uint16Array)
     * @lint ignoreUndefined(Uint32Array)
     * @lint ignoreUndefined(Uint8Array)
     * @lint ignoreUndefined(Float32Array)
     */
    _getByType : function(type, addr)
    {
      switch(type)
      {
      case 0x00 :
      case "char" :
        return new Int8Array(this._memory, addr, 1);

      case 0x01 :
      case "unsigned char" :
      case "uchar" :
        return new Uint8Array(this._memory, addr, 1);

      case 0x02 :
      case "short" :
        return new Int16Array(this._memory, addr, 1);

      case 0x03 :
      case "unsigned short" :
      case "ushort" :
        return new Uint16Array(this._memory, addr, 1);

      case 0x04 :
      case "int" :
        return new Int32Array(this._memory, addr, 1);

      case 0x05 :
      case "unsigned int" :
      case "uint" :
        return new Uint32Array(this._memory, addr, 1);

      case 0x06 :
      case "long" :
        return new Int32Array(this._memory, addr, 1);

      case 0x07 :
      case "unsigned long" :
      case "ulong" :
      case "null" :
        return new Uint32Array(this._memory, addr, 1);

      case 0x08 :
      case "long long" :
      case "llong" :
        return new Int32Array(this._memory, addr, 1);

      case 0x09 :
      case "unsigned long long" :
      case "ullong" :
        return new Uint32Array(this._memory, addr, 1);

      case 0x0A :
      case "float" :
        return new Float32Array(this._memory, addr, 1);

      case 0x0B :
      case "double" :
        return new Float32Array(this._memory, addr, 1);

      case 0x0C :
      case "pointer" :
        return new Uint32Array(this._memory, addr, 1);

      default:
        throw new Error("Unrecognized destination type: " + type);
      }
    },

    /**
     * Retrieve a value directly from memory. It is converted to the requested
     * type.
     *
     * @param addr {Number}
     *   The address from which the value should be retrieved
     *
     * @param type {String}
     *   The C type with which the data at the source address should be
     *   interpreted.
     *
     * @return {Number}
     *   The value retrieved from memory, converted to the specified type.
     */
    get : function(addr, type)
    {
      // Get an appropriate view into the memory, based on the type, and return
      // that value.
      return this._getByType(type, addr)[0];
    },
    
    /**
     * Set a value directly from memory. It is converted to the requested
     * type.
     *
     * @param addr {Number}
     *   The address to which the value should be saved
     *
     * @param type {String}
     *   The C type with which the address should be interpreted.
     *
     * @param value {Number}
     *   The value to be written to the designated address
     */
    set : function(addr, type, value)
    {
      // Get an appropriate view into the memory, based on the type, and save
      // the value at that address
      this._getByType(type, addr)[0] = value;
    },
    
    /**
     * Push a value onto the stack
     *
     * @param type {String}
     *   The C type with which the address should be interpreted.
     *
     * @param value {Number}
     *   The value to be written to the designated address
     */
    stackPush : function(type, value)
    {
      var             sp;
      
      // Get the stack pointer address
      sp = this.getReg("SP", "unsigned int");

      // Decrement the stack pointer so it's pointing to the first unused
      // location on the stack
      sp -= playground.c.machine.Memory.WORDSIZE;

      // Store the new stack pointer value back into the stack pointer register
      this.setReg("SP", "unsigned int", sp);

      // Store the specified value at the location pointed to by the stack
      // pointer.
      this.set(sp, type, value);
    },
    
    /**
     * Pop a value off of the stack
     *
     * @param type {String}
     *   The C type with which the stack value should be interpreted.
     *
     * @return {Number}
     *   The value popped from the top of the stack
     */
    stackPop : function(type)
    {
      var             sp;
      var             value;

      // Get the stack pointer address
      sp = this.getReg("SP", "unsigned int");

      // Retrieve the value from the address pointed to by the stack pointer
      value = this.get(sp, type);

      // Increment the stack pointer so it's pointing to the next in-use
      // location on the stack
      sp += playground.c.machine.Memory.WORDSIZE;

      // Store the new value back into the stack pointer
      this.setReg("SP", "unsigned int", sp);
      
      // Return the value we just stored
      return value;
    },

    /**
     * Move data from one address to another.
     *
     * @param addrSrc {Number}
     *   The source address
     *
     * @param typeSrc {String}
     *   The C type with which the data at the source address should be
     *   interpreted.
     *
     * @param addrDest {Number}
     *   The destination address
     *
     * @param typeDest {String}
     *   The C type to assume when writing the data to the destination address
     *
     * @param bForce {Boolean}
     *   Allow writing to Instruction memory. All error checking is disabled, so
     *   caller beware.
     */
    move : function(addrSrc, typeSrc, addrDest, typeDest, bForce)
    {
      var             line;
      var             memSrc;
      var             memDest;
      var             sizeSrc;
      var             sizeDest;
      var             info = playground.c.machine.Memory.info;
      var             WORDSIZE = playground.c.machine.Memory.WORDSIZE;

      // Determine size to be moved
      sizeSrc = playground.c.machine.Memory.typeSize[typeSrc];
      sizeDest = playground.c.machine.Memory.typeSize[typeDest];

      // Forcing is for internal writes to code space, when we really, really
      // know exactly what we're doing. It bypasses all of the error checks.
      if (! bForce)
      {
        // Ensure we are writing to a valid region of memory
        if (! ((addrDest >= info.reg.start  && 
                addrDest < info.reg.start + info.reg.length) ||
               (addrDest >= info.es.start && 
                addrDest < info.es.start + info.es.length) ||
               (addrDest >= info.gas.start && 
                addrDest < info.gas.start + info.gas.length) ||
               (addrDest >= info.heap.start && 
                addrDest < info.heap.start + info.heap.length) ||
               (addrDest >= info.rts.start &&
                addrDest < info.rts.start  + info.rts.length)))
        {
          throw new Error("Invalid memory access at " + 
                          addrDest.toString(16) + ": " +
                          "ASSIGN TO address is not within the " +
                          "'globals and statics', 'heap', or " +
                          "'run time stack' regions of memory.");
        }

        // Ensure that the access remains in one region of memory
        if ((addrSrc >= info.reg.start  && 
             addrSrc < info.reg.start + WORDSIZE &&
             addrSrc + sizeSrc > info.reg.start + WORDSIZE) ||

            (addrSrc >= info.es.start && 
             addrSrc < info.es.start + info.es.length &&
             addrSrc + sizeSrc > info.es.start + info.es.length) ||

            (addrSrc >= info.gas.start && 
             addrSrc < info.gas.start + info.gas.length &&
             addrSrc + sizeSrc > info.gas.start + info.gas.length) ||

            (addrSrc >= info.heap.start && 
             addrSrc < info.heap.start + info.heap.length &&
             addrSrc + sizeSrc > info.heap.start + info.heap.length) ||

            (addrSrc >= info.rts.start &&
             addrSrc < info.rts.start  + info.rts.length &&
             addrSrc + sizeSrc > info.rts.start + info.rts.length))
        {
          throw new Error("Invalid memory access at " + 
                          addrSrc.toString(16) + ": " +
                          "Size of object being assigned causes a " +
                          "read beyond the " +
                          "bounds of its 'globals and statics', 'heap', or " +
                          "'run time stack' region of memory.");
        }

        // Ensure that the access remains in one region of memory
        if ((addrDest >= info.reg.start  && 
             addrDest < info.reg.start + WORDSIZE &&
             addrDest + sizeDest > info.reg.start + WORDSIZE) ||

            (addrDest >= info.es.start && 
             addrDest < info.es.start + info.es.length &&
             addrDest + sizeDest > info.es.start + info.es.length) ||

            (addrDest >= info.gas.start && 
             addrDest < info.gas.start + info.gas.length &&
             addrDest + sizeDest > info.gas.start + info.gas.length) ||

            (addrDest >= info.heap.start && 
             addrDest < info.heap.start + info.heap.length &&
             addrDest + sizeDest > info.heap.start + info.heap.length) ||

            (addrDest >= info.rts.start &&
             addrDest < info.rts.start  + info.rts.length &&
             addrDest + sizeDest > info.rts.start + info.rts.length))
        {
          throw new Error("Invalid memory access at " + 
                          addrDest.toString(16) + ": " +
                          "Size of object being assigned to causes a " +
                          "write beyond " +
                          "the bounds of its 'globals and statics', " +
                          "'heap', or 'run time stack' region of memory.");
        }
      }

      // Only values of size one can be at odd addresses
      if (addrSrc % 2 != 0 && typeSrc != "char" && typeSrc != "unsigned char")
      {
        throw new Error("Invalid memory access at " +
                        addrSrc.toString(16) + ": " +
                        "only char or unsigned char can be read from " +
                        "an odd address.");
      }

      // Only values of size one can be at odd addresses
      if (addrDest % 2 != 0 &&
          typeDest != "char" &&
          typeDest != "unsigned char")
      {
        throw new Error("Invalid memory access at " + 
                        addrDest.toString(16) + ": " +
                        "only char or unsigned char can be written to " +
                        "an odd address.");
      }

      // Get an appropriate view into the memory, based on the source type
      memSrc = this._getByType(typeSrc, addrSrc);

      // Get an appropriate view into the memory, based on the destination type
      memDest = this._getByType(typeDest, addrDest);

      // Now that we have appropriate views into the memory, read and write
      // the data.
      memDest[0] = memSrc[0];
    },
    
    /**
     * Set the value of a register, used internally by instructions.
     */
    setReg : function(registerName, type, value)
    {
      var             mem;

      // Get an appropriate view into the memory, based on the destination types
      mem = this._getByType(type, 
                            playground.c.machine.Memory.register[registerName]);

      // Set the register value
      mem[0] = value;
    },

    /**
     * Retrieve the value of a register, used internally by instructions.
     */
    getReg : function(registerName, type)
    {
      var             mem;

      // Get an appropriate view into the memory, based on the destination type
      mem = this._getByType(type, 
                            playground.c.machine.Memory.register[registerName]);

      // Retrieve the register value
      return mem[0];
    },

    /**
     * Create a normal, JavaScript array representation of a region of memory.
     *
     * @param startAddr {Number}
     *   The starting address to be represented in the array
     *
     * @param length {Number?}
     *   The number of bytes of data to be represented in the array. Defaults
     *   to the remainder of memory.
     *
     * @return {Array}
     *   An array of bytes copied from the simulated machine's memory
     *
     * @lint ignoreUndefined(Uint8Array)
     */
    toArray : function(startAddr, length)
    {
      var             i;
      var             mem;
      var             ret = [];

      // If length is not specified, set it to the remainder of memory
      length = (length || 
                (playground.c.machine.Memory.info.rts.start + 
                 playground.c.machine.Memory.info.rts.length -
                 startAddr));

      mem = new Uint8Array(this._memory, startAddr, length);
      for (i = 0; i < length; i++)
      {
        ret.push(mem[i]);
      }
      return ret;
    },

    /**
     * Add symbol information to be used when generating the data model.
     *
     * @param addr {Number}
     *   The address of the symbol whose information is being saved.
     *
     * @param symbol {playground.c.lib.SymtabEntry}
     *   A reference which may be used to retrieve information about this
     *   symbol
     */
    setSymbolInfo : function(addr, symbol)
    {
      this._symbolInfo[addr] = 
        {
          name    : symbol.getName(),
          type    : symbol.getType(),
          pointer : symbol.getPointerCount(),
          array   : symbol.getArraySizes(),
          count   : symbol.getCount()
        };
    },

    /**
     * Retrieve the current data model, suitable for display.
     *
     * @lint ignoreUndefined(Uint32Array)
     */
    getDataModel : function()
    {
      var             words;
      var             model = [];
      
      // Get a reference to memory as a list of words
      words = Array.prototype.slice.call(
        new Uint32Array(this._memory, 0, this.__memSize / 4),
        0);
      
      // Create the model
      //
      // TODO: This could be optimized by creating it once, and then modifying
      // it during calls to .set()
      words.forEach(
        function(word, index)
        {
          var             addr;
          var             data;
          var             info = playground.c.machine.Memory.info;
          
          // The address of this word is four times its index, since each word
          // contains four bytes.
          addr = index * 4;
          
          // Ignore regions of memory that we don't display
          if (!
              ((addr >= info.gas.start &&
                addr < info.gas.start + info.gas.length) ||
               (addr >= info.heap.start &&
                addr < info.heap.start + info.heap.length) ||
               (addr >= info.rts.start &&
                addr < info.rts.start + info.rts.length)))
          {
            return;
          }

          // Retrieve the symbol information for this address, if available
          data = this._symbolInfo[addr] || {};
          
          // Assign the address and value to the map
          data.addr = addr;
          data.word = word;
          
          // Add this new entry to the model
          model.push(data);
        },
        this);
      
      return model;
    },

    /**
     * Display a region of memory in a pretty format
     *
     * @param startAddr
     *   The starting address to display
     *
     * @param length
     *   The number of bytes of data to display
     */
    prettyPrint : function(message, startAddr, length)
    {
      var data = this.toArray(startAddr, length);
      var parts = [];

      // Display the message
      console.log(message);

      // For each value to be displayed...
      data.forEach(
        function(value, i)
        {
          // See if we need an address heading
          if (i % 16 == 0)
          {
            // We do. Display it, as four hex digits
            if (i !== 0)
            {
              console.log(parts.join(""));
              parts = [];
            }
            parts.push(("0000" + 
                        (startAddr + i).toString(16)).substr(-4) + ": ");
          }

          // Display this value, as two hex digits
          parts.push(("00" + value.toString(16)).substr(-2) + " ");
        });

      // Terminate the display with a newline
      console.log(parts.join("") + "\n");
    }
  },
  
  defer : function(statics)
  {
    // A "word" is the native integer size
    statics.WORDSIZE = statics.typeSize["int"];

    statics.info.reg.length = statics.NUM_REGS * statics.WORDSIZE;

    statics.register.PC  = statics.info.reg.start + (0 * statics.WORDSIZE);
    statics.register.SP  = statics.info.reg.start + (1 * statics.WORDSIZE);
    statics.register.ESP = statics.info.reg.start + (2 * statics.WORDSIZE);
    statics.register.FP  = statics.info.reg.start + (3 * statics.WORDSIZE);
    statics.register.R1  = statics.info.reg.start + (4 * statics.WORDSIZE);
    statics.register.R2  = statics.info.reg.start + (5 * statics.WORDSIZE);
    statics.register.R3  = statics.info.reg.start + (6 * statics.WORDSIZE);
  }
});
