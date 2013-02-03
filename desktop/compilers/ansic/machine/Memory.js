/**
 * Memory class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var NumberType = require("./NumberType");
var AddressType = require("./AddressType");

var info =
  {
    "prog" :                    // Program memory
    {
      start  : 0,
      length : 1 * 1024
    },

    "gas" :                     // Globals and Statics
    {
      start  : 4 * 1024,
      length : 64
    },

    "heap" :                    // Heap
    {
      start  : 8 * 1024,
      length : 64
    },

    "rts" :                     // Run-time Stack
    {
      start  : 16 * 1024,
      length : 1024
    }
};


/**
 * Instantiate a Memory object. There  typically only one of these.
 *
 * @type abstract
 * 
 * @param name {String}
 *   The name of this memory.
 * 
 * @param initialSize {Integer}
 *   The number of entries in the internal memory array
 *
 */
function Memory()
{
  // The array associated with this memory block
  this._memoryInternal = [];
}

/**
 * Assign a value to a memory address
 *
 * @param addr {Number}
 *   The address at which memory is to be placed
 *
 * @param value {NumberType|AddressType|OpcodeType}
 *   The value to be placed at the specified address
 */
Memory.prototype.put = function(addr, value)
{
  // If the type is opcode, then this can only be placed in the Program region.
  if (value.getTypeOfValue() == "OpCode" && 
      (addr < info.prog.start || addr >= info.prog.start + info.prog.length))
  {
    throw new Error("Invalid memory access: writing code into data space " +
                    "at address " + addr);
  }
  
  // Otherwise, it can *not* be placed in the Program region.
  if (value.getTypeOfValue() != "OpCode" &&
      (addr >= info.prog.start && addr < info.prog.start + info.prog.length))
  {
    throw new Error("Invalid memory access: writing data into code space " +
                    "at address " + addr);
  }

  this._memoryInternal[addr] = value;
};

/**
 * Create a displayable representation of memory.
 */
Memory.prototype.toDisplayArray = function()
{
};


// Export the constructor and information object
exports.construct = Memory;
exports.info = info;
