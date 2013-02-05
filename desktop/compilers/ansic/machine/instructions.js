/**
 * Opcodes (implemented as function calls) for this virtual machine
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var mem = require("./Memory");

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
     *   Bits 24-27 contain the binary operation to be performed:
     *     00 : ">>"
     *     01 : "<<"
     *     02 : "&&"
     *     03 : "||"
     *     04 : "<"
     *     05 : "<="
     *     06 : "=="
     *     07 : "!="
     *     08 : ">="
     *     09 : ">"
     *     0A : "&"
     *     0B : "|"
     *     0C : "^"
     *     0D : "+"
     *     0E : "-"
     *     0F : "*"
     *     10 : "/"
     *     11 : "%"
     *   Bit patterns 12-1F are reserved for future use
     *
     *   Bits 20-23 contain the first operand's type;
     *   Bits 16-19 contain the second operand's type:
     *     00 : "char"
     *     01 : "unsigned char"
     *     02 : "short"
     *     03 : "unsigned short"
     *     04 : "int"
     *     05 : "unsigned int"
     *     06 : "long"
     *     07 : "unsigned long"
     *     08 : "long long"
     *     09 : "unsigned long long"
     *     0A : "float"
     *     0B : "double"
     *     0C : "pointer"
     *   Bit patterns 0D-0E are reserved for future use
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    binaryOp : function(instruction, line)
    {
      var             f;
      var             type1;
      var             type2;
      var             typeCoerceTo;
      var             binOp;
      var             operations =
        [
          ">>",                 // 0
          "<<",                 // 1
          "&&",                 // 2
          "||",                 // 3
          "<",                  // 4
          "<=",                 // 5
          "==",                 // 6
          "!=",                 // 7
          ">=",                 // 8
          ">",                  // 9
          "&",                  // 10
          "|",                  // 11
          "^",                  // 12
          "+",                  // 13
          "-",                  // 14
          "*",                  // 15
          "/",                  // 16
          "%"                   // 17
        ];
      
      // Determine which binary operation is to be performed
      binOp = operations[(instruction >>> 16) & 0x1f];
      
      // Extract the types of the two operands
      type1  = indexToType((instruction >>> 20) & 0x0f);
      type2 = indexToType((instruction >>> 16) & 0x0f);
      
      // Certain binary operations require that both arguments be unsigned
      // integral types.  (ISO/IEC 9899:TC2 section 6.5(4))
      switch(binOp)
      {
      case "<<" :
      case ">>" :
      case "&" :
      case "^" :
      case "|" :
        if (type1.match(/^unsigned /) === null)
        {
          throw new Error("Illegal operand for the " + binOp + " operation. " +
                          "Must be of an unsigned integral type, " +
                          "but left operand has type " + type1);
        }
        break;

        if (type2.match(/^unsigned /) === null)
        {
          throw new Error("Illegal operand for the " + binOp + " operation. " +
                          "Must be of an unsigned integral type, " +
                          "but right operand has type " + type2);
        }
        break;
      }

      // Calculate the type to which both operands should be implicitly cast
      typeCoerceTo = coerse(type1, type2);
      
      // If the source is not already of the coerce-to type...
      if (type1 != typeCoerceTo)
      {
        // ... then cast it
        cast("R1", type1, typeCoerceTo);
      }

      // If the destination is not already of the coerce-to type...
      if (type2 != typeCoerceTo)
      {
        // ... then cast it
        cast("R2", type2, typeCoerceTo);
      }

      // Create a funciton that will calculate the result
      f = new Function(
        "return " +
          "mem.getReg('R1', type1) " + binOp + " mem.getReg('R2', type2)");
      
      // Call that function, and store the result back into register R1.
      mem.setReg('R1', typeCoerceTo, f());
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
     *   Bits 24-27 contain the unary operation to be performed:
     *     00 : "~"
     *     01 : "!"
     *     02 : "cast"
     *     03 : "test"
     *   Bit patterns 05-1F are reserved for future use
     *
     *   Bits 20-23 contain the type of the source operand;
     *     00 : "char"
     *     01 : "unsigned char"
     *     02 : "short"
     *     03 : "unsigned short"
     *     04 : "int"
     *     05 : "unsigned int"
     *     06 : "long"
     *     07 : "unsigned long"
     *     08 : "long long"
     *     09 : "unsigned long long"
     *     0A : "float"
     *     0B : "double"
     *     0C : "pointer"
     *   Bit patterns 0D-0E are reserved for future use
     *
     *   If the unary operation is "cast" then:
     *     Bits 16-19 contain the type to cast to
     *       00 : "char"
     *       01 : "unsigned char"
     *       02 : "short"
     *       03 : "unsigned short"
     *       04 : "int"
     *       05 : "unsigned int"
     *       06 : "long"
     *       07 : "unsigned long"
     *       08 : "long long"
     *       09 : "unsigned long long"
     *       0A : "float"
     *       0B : "double"
     *       0C : "pointer"
     *     Bit patterns 0D-0E are reserved for future use
     *
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    unaryOp : function(instruction, line)
    {
      var             op;
      var             value;
      var             typeSrc;
      var             typeDest;
      
      // Extract the operation to be executed
      op = (instruction >>> 24) & 0x0f;
      
      // Extract the type of the source operand
      typeSrc  = indexToType((instruction >>> 20) & 0x0f);

      // Do operation-specific processing
      switch(op)
      {
      case 0:                   // ~
        // Ensure that the operand is of a legal type. It must be an unsigned
        // integer type. (ISO/IEC 9899:TC2 section 6.5(4)
        if (typeSrc.match(/^unsigned /) === null)
        {
          throw new Error("Illegal operand for ~ operation. " +
                          "Type must be of some unsigned integral type, " +
                          "but found " + typeSrc);
        }

        // Retrieve the value in register R1
        value = mem.getReg("R1", typeSrc);
        
        // Invert the bits and save the result back into register R1
        mem.setReg("R1", typeSrc, ~value);
        break;
        
      case 1:                   // !
        // Ensure that the operand is of a legal type. It must be an unsigned
        // integer type. (ISO/IEC 9899:TC2 section 6.5(4)
        if (typeSrc.match(/^unsigned /) === null)
        {
          throw new Error("Illegal operand for ~ operation. " +
                          "Type must be of some unsigned integral type, " +
                          "but found " + typeSrc);
        }

        // Retrieve the value in register R1
        value = mem.getReg("R1", typeSrc);
        
        // Take the logical not of the value, and save the results back into
        // register R1.
        mem.setReg("R1", typeSrc, !value);
        break;
        
      case 2:                   // cast
        // Extract the type to cast to
        typeDest = indexToType((instruction >>> 16) & 0x0f);

        // If the type is not already of the destination type...
        if (typeSrc != typeDest)
        {
          // ... then cast it
          cast("R1", typeSrc, typeDest);
        }
        break;
        
      case 3:                   // test
        // Retrieve the value in register R1
        value = mem.getReg("R1", typeSrc);
        
        // Store into register R1 the value 0 if what we retrieved from
        // register R1 was 0; otherwise store 1.
        mem.setReg("R1", "int", value != 0);
        break;
      }
      

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
     *   Bits 16-20 contain the condition on which to jump
     *     00 : no comparison; unconditional jump
     *     01 : true
     *   Bit patterns 03-1F are reserved for future use
     *
     *   Bits 0-15 contain the address to which to jump, if the conditional
     *   test succeeds
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    jumpConditionally : function(instruction, line)
    {
      var             addr;
      var             value;
      var             condition;
      
      // Extract the condition
      condition = (instruction >>> 16) & 0x0f;
      
      // Extract the address to which we'll jump
      addr = instruction & 0xffff;

      // Do condition-specific processing
      switch(condition)
      {
      case 0 :                  // jump unconditionally
        // Nothing special to do
        break;
        
      case 1 :                  // R1 must be true to jump
        // Retrieve the value in register R1
        value = mem.getReg("R1", "unsigned int");
        
        // If it's zero...
        if (! value)
        {
          // ... then we do NOT want to jump. See ya!
          return;
        }
        break;
        
      default :
        throw new Error("Error in jump instruction: unexpected condition: " +
                        condition);
        break;
      }

      // Set the program counter so that the next instruction will execute at
      // that address.
      mem.setReg("PC", "pointer", addr);
    },
    2 : Instruction.jumpConditionally, // opcode

    /**
     * Push a value onto the stack.
     *
     * @param instruction
     *   Bits 28-31 contain the opcode.
     *
     *   Bits 24-27 contain the type of the source operand;
     *     00 : "char"
     *     01 : "unsigned char"
     *     02 : "short"
     *     03 : "unsigned short"
     *     04 : "int"
     *     05 : "unsigned int"
     *     06 : "long"
     *     07 : "unsigned long"
     *     08 : "long long"
     *     09 : "unsigned long long"
     *     0A : "float"
     *     0B : "double"
     *     0C : "pointer"
     *   Bit patterns 0D-0E are reserved for future use
     *
     *   Bits 0-15 contain the address of the value to be pushed onto the
     *   stack.
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    push : function(instruction, line)
    {
      var             value;
      var             addr;
      var             type;
      var             sp;
      
      // Extract the source address
      addr = instruction & 0xffff;
      
      // Extract the source type
      type = (instruction >>> 24) & 0xffff;
      
      // Get the stack pointer address
      sp = mem.getReg("SP", "unsigned int");
      
      // Decrement the stack pointer so it's pointing to the first unused
      // location on the stack
      sp -= mem.WORDSIZE;
      
      // Store the new value back into the stack pointer
      mem.setReg("SP", "unsigned int", sp);

      // Retrieve the value from the specified address, and store it at the
      // location pointed to by the stack pointer.
      mem.move(addr, type, sp, "unsigned int");
    },
    3 : Instruction.push,       // opcode

    /**
     * Pop a value off of the stack and store it at the specified address
     *
     * @param instruction
     *   Bits 28-31 contain the opcode.
     *
     *   Bits 24-27 contain the type of the destination operand;
     *     00 : "char"
     *     01 : "unsigned char"
     *     02 : "short"
     *     03 : "unsigned short"
     *     04 : "int"
     *     05 : "unsigned int"
     *     06 : "long"
     *     07 : "unsigned long"
     *     08 : "long long"
     *     09 : "unsigned long long"
     *     0A : "float"
     *     0B : "double"
     *     0C : "pointer"
     *   Bit patterns 0D-0E are reserved for future use
     *
     *   Bits 0-15 contain the address at which the value popped from the
     *   stack is to be saved.
     *
     * @param line {Number}
     *   The line number in the source code from which this instruction
     *   derives.
     */
    popAndStore : function(instruction, line)
    {
      var             value;
      var             addr;
      var             type;
      var             sp;
      
      // Extract the destination address
      addr = instruction & 0xffff;
      
      // Extract the destination type
      type = (instruction >>> 24) & 0xffff;
      
      // Get the stack pointer address
      sp = mem.getReg("SP", "unsigned int");
      
      // Retrieve the value from the address pointed to by the stack pointer,
      // and store it at the specified address.
      mem.move(sp, "unsigned int", addr, type);

      // Increment the stack pointer so it's pointing to the next in-use
      // location on the stack
      sp += mem.WORDSIZE;
      
      // Store the new value back into the stack pointer
      mem.setReg("SP", "unsigned int", sp);
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
      var             value;
      var             addr;
      var             sp;
      
      // Extract the address to jump to
      addr = instruction & 0xffff;
      
      // Get the stack pointer address
      sp = mem.getReg("SP", "unsigned int");
      
      // Decrement the stack pointer so it's pointing to the first unused
      // location on the stack
      sp -= mem.WORDSIZE;
      
      // Store the  value back into the stack pointer
      mem.setReg("SP", "unsigned int", sp);

      // Store the program counter's value into the new bottom of the stack
      mem.move(mem.register.PC, "unsigned int", sp, "unsigned int");
      
      // Store the new address into the program counter
      mem.setReg("PC", "unsigned int", addr);
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
      var             addr;
      var             type;
      var             sp;
      
      // Get the stack pointer address
      sp = mem.getReg("SP", "unsigned int");
      
      // Retrieve the return address from the address pointed to by the stack
      // pointer, and store it in the program counter
      mem.move(sp, "unsigned int", mem.register.PC, "unsigned int");

      // Increment the stack pointer so it's pointing to the next in-use
      // location on the stack
      sp += mem.WORDSIZE;
      
      // Store the new value back into the stack pointer
      mem.setReg("SP", "unsigned int", sp);
    },
    6 : Instruction.returnFromFunction // opcode
};

var indexToType =
  [
    "char",
    "unsigned char",
    "short",
    "unsigned short",
    "int",
    "unsigned int",
    "long",
    "unsigned long",
    "long long",
    "unsigned long long",
    "float",
    "double",
    "pointer"
  ];


/**
 * Given two original operand types, determine the type to which to coerce
 * both operands.
 *
 * @param type1 {String}
 *   One of the C types (or "pointer")
 *
 * @param type2 {String}
 *   One of the C types (or "pointer")
 *
 * @return {String}
 *   The C type to which to coerce the operands of an operation between
 *   operands originally of type1 and type2.
 */
var coerce = function(type1, type2)
{
  // First, test for the common and easy case: both types are already the same.
  if (type1 == type2)
  {
    return type1;
  }

  // If one of the operands is double, then coerce to double
  if (type1 == "double" || type2 == "double")
  {
    return "double";
  }

  // If one of the operands is float, then coerce to float
  if (type1 == "float" || type2 == "float")
  {
    return "float";
  }
  
  // If one of the operands is unsigned long long, then coerce to
  // unsigned long long.

  if (type1 == "unsigned long long" || type2 == "unsigned long long")
  {
    return "unsigned long long";
  }
  
  // If one of the operands is unsigned long, then coerce to unsigned long.
  if (type1 == "unsigned long" || type2 == "unsigned long")
  {
    return "unsigned long";
  }
  
  // If one of the operands is long, then coerce to long.
  if (type1 == "long" || type2 == "long")
  {
    return "long";
  }
  
  // If one of the operands is unsigned int, then coerce to unsigned int.
  if (type1 == "unsigned int" || type2 == "unsigned int")
  {
    return "unsigned int";
  }
  
  // In any other case, coerce to int.
  return "int";
};


var cast = function(register, typeFrom, typeTo)
{
  var value = mem.getReg(register, typeFrom);
  mem.setReg(register, typeTo, value);
};


Instruction.toOpcode = function(name)
{
  return (
  {
    "binaryOp"           : 0,
    "unaryOp"            : 1,
    "jumpConditionally"  : 2,
    "push"               : 3,
    "popAndStore"        : 4,
    "callFunction"       : 5,
    "returnFromFunction" : 6
  }[name]);
};
