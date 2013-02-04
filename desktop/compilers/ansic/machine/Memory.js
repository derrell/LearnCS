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
var Instruction = require("./Instruction");

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
  var             i;
  var             memSize = info.rts.start + info.rts.length;
  var             uint8Arr;

  // The array associated with this memory block
  this._memory = 
    {
      bytes : new ArrayBuffer(memSize),
      value : new Array(memSize)
    };
  
  // Access the bytes array as unsigned chars (octets)
  uint8Arr = new Uint8Array(this._memory.bytes);

  // Initialize the bytes array with random data
  for (i = 0; i < memSize; i++)
  {
    uint8Arr[i] = Math.floor(Math.random() * 256);
  }
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
  var             line;
  var             contAddr;
  var             oldValue;
  var             valueType;
  var             valueSize;
  var             mem;

  // Determine the type of value we were given
  valueType = value.getTypeOfValue();

  // If the type is Instruction, then this can only be placed in the Program
  // region.
  if (valueType == "Instruction" && 
      (addr < info.prog.start || addr >= info.prog.start + info.prog.length))
  {
    throw new Error("Invalid memory access: writing code into data space " +
                    "at address " + addr);
  }
  
  // Otherwise, it can *not* be placed in the Program region.
  if (valueType != "Instruction" &&
      (addr >= info.prog.start && addr < info.prog.start + info.prog.length))
  {
    throw new Error("Invalid memory access: writing data into code space " +
                    "at address " + addr);
  }

  // Determine the size of this value
  valueSize = value.getSizeOfValue();

  // Only values of size one can be at odd addresses
  if (addr % 1 == 0 && valueSize != 1)
  {
    throw new Error("Invalid memory access: " +
                    "writing non-byte to odd address " + addr);
  }

  // Save the assigned value. The means to do so differs depending upon
  // the type and size of value to be written.
  switch(valueType)
  {
  case "Instruction" :
    break;
    
  case "NumberType" :
    switch(value.getTypeOfNumber())
    {
    case "char" :
      mem = new Int8Array(this._memory.bytes, 1);
      break;
      
    case "unsigned char" :
      mem = new Uint8Array(this._memory.bytes, 1);
      break;
      
    case "short" :
      mem = new Int16Array(this._memory.bytes, 1);
      break;
      
    case "unsigned short" :
      mem = new Uint16Array(this._memory.bytes, 1);
      break;
      
    case "int" :
      mem = new Int32Array(this._memory.bytes, 1);
      break;
      
    case "unsigned int" :
      mem = new Uint32Array(this._memory.bytes, 1);
      break;
      
    case "long" :
      mem = new Int32Array(this._memory.bytes, 1);
      break;
      
    case "unsigned long" :
      mem = new Uint32Array(this._memory.bytes, 1);
      break;
      
    case "long long" :
      mem = new Int32Array(this._memory.bytes, 2);
      mem[1] = (value.getValue() >> 32) & 0xffff;
      // mem[0] is handled below
      break;
      
    case "unsigned long long" :
      mem = new Uint32Array(this._memory.bytes, 2);
      mem[1] = (value.getValue() >>> 32) & 0xffff;
      // mem[0] is handled below
      break;
      
    case "float" :
      mem = new Float32Array(this._memory.bytes, 1);
      break;
      
    case "double" :
      mem = new Float64Array(this._memory.bytes, 1);
      break;

    default :
      throw new Error("Unrecognized number type: " + value.getTypeOfNumber());
      break;
    }
    break;
    
  case "AddressType" :
    mem = new Uint32Array(this._memory.bytes, 1);
    break;
    
  default:
    throw new Error("Unrecognized value type: " + valueType);
  }

  // If we haven't already handled it specially (which we know because mem is
  // null), now that we have an appropriate view into the memory, write out
  // the value there.
  if (mem !== null)
  {
    mem[0] = value.getValue();
  }
};

Memory.prototype.get = function(addr, type, size)
{
  var             value;
  
  // Only values of size one can be at odd addresses
  if (addr % 1 == 0 && size != 1)
  {
    throw new Error("Invalid memory access: " +
                    "reading non-byte from odd address " + addr);
  }

  // Retrieve the value from the specified address
  value = this._memoryInternal[addr];
  
  // Does the value at this location have the requested size?
  if (value.getSizeOfValue() === size)
  {
    // Yes, return it.
    return value.clone();
  }
  
  // The value is not the requested size. We'll need to convert it.
  
};

/**
 * Create a displayable representation of memory.
 */
Memory.prototype.toDisplayArray = function()
{
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

exports.info = info;

