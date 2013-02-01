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

/*
 * Assign a value to a memory address
 */
Memory.prototype.assign = function(addr, value)
{
  this._memoryInternal[addr] = value;
};

Memory.prototype.toDisplayArray = function()
{
};


// Export the constructor and information object
exports.construct = Memory;
exports.info = info;
