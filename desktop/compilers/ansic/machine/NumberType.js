/**
 * NumberType class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var AbstractType = require("./AbstractType");

/**
 * Instantiate a new NumberType.
 *
 * @extends AbstractType
 *
 * @param type {String}
 *   The type of number stored herein. The type may be any of:
 *     "char",      "unsigned char",
 *     "short",     "unsigned short",
 *     "int",       "unsigned ing",
 *     "long",      "unsigned long",
 *     "long long", "unsigned long long",
 *     "float"
 *
 * @param value {NumberType|Number?}
 *   Another NumberType instance or a native numeric value, containing the
 *   initial value.
 */
function NumberType(type, value)
{
  // Initialize the specified value
  this.setValue(typeof value == "undefined" ? 0 : value);
  
  /**
   * Retrieve this number's type (by closure)
   * 
   * @return {String}
   *   The type of number stored in this instance
   */
  this.getTypeOfNumber = function()
  {
    return type;
  };
}

// Extend the AbstractValue class
NumberType.prototype = new AbstractType.construct("Number");

// Export the constructor
exports.construct = NumberType;
