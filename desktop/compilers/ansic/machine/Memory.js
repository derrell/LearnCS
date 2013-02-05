/**
 * Memory class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var DataValue = require("./DataValue");
var Instruction = require("./Instruction");

var info =
  {
    "prog" :                    // Program memory
    {
      start  : 0,
      length : 1 * 1024
    },

    "reg" :                     // Registers
    {
      start  : 7 * 1024,
      length : NUM_REGS * WORDSIZE
    },

    "gas" :                     // Globals and Statics
    {
      start  : 8 * 1024,
      length : 64
    },

    "heap" :                    // Heap
    {
      start  : 12 * 1024,
      length : 64
    },

    "rts" :                     // Run-time Stack
    {
      start  : 16 * 1024,
      length : 1024
    }
};

var register =
  {
    "PC" : info.reg.start + (0 * WORDSIZE),
    "SP" : info.reg.start + (1 * WORDSIZE),
    "FP" : info.reg.start + (2 * WORDSIZE),
    "R1" : info.reg.start + (3 * WORDSIZE),
    "R2" : info.reg.start + (4 * WORDSIZE),
    "R3" : info.reg.start + (4 * WORDSIZE)
  };

// The number of registers
var NUM_REGS = 5;

// The size of one word
var WORDSIZE = DataValue.size["int"];



/**
 * Instantiate a Memory object. This is typically a singleton (enforced below)
 *
 * @param name {String}
 *   The name of this memory.
 * 
 * @param initialSize {Number}
 *   The number of entries in the internal memory array
 *
 */
function Memory()
{
  var             i;
  var             memSize = info.rts.start + info.rts.length;
  var             uint8Arr;

  // Our simulated machine's memory
  this._memory = new ArrayBuffer(memSize);
  
  // Access the memory array as unsigned chars (octets)
  uint8Arr = new Uint8Array(this._memory);

  // Initialize the memory with random data
  for (i = 0; i < memSize; i++)
  {
//    uint8Arr[i] = Math.floor(Math.random() * 256);
    uint8Arr[i] = 0xa5;
  }
  
  // Initialize the registers
  this._memory[register.PC] = 0; // Begin executing at address 0
  this._memory[register.SP] = info.rts.start + info.rts.length;
  this._memory[register.FP] = info.rts.start + info.rts.length;
}

/**
 *
 */
Memory.prototype.move = function(addrSrc, typeSrc, addrDest, typeDest)
{
  var             line;
  var             memSrc;
  var             memDest;
  var             sizeSrc;
  var             sizeDest;

  // Determine size to be moved
  sizeSrc = DataValue.size[typeSrc];
  sizeDest = DataValue.size[typeDest];

  // Ensure that access is from the correct region of memory
  if (! (addrSrc >= info.reg.start  && 
         addrSrc < info.reg.start + info.reg.length) ||
        (addrSrc >= info.gas.start && 
         addrSrc < info.gas.start + info.gas.length) ||
        (addrSrc >= info.heap.start && 
         addrSrc < info.heap.start + info.heap.length) ||
        (addrSrc >= info.rts.start &&
         addrSrc < info.rts.start  + info.rts.length))
  {
    throw new Error("Invalid memory access at " + addrDest + ": " +
                    "ASSIGN FROM address is not within the " +
                    "'globals and statics', 'heap', or " +
                    "'run time stack' regions of memory.");
  }

  // Ensure that access is to the correct region of memory
  if (! (addrDest >= info.reg.start  && 
         addrDest < info.reg.start + info.reg.length) ||
        (addrDest >= info.gas.start && 
         addrDest < info.gas.start + info.gas.length) ||
        (addrDest >= info.heap.start && 
         addrDest < info.heap.start + info.heap.length) ||
        (addrDest >= info.rts.start &&
         addrDest < info.rts.start  + info.rts.length))
  {
    throw new Error("Invalid memory access at " + addrDest + ": " +
                    "ASSIGN TO address is not within the " +
                    "'globals and statics', 'heap', or " +
                    "'run time stack' regions of memory.");
  }

  // Ensure that the access remains in one region of memory
  if ((addrSrc >= info.reg.start  && 
       addrSrc < info.reg.start + WORDSIZE &&
       addrSrc + sizeSrc >= info.reg.start + WORDSIZE) ||

      (addrSrc >= info.gas.start && 
       addrSrc < info.gas.start + info.gas.length &&
       addrSrc + sizeSrc >= info.gas.start + info.gas.length) ||

      (addrSrc >= info.heap.start && 
       addrSrc < info.heap.start + info.heap.length &&
       addrSrc + sizeSrc >= info.heap.start + info.heap.length) ||

      (addrSrc >= info.rts.start &&
       addrSrc < info.rts.start  + info.rts.length &&
       addrSrc + sizeSrc >= info.rts.start + info.rts.length))
  {
    throw new Error("Invalid memory access at " + addrSrc + ": " +
                    "Size of object being assigned causes a read beyond the " +
                    "bounds of its 'globals and statics', 'heap', or " +
                    "'run time stack' region of memory.");
  }

  // Ensure that the access remains in one region of memory
  if ((addrDest >= info.reg.start  && 
       addrDest < info.reg.start + WORDSIZE &&
       addrDest + sizeDest >= info.reg.start + WORDSIZE) ||

      (addrDest >= info.gas.start && 
       addrDest < info.gas.start + info.gas.length &&
       addrDest + sizeDest >= info.gas.start + info.gas.length) ||

      (addrDest >= info.heap.start && 
       addrDest < info.heap.start + info.heap.length &&
       addrDest + sizeDest >= info.heap.start + info.heap.length) ||

      (addrDest >= info.rts.start &&
       addrDest < info.rts.start  + info.rts.length &&
       addrDest + sizeDest >= info.rts.start + info.rts.length))
  {
    throw new Error("Invalid memory access at " + addrDest + ": " +
                    "Size of object being assigned to causes a write beyond " +
                    "the bounds of its 'globals and statics', 'heap', or " +
                    "'run time stack' region of memory.");
  }

  // Only values of size one can be at odd addresses
  if (addrSrc % 1 == 0 && typeSrc != "char" && typeSrc != "unsigned char")
  {
    throw new Error("Invalid memory access at " + addr + ": " +
                    "only char or unsigned char can be read from " +
                    "an odd address.");
  }

  // Only values of size one can be at odd addresses
  if (addrDest % 1 == 0 && typeDest != "char" && typeDest != "unsigned char")
  {
    throw new Error("Invalid memory access at " + addr + ": " +
                    "only char or unsigned char can be written to " +
                    "an odd address.");
  }

  // Get an appropriate view into the memory, based on the source type
  memSrc = getByType(typeSrc, addrSrc);

  // Get an appropriate view into the memory, based on the destination type
  memDest = getByType(typeDest, addrDest);

  // Now that we have appropriate views into the memory, read and write
  // the data.
  memDest[0] = memSrc[0];
};


/**
 * Set the value of a register, used internally by instructions.
 */
Memory.prototype.setReg = function(registerName, type, value)
{
  var             mem;
  
  // Get an appropriate view into the memory, based on the destination type
  mem = getByType(type, register[registerName]);
  
  // Set the register value
  mem[0] = value;
};


/**
 * Retrieve the value of a register, used internally by instructions.
 */
Memory.prototype.getReg = function(registerName, type)
{
  var             mem;
  
  // Get an appropriate view into the memory, based on the destination type
  mem = getByType(type, register[registerName]);
  
  // Retrieve the register value
  return mem[0];
};


/**
 * Create a displayable representation of memory.
 */
Memory.prototype.toDisplayArray = function(startAddr, length)
{
  var             i;
  var             mem;
  var             ret = [];
  
  mem = new Uint8Array(this._memory, startAddr, length);
  for (i = 0; i < length; i++)
  {
    ret.push(mem[i]);
  }
  return ret;
};


var getByType = function(type, addr)
{
  switch(type)
  {
  case "char" :
    return new Int8Array(this._memory[addr], 1);

  case "unsigned char" :
    return new UInt8Array(this._memory[addr], 1);

  case "short" :
    return new Int16Array(this._memory[addr], 1);

  case "unsigned short" :
    return new Unt16Array(this._memory[addr], 1);

  case "int" :
    return new Int32Array(this._memory[addr], 1);

  case "unsigned int" :
    return new UInt32Array(this._memory[addr], 1);

  case "long" :
  case "long long" :
    return new Int32Array(this._memory[addr], 1);

  case "unsigned long" :
  case "unsigned long long" :
    return new UInt32Array(this._memory[addr], 1);

  case "float" :
  case "double" :
    return new Float32Array(this._memory[addr], 1);

  default:
    throw new Error("Unrecognized destination type: " + type);
  }
};



// Export the constructor and information object
var singleton;
exports.getInstance = function()
{
  // If we haven't yet generated the singleton instance of memory...
  if (! singleton)
  {
    // ... then do so now.
    singleton = new Memory();
  }

  // Return that singleton.
  return singleton;
};

// Ensure the singleton is created
exports.getInstance();

exports.info = info;
exports.register = register;
exports.WORDSIZE = WORDSIZE;
