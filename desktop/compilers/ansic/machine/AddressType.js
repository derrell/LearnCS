/**
 * Address class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var AbstractType = require("./AbstractType");

/**
 * Instantiate a new AddressType.
 *
 * @extends AbstractType
 * 
 * @param value {Number?}
 *   The numeric address (index in memory)
 */
function AddressType(value)
{
  // Initialize the specified value
  this.setValue(typeof value == "undefined" ? 0 : value);

  // Save the size of this address (pointer)
  this.setSizeOfValue(AddressType.size);
}

// Extend the AbstractValue class
AddressType.prototype = new AbstractType.construct("Address");

// All addresses (pointers) are the same size
AddressType.size = 4;

// Export the constructor
exports.construct = AddressType;
