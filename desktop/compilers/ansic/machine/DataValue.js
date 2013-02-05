/**
 * Data value class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * Instantiate a new data value.
 *
 * @param type {String}
 *   The type of number stored herein. The type may be any of:
 *     "char",      "unsigned char",
 *     "short",     "unsigned short",
 *     "int",       "unsigned int",
 *     "long",      "unsigned long",
 *     "long long", "unsigned long long",
 *     "float",     "double",
 *     "pointer"
 *
 * @param addr {Number}
 *   The address at which this value's data is stored
 */
function DataValue(type, addr)
{
  /**
   * The type for this Value
   */
  this._type = type;
  
  /**
   * The address is immutable. Provide it, by closure.
   */
  this.getAddress = function()
  {
    return addr;
  };
}

/**
 * Clone a value, creating another that is identical.
 *
 * @return {DataValue}
 *   A copy of this DataValue
 */
DataValue.prototype.clone = function()
{
  return JSON.decode(JSON.encode(this));
};

/**
 * Modify the type of data for this value
 */
DataValue.prototype.setType = function(type)
{
  this._type = type;
};

/**
 * Retrieve the type of this data value
 */
DataValue.prototype.getType = function()
{
  return this._type;
};


// Create a map of number sizes
DataValue.size =
  {
    "char"               : 1,
    "unsigned char"      : 1,
    "short"              : 2,
    "unsigned short"     : 2,
    "int"                : 2,
    "unsigned int"       : 2,
    "long"               : 4,
    "unsigned long"      : 4,
    "long long"          : 4,
    "unsigned long long" : 4,
    "float"              : 4,
    "double"             : 4,
    "pointer"            : 2
  };


// Export the constructor
exports.construct = DataValue;
