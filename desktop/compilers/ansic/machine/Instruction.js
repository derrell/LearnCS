/**
 * Instruction class
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * Instantiate a new instruction. This is an abstract class, intended to be
 * extended by the other classes in this file.
 *
 * @type abstract
 *
 * @param type {String}
 *   The type of this instruction, i.e., one of the Instruction.type values
 *   assigned herein.
 *
 * @param numArgs {Number}
 *   The number of arguments (memory cells) consumed by this instruction, in
 *   addition to the instruction opcode itself.
 *
 * @param line {Number}
 *   The line number in the source code from which this instruction derives.
 */
function Instruction(type, numArgs)
{
  if (! Instruction.type)
  {
    Instruction.type =
      {
        "binaryOp" : "binaryOp",
        "unaryOp"  : "unaryOp",
        "push"     : "push",
        "pop"      : "pop",
        "deref"    : "deref",
        "jump"     : "jump",
        "setReg"   : "setReg",
        "getReg"   : "getReg"
      };
  }

  /**
   * The type for this Instruction
   */
  this.valueType = type;
  
  /**
   * The number of memory cells consumed by this instruction
   */
  this.cellsConsumed = 1 + numArgs;

  /**
   * Save the line number in the source code from which this instruction
   * derives
   * 
   * @param line {Number}
   *   The line number to be saved
   */
  this.setLine = function(line)
  {
    this.line = line;
  };
  
  /**
   * Retrieve the line number of the source code from which this
   * instruction derives.
   *
   * @return {Number}
   *   The line number of the source code from which this instruction derives.
   */
  this.getLine = function()
  {
    return this.line;
  };
  
  /**
   * Function that executes the code for this operation. Override in each
   * subclass.
   */
  this.code = function()
  {
    throw new Error("this.code() is abstract");
  };
}

// Extend the AbstractValue class
Instruction.prototype = new AbstractType.construct("Instruction");

/**
 * Pop the top value off of the stack. This becomes the left operand of the
 * binary operation. Pop the next value off of the stack. This becomes the
 * right operand of the binary operation. Apply the specified operation. Push
 * the result back onto the stack.
 *
 * @param operation {String}
 *   One of: ">>", "<<", "&&", "||", "<=", ">=", "==", "!=", "&", "|", "^",
 *           "+", "-", "*", "/", "%"
 *
 * @param line {Number}
 *   The line number in the source code from which this instruction derives.
 */
function BinaryOp(operation, line)
{
  // Code that is run for this operation
  this.code = function()
  {
    var             op1;
    var             op2;
    
    op1 = Memory
  };
};

// Extend Instruction.
this.prototype = new Instruction(Instruction.type.binaryOp, 0);
  
