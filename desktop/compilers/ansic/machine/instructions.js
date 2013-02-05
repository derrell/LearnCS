/**
 * Opcodes (implemented as function calls) for this virtual machine
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
 * Machine Instructions
 *
 * The opcodes of each instructions are shown following the function that
 * implements that opcode. In memory, an instruction is composed of two
 * words. The first is the opcode word, and is partitioned as follows:
 *
 * Bits 28-31 : opcode
 * Bits  0-30 : as documented for each function
 *
 * The second word contains debugging information for the instruction. The
 * low-order 16 bits contain the line number. The high-order 16 bits are
 * reserved for future use, to possibly include a file name index.
 */
var Instruction =
  {
    /**
     * Compute the result of a binary operation.  The value in register R1 is
     * the left operand of the binary operation. The value in register R2 is
     * the right operand of the binary operation. Apply the specified
     * operation. Store the result into register R1.
     *
     * @param instruction {Number}
     *   Bits 28-31 contain the opcode.
     * 
     *   Bits 16-20 contain the binary operation to be performed:
     *     00 : ">>"
     *     01 : "<<"
     *     02 : "&&"
     *     03 : "||"
     *     04 : "<="
     *     05 : ">="
     *     06 : "=="
     *     07 : "!="
     *     08 : "&"
     *     09 : "|"
     *     0A : "^"
     *     0B : "+"
     *     0C : "-"
     *     0D : "*"
     *     0E : "/"
     *     0F : "%"
     *   Bit patterns 10-1F are reserved for future use
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    binaryOp : function(instruction, line)
    {

    },
    0 : binaryOp,               // opcode

    /**
     * Compute the result of a unary operation.  The value in register R1 is
     * the operand of the unary operation. Apply the specified operation.
     * Store the result into register R1.
     *
     * @param instruction {Number}
     *   Bits 28-31 contain the opcode.
     * 
     *   Bits 16-20 contain the unary operation to be performed:
     *     00 : "++"
     *     01 : "--"
     *     02 : "~"
     *     03 : "!"
     *   Bit patterns 04-1F are reserved for future use
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    unaryOp : function(instruction, line)
    {

    },
    1 : Instruction.unaryOp,    // opcode

    /**
     * Compare the values in registers R1 and R2, using the specified
     * comparison condition. If the specified condition is met, jump to the
     * specified address. Otherwise, execution continues at the statement
     * after this one.
     *
     * @param instruction {Number}
     *   Bits 28-31 contain the opcode.
     * 
     *   Bits 16-20 contain the comparison operation to be performed:
     *     00 : no comparison; unconditional jump
     *     01 : "<"
     *     02 : "<=
     *     03 : "=="
     *     04 : "!="
     *     05 : ">"
     *     06 : ">="
     *     07 : "!="
     *   Bit patterns 08-1F are reserved for future use
     *
     *   Bits 0-15 contain the address to which to jump, if the conditional
     *   yields true.
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    jumpOnCondition : function(instruction, line)
    {

    },
    2 : Instruction.jumpOnCondition, // opcode

    /**
     * Push a value onto the stack.
     *
     * @param instruction
     *   Bits 28-31 contain the opcode.
     *   Bits 0-15 contain the address of the value to be pushed onto the
     *   stack.
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    push : function(instruction, line)
    {

    },
    3 : Instruction.push,       // opcode

    /**
     * Pop a value off of the stack and store it at the specified address
     *
     * @param instruction
     *   Bits 28-31 contain the opcode.
     *   Bits 0-15 contain the address at which the value popped from the
     *   stack is to be saved.
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    popAndStore : function(instruction, line)
    {

    },
    4 : Instruction.popAndStore, // opcode

    /**
     * Push the current program counter onto the stack, and jump to the
     * function at the specified address.
     *
     * @param instruction {Number}
     *   Bits 28-31 contain the opcode.
     *   Bits 0-15 contain the address to which to jump.
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    callFunction : function(instruction, line)
    {

    },
    5 : Instruction.callFunction, // opcode

    /**
     * Pop the return address from the top of the stack, and jump to that
     * address.
     *
     * @param instruction {Number}
     *   Bits 28-31 contain the opcode.
     *   No additional information is encoded in any other bits.
     * 
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    returnFromFunction : function(instruction, line)
    {

    },
    6 : Instruction.returnFromFunction // opcode
};

Instruction.toOpcode = function(name)
{
  return (
  {
    "binaryOp"           : 0,
    "unaryOp"            : 1,
    "jumpOnCondition"    : 2,
    "push"               : 3,
    "popAndStore"        : 4,
    "callFunction"       : 5,
    "returnFromFunction" : 6
  }[name]);
};
