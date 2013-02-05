/**
 * Opcodes (implemented as function calls) for this virtual machine
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

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
function binaryOp(operation, line)
{
  
}

/**
 * Pop the top value off of the stack. This becomes the operand of the unary
 * operation. Apply the specified operation. Push the result back onto the
 * stack.
 *
 * @param operation {String}
 *   One of: "++", "--", "~", "~"
 *
 * @param line {Number}
 *   The line number in the source code from which this instruction derives.
 */
function unaryOp(operation, line)
{
  
}
    
/**
 * Push a value onto the stack.
 *
 * @param value
 *   The Number, Address, or Register to be pushed onto the stack
 *
 * @param line {Number}
 *   The line number in the source code from which this instruction derives.
 */
function push(value, line)
{
  
}

/**
 * Pop a value off of the stack and store it at the specified address
 *
 * @param address {Address|Register}
 *   The address at which the popped value is to be stored
 *
 * @param line {Number}
 *   The line number in the source code from which this instruction derives.
 */
function popAndStore(address, line)
{
  
}

/**
 * Pop the Address off of the top of the stack and replace it with the value
 * (Number or Address) stored at that address.
 *
 * @param line {Number}
 *   The line number in the source code from which this instruction derives.
 */
function dereference(line)
{
  
}

/**
 * Jump to the specified address.
 *
 * @param condition {String}
 *
 *   One of: "<", "<=", "==", "!=", ">", ">=", or null. If null, the jump is
 *   unconditional.
 *
 * @param address {Address|Register}
 *   The address at which execution should continue
 *
 * @param line {Number}
 *   The line number in the source code from which this instruction derives.
 *
 * Compare the top two 32-bit values on the stack, using the specified
 * comparison condition. If the specified condition is met, jump to the
 * specified address. Otherwise, execution continues at the statement after
 * this one.
 */
function jump(condition, address, line)
{
  
}

/**
 * Set a register to a given value.
 *
 * @param registerName {String}
 *   The name of the register whose address is to be modified
 *
 * @param value {Number}
 *   The address to store in the specified register
 *
 * @param line {Number}
 *   The line number in the source code from which this instruction derives.
 */
function setRegister(register, value, line)
{
  
}


function callSubroutine(addr)
{
  
}

function returnFromSubroutine()
{
  
}
