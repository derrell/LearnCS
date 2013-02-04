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
  var             line;
  var             contAddr;
  var             oldValue;
  var             valueSize;

  // If the type is Instruction, then this can only be placed in the Program
  // region.
  if (value.getTypeOfValue() == "Instruction" && 
      (addr < info.prog.start || addr >= info.prog.start + info.prog.length))
  {
    throw new Error("Invalid memory access: writing code into data space " +
                    "at address " + addr);
  }
  
  // Otherwise, it can *not* be placed in the Program region.
  if (value.getTypeOfValue() != "Instruction" &&
      (addr >= info.prog.start && addr < info.prog.start + info.prog.length))
  {
    throw new Error("Invalid memory access: writing data into code space " +
                    "at address " + addr);
  }

  // Remove continuations from the existing value
  oldValue = this._memoryInternal[addr];
  for (valueSize = value.getSizeOfValue() - 1,
         line = value.getLine,
         contAddr = addr + 1;
       valueSize > 0;
       --valueSize, 
         ++contAddr)
  {
    // For now, replace them with a random value.
    //
    // TODO: calculate and store the individual byte values that would remain,
    // based on the old value and the size of the new value.
    this._memoryInternal[contAddr] = 
      new NumberType("unsigned char", floor(random() * 256));
  }

  // Save the assigned value
  this._memoryInternal[addr] = value;
  
  // In each following cell consumed by this value, ...
  for (valueSize = value.getSizeOfValue() - 1,
         line = value.getLine,
         contAddr = addr + 1;
       valueSize > 0;
       --valueSize, 
         ++contAddr)
  {
    // ... place a Continuation
    this._memoryInternal[contAddr] = new Continuation(addr, line);
  }
};

Memory.prototype.get = function(addr, type, size)
{
  var             value;
  
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



var getBytes = function(value)
{
  var             i;
  var             valueType;
  var             valueSize;
  var             bytes;
  var             view;
  var             setters;

  switch(value.getTypeOfValue())
  {
  case NumberType :
    // Determine the number of bytes taken by this number type
    valueType = value.getTypeOfNumber();
    valueSize = NumberType.size[valueType];
    
    // Cool stuff!
    // https://developer.mozilla.org/en-US/docs/JavaScript/Typed_arrays?redirectlocale=en-US&redirectslug=JavaScript_typed_arrays

    // Get a reference to a view on an array buffer of the appropriate size
    view = new DataView(new ArrayBuffer(valueSize));
    
    // Save the specified value in the array buffer
    setters =
    {
      "char"               : view.setInt8,
      "unsigned char"      : view.setUint8,
      "short"              : view.setInt16,
      "unsigned short"     : view.setUint16,
      "int"                : view.setInt32,
      "unsigned int"       : view.setUint32,
      "long"               : view.setInt32,
      "unsigned long"      : view.setUint32,
      "long long"          : function(offset, value)
      {
        view.setInt32((value >> 32) & 0xffff);
        view.setUint32(value & 0xffff);
      },
      "unsigned long long" : function(offset, value)
      {
        view.setUint32((value >>> 32) & 0xffff);
        view.setUint32(value & 0xffff);
      },
      "float"              : setFloat64
    };
    setters[valueType](0, value.getValue());

    for (i = 0; i < valueSize; i++)
    {
      
    }
    break;
    
  case AddressType :
    break;
    
  case Instruction :
    break;
    
  default:
    throw new Error("Value has unrecognized type: " + value.getTypeOfValue());
    break;
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

exports.info = info;

