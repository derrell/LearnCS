/**
 * Continuation class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var AbstractType = require("./AbstractType");

/**
 * Instantiate a new Continuation. A Continuation is an internal indiction
 * that memory cells are consumed by something before them in memory. They
 * allow detection of attempts to write to a portion of a previous cell's
 * data, so that that cell's value can be changed.
 *
 * @extends AbstractType
 * 
 * @param addr {Number}
 *   The numeric address (index in memory) which this cell is a continuation of
 */
function Continuation(addr)
{
  if (typeof value == "undefined")
  {
    throw new Error("Missing address in Continuation");
  }

  // Initialize the specified value
  this.setValue(value);
}

// Extend the AbstractValue class
Continuation.prototype = new AbstractType.construct("Continuation");

// Export the constructor
exports.construct = Continuation;
