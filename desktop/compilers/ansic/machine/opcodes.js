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
 */
function binaryOp(operation)
{
  
}

/**
 * Pop the top value off of the stack. This becomes the operand of the unary
 * operation. Apply the specified operation. Push the result back onto the
 * stack.
 *
 * @param operation {String}
 *   One of: "++", "--", "~", "~"
 */
function unaryOp(operation)
{
  
}
    
/**
 * Push a value onto the stack.
 *
 * @param value
 *   The Number, Address, or Register to be pushed onto the stack
 */
function push(value)
{
  
}

/**
 * Pop a value off of the stack and store it at the specified address
 *
 * @param address {Address|Register}
 *   The address at which the popped value is to be stored
 */
function popAndStore(address)
{
  
}

/**
 * Pop the Address off of the top of the stack and replace it with the value
 * (Number or Address) stored at that address.
 */
function dereference()
{
  
}

/**
 * Jump to the specified address.
 *
 * @param address {Address|Register}
 *   The address at which execution should continue
 */
function jump(address)
{
  
}

function setRegister(register, value)
{
  
}
