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
 */
function AbstractType(type)
{
  /**
   * The type for this Value
   */
  this.valueType = type;
}

/*
 * Retrieve the type of this Value
 */
AbstractType.prototype.getTypeOfValue = function()
{
  return this.valueType;
};

/**
 * Set the value.
 *
 * @param value {Any}
 *   The value, as appropriate to the subclass
 */
AbstractType.prototype.setValue = function(value)
{
  this.value = value;
};

/**
 * Retrieve the value.
 *
 * @return {Any}
 *   The current value, as appropriate for the subclass
 */
AbstractType.prototype.getValue = function()
{
  return this.value;
};


// Export the constructor
exports.construct = AbstractType;
