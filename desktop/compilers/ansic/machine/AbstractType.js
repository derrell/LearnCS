/**
 * Address class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * Instantiate a new abstract type. This is an abstract class, extended, for
 * example, by AddressType, NumberType
 *
 * @type abstract
 *
 * @param type {String}
 *   The type of this value, e.g., "AddressType", "NumberType"
 *
 * @param size {Number}
 *   The number of bytes of memory consumed by this Value
 */
function AbstractType(type)
{
  /**
   * The type for this Value
   */
  this.valueType = type;
}

AbstractType.prototype.clone = function()
{
  return JSON.decode(JSON.encode(this));
};

/**
 * Retrieve the type of this data value
 */
AbstractType.prototype.getTypeOfData = function()
{
  return this.valueType;
};

/**
 * Retrieve the size, in bytes, of this data value
 */
AbstractType.prototype.getSizeOfData = function()
{
  return this.valueSize;
};

/**
 * Set the size, in bytes, of this data value
 *
 * @param size {Number}
 *   The size of this value
 */
AbstractType.prototype.setSizeOfData = function(size)
{
  if (typeof size != "number")
  {
    throw new Error("Unrecognized size");
  }
  
  // Save the given size
  this.valueSize = size;
};

/**
 * Set the value.
 *
 * @param value {Any}
 *   The data, as appropriate to the subclass
 */
AbstractType.prototype.setData = function(value)
{
  this.value = value;
};

/**
 * Retrieve the data value.
 *
 * @return {Any}
 *   The current data value, as appropriate for the subclass
 */
AbstractType.prototype.getData = function()
{
  return this.value;
};


// Export the constructor
exports.construct = AbstractType;
