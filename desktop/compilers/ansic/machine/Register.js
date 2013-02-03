/**
 * Machine registers class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * A machine register
 *
 * @extends AbstractValue
 *
 * @param name {String}
 *   The name of the register being instantiated
 */
function Register(name)
{
  /**
   * Retrieve this register's name (by closure)
   * 
   * @return {String}
   *   The name of the register
   */
  this.getName = function()
  {
    // Name passed as constructor parameter is available here by closure
    return name;
  };
}

// Extend the  class
Register.prototype = new Number();


/**
 * The global register map. This contains all of the machine's registers.
 */
register =
  {
    pc : new Register("PC"),
    sp : new Register("SP"),
    fp : new Register("FP")
  };

// Export the constructor
exports.construct = Register;
