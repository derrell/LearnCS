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
#ignore(qx.bConsole)
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 * @lint ignoreUndefined(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
  qx.bConsole = true;
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

    /** Virgin space to leave available in memory template */
    virgin :
    {
      gas  : 16,
      heap : 16,
      rts  : 12
    },

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
      "pointer"            : 2,
      "enum"               : 4
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
        start  : 4 * 1024,
        length : null // initialized in defer()
      },

      "es" :                      // Expression stack
      {
        start  : 5 * 1024,
        length : 1024
      },

      "defs" :                    // Defined constants
      {
        start  : 9 * 1024,
        length : 1024
      },

      // Look up...
      // Look down...
      //
      // USE CAUTION: defs are in the gas namespace, with negative indexes!!!
      // Be sure to keep them together.

      "gas" :                   // Globals and Statics
      {
        start  : 10 * 1024,
        length : 10 * 1024,
        virgin : null           // initialized in defer()
      },

      "heap" :                  // Heap
      {
        start  : 20 * 1024,
        length : 10 * 1024,
        virgin : null           // initialized in defer()
      },

      "rts" :                   // Run-time Stack
      {
        start  : 0x8000,
        length : 0x7000,
        virgin : null           // initialized in defer()
      }

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
    },
    
    virginize : function()
    {
      var             statics = playground.c.machine.Memory;

      statics.info.gas.virgin = statics.info.gas.start + 16;
      statics.info.heap.virgin = statics.info.heap.start + 16;
      statics.info.rts.virgin = 
        statics.info.rts.start + statics.info.rts.length;
      
      // all memory is uninitialized
      statics._memInitialized = [];
    },

    initRegs : function()
    {
      var             statics = playground.c.machine.Memory;

      statics.register.PC  = statics.info.reg.start + (0 * statics.WORDSIZE);
      statics.register.SP  = statics.info.reg.start + (1 * statics.WORDSIZE);
      statics.register.ESP = statics.info.reg.start + (2 * statics.WORDSIZE);
      statics.register.FP  = statics.info.reg.start + (3 * statics.WORDSIZE);
      statics.register.R1  = statics.info.reg.start + (4 * statics.WORDSIZE);
      statics.register.R2  = statics.info.reg.start + (5 * statics.WORDSIZE);
      statics.register.R3  = statics.info.reg.start + (6 * statics.WORDSIZE);
    }
  },
  
  members :
  {
    __memSize : 0,
    __activationRecordsBegin : null,

    /** Array indicating bytes of memory that have been initialized */
    _memInitialized : null,


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
      var             info = playground.c.machine.Memory.info;

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
      
      // Initialize the activation record array for command line arguments
      this.__activationRecordsBegin =
        [
          {
            addr : info.rts.start  + info.rts.length,
            name : "Stack: Command line arguments"
          }
        ];
      
      // (Re)set the virgin memory pointers
      playground.c.machine.Memory.virginize();

      // Initialize register values
      playground.c.machine.Memory.initRegs();
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
     * @param numElem {Number?}
     *   The number of elements of the specified type to retrieve. Default: 1
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
    _getByType : function(type, addr, numElem)
    {
      // If the number of elements was not specified, retrieve one element.
      numElem = numElem || 1;

      try
      {
        switch(type)
        {
        case 0x00 :
        case "char" :
        case "signed char" :
          return new Int8Array(this._memory, addr, numElem);

        case 0x01 :
        case "unsigned char" :
        case "uchar" :
          return new Uint8Array(this._memory, addr, numElem);

        case 0x02 :
        case "short" :
        case "signed short" :
          return new Int16Array(this._memory, addr, numElem);

        case 0x03 :
        case "unsigned short" :
        case "ushort" :
          return new Uint16Array(this._memory, addr, numElem);

        case 0x04 :
        case "int" :
        case "signed int" :
        case "enum" :
          return new Int32Array(this._memory, addr, numElem);

        case 0x05 :
        case "unsigned int" :
        case "uint" :
          return new Uint32Array(this._memory, addr, numElem);

        case 0x06 :
        case "long" :
        case "signed long" :
          return new Int32Array(this._memory, addr, numElem);

        case 0x07 :
        case "unsigned long" :
        case "ulong" :
        case "null" :
          return new Uint32Array(this._memory, addr, numElem);

        case 0x08 :
        case "long long" :
        case "llong" :
        case "signed long long" :
          return new Int32Array(this._memory, addr, numElem);

        case 0x09 :
        case "unsigned long long" :
        case "ullong" :
          return new Uint32Array(this._memory, addr, numElem);

        case 0x0A :
        case "float" :
          return new Float32Array(this._memory, addr, numElem);

        case 0x0B :
        case "double" :
          return new Float32Array(this._memory, addr, numElem);

        case 0x0C :
        case "pointer" :
          return new Uint16Array(this._memory, addr, numElem);

        default:
          throw new Error("Unrecognized destination type: " + type);
        }
      }
      catch(e)
      {
        // Was a RangeError thrown?
        if (e instanceof RangeError)
        {
          // Yup. That was almost certainly a request for 2 or more bytes on
          // an odd byte boundary.
          throw new playground.c.lib.RuntimeError(
            playground.c.lib.Node._currentNode,
            "Invalid memory access at 0x" + addr.toString(16) + ": " +
              "Can not access type '" + type + "' at this address. " +
              "(This is sometimes called a 'Bus Error'.)");
        }
        else
        {
          // rethrow the error
          throw e;
        }
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
     * @param bRequireInitialized {Boolean}
     *   If true, throw an error if accessed memory has not been initialized
     *
     * @return {Number}
     *   The value retrieved from memory, converted to the specified type.
     */
    get : function(addr, type, bRequireInitialized)
    {
      var             i;
      var             size;
      var             info = playground.c.machine.Memory.info;

      // Determine size to be accessed
      size = playground.c.machine.Memory.typeSize[type];

      // Ensure we are accessing a valid region of memory
      if (! ((addr >= info.defs.start && 
              addr < info.defs.start + info.defs.length) ||
             (addr >= info.gas.start && 
              addr < info.gas.start + info.gas.length) ||
             (addr >= info.heap.start && 
              addr < info.heap.start + info.heap.length) ||
             (addr >= info.rts.start &&
              addr < info.rts.start  + info.rts.length)))
      {
        throw new playground.c.lib.RuntimeError(
          playground.c.lib.Node._currentNode,
          "Invalid memory access at 0x" + 
            addr.toString(16) + ": " +
            "Address to read from is not within the " +
            "'globals and statics', 'heap', or " +
            "'run time stack' regions of memory. " +
            "(This is sometimes called a 'Segmentation Fault'.)");
      }

      // Ensure that the access remains in one region of memory
      if ((addr >= info.defs.start && 
           addr < info.defs.start + info.defs.length &&
           addr + size > info.defs.start + info.defs.length) ||

          (addr >= info.gas.start && 
           addr < info.gas.start + info.gas.length &&
           addr + size > info.gas.start + info.gas.length) ||

          (addr >= info.heap.start && 
           addr < info.heap.start + info.heap.length &&
           addr + size > info.heap.start + info.heap.length) ||

          (addr >= info.rts.start &&
           addr < info.rts.start  + info.rts.length &&
           addr + size > info.rts.start + info.rts.length))
      {
        throw new playground.c.lib.RuntimeError(
          playground.c.lib.Node._currentNode,
          "Invalid memory access at 0x" + 
            addr.toString(16) + ": " +
            "Size of object being assigned causes a " +
            "read beyond the " +
            "bounds of its 'globals and statics', 'heap', or " +
            "'run time stack' region of memory. " +
            "(This is sometimes called a 'Segmentation Fault'.)");
      }

      // If so requested, test that memory to be accessed has been initialized.
      if (bRequireInitialized)
      {
        for (i = 0; i < size; i++)
        {
          if (! playground.c.machine.Memory._memInitialized[addr + i])
          {
            throw new playground.c.lib.RuntimeError(
              playground.c.lib.Node._currentNode,
              "Reading an uninitialized value from address 0x" +
              (addr + i).toString(16));
          }
        }
      }

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
      var             i;
      var             size;
      var             info = playground.c.machine.Memory.info;

      // Determine size to be accessed
      size = playground.c.machine.Memory.typeSize[type];

      // Ensure we are accessing a valid region of memory
      if (! ((addr >= info.defs.start && 
              addr < info.defs.start + info.defs.length) ||
             (addr >= info.gas.start && 
              addr < info.gas.start + info.gas.length) ||
             (addr >= info.heap.start && 
              addr < info.heap.start + info.heap.length) ||
             (addr >= info.rts.start &&
              addr < info.rts.start  + info.rts.length)))
      {
        throw new playground.c.lib.RuntimeError(
          playground.c.lib.Node._currentNode,
          "Invalid memory access at 0x" + 
            addr.toString(16) + ": " +
            "Address to write to is not within the " +
            "'globals and statics', 'heap', or " +
            "'run time stack' regions of memory. " +
            "(This is sometimes called a 'Segmentation Fault'.)");
      }

      // Ensure that the access remains in one region of memory
      if ((addr >= info.defs.start && 
           addr < info.defs.start + info.defs.length &&
           addr + size > info.defs.start + info.defs.length) ||

          (addr >= info.gas.start && 
           addr < info.gas.start + info.gas.length &&
           addr + size > info.gas.start + info.gas.length) ||

          (addr >= info.heap.start && 
           addr < info.heap.start + info.heap.length &&
           addr + size > info.heap.start + info.heap.length) ||

          (addr >= info.rts.start &&
           addr < info.rts.start  + info.rts.length &&
           addr + size > info.rts.start + info.rts.length))
      {
        throw new playground.c.lib.RuntimeError(
          playground.c.lib.Node._currentNode,
          "Invalid memory access at 0x" + 
            addr.toString(16) + ": " +
            "Size of object being assigned causes a " +
            "write beyond the " +
            "bounds of its 'globals and statics', 'heap', or " +
            "'run time stack' region of memory. " +
            "(This is sometimes called a 'Segmentation Fault'.)");
      }

      // Mark initialized memory
      for (i = 0; i < size; i++)
      {
        playground.c.machine.Memory._memInitialized[addr + i] = true;
      }

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
      var             rts = playground.c.machine.Memory.info.rts;
      
      // Get the stack pointer address
      sp = this.getReg("SP", "unsigned int");

      // Decrement the stack pointer so it's pointing to the first unused
      // location on the stack
      sp -= playground.c.machine.Memory.WORDSIZE;

      // Is this new stack pointer inside the untouched, virgin area?
      if (sp < rts.virgin + playground.c.machine.Memory.virgin.rts)
      {
        // Yup. All above is no longer virgin. Leave a bit of unused margin.
        rts.virgin = sp - (playground.c.machine.Memory.virgin.rts * 2);

        // If virgin space exceeds the allotment...
        if (rts.virgin < rts.start)
        {
          // ... then limit it to the allotment
          rts.virgin = rts.start;
        }
      }

      // Store the new stack pointer value back into the stack pointer register
      this.setReg("SP", "unsigned int", sp);

      // Store the specified value at the location pointed to by the stack
      // pointer.
      this.set(sp, type, value);
      
      // Return the address at which we stored the value.
      return sp;
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
    setSymbolInfo : function(addr, symbol, prefix)
    {
      var             name;
      var             size;
      var             region;
      var             info = playground.c.machine.Memory.info;
      
      // Determine the group name for the memory template view. If there's a
      // symbol table, use its name; otherwise it's created before there's a
      // symbol table.
      name = symbol.getSymtab ? symbol.getSymtab().getName() : "(system)";

      // Exclude the structure declaration symbol names
      if (symbol.getName().match("struct#") || 
          (prefix && prefix.match("struct#")))
      {
        return;
      }

      this._symbolInfo[addr] = 
        {
          addr       : addr,
          name       : (prefix || "") + symbol.getName(),
          type       : symbol.getType(),
          unsigned   : symbol.getUnsigned(),
          size       : symbol.getSize(),
          pointer    : symbol.getPointerCount(),
          array      : symbol.getArraySizes(),
          param      : symbol.getIsParameter(),
          group      : name,
          
          // The following are added to this map by getDataModel:
          value      : null,   // will become an array of values in this word
          word       : null    // will become the native memory word
        };

      // Point to the end of the symbol's memory space.
      size = symbol.getSize();
      symbol.getArraySizes().forEach(
        function(multiplier)
        {
          size *= multiplier;
        });
      addr += size;
      

      // Determine which region of memory this symbol is in. 
      if ((addr >= info.gas.start && 
           addr < info.gas.start + info.gas.length))
      {
        region = "gas";
      }
      else if ((addr >= info.heap.start && 
                addr < info.heap.start + info.heap.length))
      {
        region = "heap";
      }
      else if ((addr >= info.rts.start &&
                addr < info.rts.start + info.rts.length))
      {
        region = "rts";
      }
      
      // Adjust the untouched, virgin region
      if (region == "rts" && addr < info[region].virgin)
      {
        info[region].virgin = addr - playground.c.machine.Memory.virgin[region];

        // If virgin space exceeds the allotment...
        if (info[region].virgin < info[region].start)
        {
          // ... then limit it to the allotment
          info[region].virgin = info[region].start;
        }
      }
      else if ((region == "gas" || region == "heap") && 
               addr > info[region].virgin)
      {
        info[region].virgin = addr + playground.c.machine.Memory.virgin[region];

        // If virgin space exceeds the allotment...
        if (info[region].virgin > info[region].start + info[region].length)
        {
          // ... then limit it to the allotment
          info[region].virgin = info[region].start + info[region].length;
        }
      }
    },

    /**
     * Remove symbol information. This is used for heap allocations.
     * 
     * @param addr {Number}
     *   The address for which symbol information is to be removed
     */
    removeSymbolInfo : function(addr)
    {
      // Remove this symbol info
      delete this._symInfo[addr];
    },

    /**
     * Begin an activation record. The address is saved, and the function name
     * for which this is an activation record is later added.
     * 
     * @param addr {Number}
     *   The (high) stack address at which this activation record begins
     */
    beginActivationRecord : function(addr)
    {
      // Record the address. The function name will be added later
      this.__activationRecordsBegin.push({ addr : addr });
    },
    
    /**
     * End use of the current activation record
     */
    endActivationRecord : function()
    {
      var             ar;
      var             symbol;
      var             stackStart = playground.c.machine.Memory.info.rts.start;

      // Remove, but get a reference to, the ending activation record
      ar = this.__activationRecordsBegin.pop();
      
      // Clear out any obsolete symbol info
      for (symbol in this._symbolInfo)
      {
        // Is this symbol in the now-obsolete activation record?
        if (this._symbolInfo[symbol].addr >= stackStart &&
            this._symbolInfo[symbol].addr < ar.addr)
        {
          // Yup. Delete it.
          delete this._symbolInfo[symbol];
        }
      }
    },

    /**
     * Name the current activation record.
     * 
     * @param name {String}
     *   The name of the function to which this activation record belongs
     */
    nameActivationRecord : function(name)
    {
      var             activationRecord;

      // Error checking: there must be an activation record
      if (this.__activationRecordsBegin.length == 0)
      {
        throw new Error("Programmer error: no activation records");
      }
      
      activationRecord = 
        this.__activationRecordsBegin[this.__activationRecordsBegin.length - 1];
      
      // Add a name to the most recently added activation record
      activationRecord.name = name;
    },

    /**
     * Retrieve the current data model, suitable for display.
     *
     * @param start {Number?}
     *   Starting address. Defaults to the beginning of (supported) memory
     *
     * @param length {Number?}
     *   Number of bytes
     *
     * @return {qx.data.Array}
     *   The data model
     *
     * @lint ignoreUndefined(Uint8Array)
     * @lint ignoreUndefined(Uint32Array)
     */
    getDataModel : function(start, length)
    {
      var             i;
      var             j;
      var             type;
      var             size;
      var             addr;
      var             datum;
      var             words;
      var             values;
      var             elements;
      var             arrayCount;
      var             model = [];
      var             WORDSIZE = playground.c.machine.Memory.WORDSIZE;
      
      // Handle missing optional arguments
      if (typeof start != "number")
      {
        // Default to starting at the beginning of (supported) memory
        start = 0;
      }
      
      if (typeof length != "number")
      {
        // Default to ending at the end of (supported) memory
        length = this.__memSize - start;
      }

      // Get a reference to memory as a list of words
      words = Array.prototype.slice.call(
        new Uint32Array(this._memory, start, length / WORDSIZE),
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
          var             group = "Unknown";
          var             info = playground.c.machine.Memory.info;
          var             arIndex; // activation record index
          var             mem;
          
          // The address of this word is WORDSIZE times its index, since each
          // word contains four bytes.
          addr = start + (index * WORDSIZE);
          
          // Figure out which region of memory we're in. If we're in the stack
          // region, then further determine which activation record we're in.
          if (addr >= info.gas.start && addr < info.gas.virgin)
          {
            group = "Globals & Statics";
          }
          else if (addr >= info.heap.start && addr < info.heap.virgin)
          {
            group = "Heap";
          }
          else if (addr >= info.rts.virgin &&
                   addr < info.rts.start + info.rts.length)
          {
            // First see if the current address is below the stack pointer
            mem = playground.c.machine.Memory.getInstance();
            if (addr < mem.getReg("SP", "unsigned int"))
            {
              group = "Stack: Currently unused";
            }
            else
            {
              // We're in the run-time stack. Which activation are record we in?
              for (arIndex = this.__activationRecordsBegin.length - 1;
                   arIndex >= 0;
                   arIndex--)
              {
                // Once we find an activation record entry whose address is
                // greater than the address we're looking at, we've found our
                // group.
                if (addr < this.__activationRecordsBegin[arIndex].addr)
                {
                  // We found it. Save its name.
                  group = this.__activationRecordsBegin[arIndex].name;
                  
                  // No need to search further.
                  break;
                }
              }
            }
          }
          else
          {
            // Ignore unsupported regions of memory
            return;
          }

          // Retrieve the symbol information for this address, if
          // available.
          if (this._symbolInfo[addr])
          {
            // Create a clone since we'll be munging it.
            data = JSON.parse(JSON.stringify(this._symbolInfo[addr]));
            data.group = group;
          }
          else
          {
            data = 
              {
                addr     : addr,
                name     : "",
                type     : null,
                unsigned : "signed",
                size     : 0,
                pointer  : 0,
                array    : [],
                param    : false,
                group    : group
              };
          }
          
          // Assign the address and value to the map
          data.addr = addr;
          data.bytes = Array.prototype.slice.call(
            new Uint8Array(this._memory, addr, WORDSIZE), 0);
          
          // Add this new entry to the model, as in the "Memory Template" view
          model.unshift(data);
        },
        this);
      
      // Obtain the values for each typed memory word
      for (i = model.length - 1; i >= 0; --i)
      {
        // Retrieve the data for this word
        datum = model[i];
        addr = datum.addr;
        
        // Is it typed?
        if (datum.type)
        {
          // Is it an unsigned type?
          if (datum.unsigned)
          {
            // Yup. Indicate such.
            datum.type = "unsigned " + datum.type;
          }

          // Save the type and its size
          type = datum.type;
          
          // Arrays are actually pointers if they are parameters, but an array
          // of pointers that are not parameters are not considered to be a
          // pointer.
          if (datum.param)
          {
            // It's a parameter, so any pointer or array is a pointer
            if (datum.pointer || datum.array.length)
            {
              type = "pointer";
            }
          }
          else
          {
            // It's not a parameter, so it's only a pointer if it's not an array
            if (datum.pointer)
            {
              type = "pointer";
            }
          }

          size = playground.c.machine.Memory.typeSize[type];
          
          // Determine how many items of this size we need values for
          if (datum.array.length == 0)
          {
            arrayCount = 1;
          }
          else if (datum.array.length === 1 && datum.array[0] === -1)
          {
            arrayCount = 1;
          }
          else
          {
            // multiply all of the array sizes together
            arrayCount = datum.array.reduce(
              function(previous, current)
              {
                return previous * current;
              },
              1);
          }
          
          do
          {
            // Determine how many items fit in one word, which becomes the
            // maximum number to retrieve at one time.
            elements = Math.min(arrayCount, WORDSIZE / size);

            // Decrement the array count by how many we will retrieve
            arrayCount -= elements;

            // Get an (ordinary JavaScript) array of values of the specified
            // type.
            values = 
              Array.prototype.slice.call(
                this._getByType(type, addr, elements), 
                0);
            
            // Put those values into a new array, in the positions for display
            datum.values = [];
            do
            {
              // Take the next value from the retrieved array and put it into
              // our new array.
              datum.values.push(values.shift());
              
              // Insert space holders in positions where no values will be
              // displayed
              for (j = size - 1; j > 0; --j)
              {
                datum.values.push(null);
              }
            } while(values.length > 0);
            
            // If the data array isn't full, fill it
            while (datum.values.length < WORDSIZE)
            {
              datum.values.push(null);
            }
            
            // If there are more elements...
            if (arrayCount > 0)
            {
              // ... then get the next datum
              datum = model[--i];
              addr = datum.addr;
              
              // This datum wasn't named, so doesn't contain type info. Add it.
              datum.type = type;
              datum.size = size;
              datum.pointer = (type === "pointer" ? 1 : 0);
            }
          } while(arrayCount > 0)
        }
        else
        {
          datum.values = [ "", null, null, null ];
          datum.type = "unsigned int";
        }
      }

      model.forEach(
        function(datum)
        {
          if (typeof datum.group == "undefined")
          {
            console.log("undefined group name at address " +
                        datum.addr.toString(16) + ": " + JSON.stringify(datum));
          }
        });

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
      var             model;
      
      // Retrieve the data to be displayed
      model = this.getDataModel(startAddr, length);

      // Display the message
      console.log(message);
      
      model.forEach(
        function(datum, i)
        {
          var             parts;
          var             numSpaces = 24 - datum.name.length;
          
          parts = 
            [
              datum.name,
              new Array(numSpaces).join(" "),
              ("0000" + datum.addr.toString(16)).substr(-4),
              "\t",
              datum.bytes.map(
                function(byteValue)
                {
                  if (byteValue === null)
                  {
                    byteValue = 0xfe;
                  }
                  return ("00" + byteValue.toString(16)).substr(-2);
                }).join(" ")
            ];
          
          console.log(parts.join(""));
        });
    }
  },
  
  defer : function(statics)
  {
    // A "word" is the native integer size
    statics.WORDSIZE = statics.typeSize["int"];

    statics.virginize();

    statics.info.reg.length = statics.NUM_REGS * statics.WORDSIZE;
    statics.initRegs();
  }
});
