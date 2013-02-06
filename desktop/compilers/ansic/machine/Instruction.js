/**
 * Instructions (implemented as function calls) for this virtual machine
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

var qx = require("qooxdoo");
var sys = require("sys");
require("./Memory");

var mem = csthinker.machine.Memory.getInstance();

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
 * The second word contains, in its high-order 3 bits, the number of
 * additional words of instruction data which follow this second word. The
 * remaining bits of this second word contain debugging information for the
 * instruction. The low-order 16 bits contain the line number. The remaining
 * 13 bits are reserved for future use, to possibly include a file name index.
 */
qx.Class.define("csthinker.machine.Instruction",
{
  type    : "static",
  extend  : Object,

  statics :
  {
    /**
     *  Conversion of type number to its string representation
     */
    __indexToType :
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
      ],

    /**
     * Convert an instruction name to its corresponding number.
     * There are only three bits for the opcode, so the maximum is 7.
     */
    __nameToOpcode : function(name)
    {
      return (
      {
        "binaryOp"           : 0,
        "unaryOp"            : 1,
        "jumpConditionally"  : 2,
        "memory"             : 3,
        "functionOp"         : 4
    //    "unused1"            : 5,
    //    "unused2"            : 6,
    //    "unused3"            : 7
      }[name]);
    },

    /**
     * Conversion of an opcode value to the function that processes it.
     */
    processOpcode : null,

    //////////////////////////////////////////////////////////////////////////
    // Code execution functions
    //////////////////////////////////////////////////////////////////////////

    /**
     * Compute the result of a binary operation.  The value in register R1 is
     * the left operand of the binary operation. The value in register R2 is
     * the right operand of the binary operation. Apply the specified
     * operation. Store the result into register R1.
     *
     * @param instruction {Number}
     *   Bits 29-31 contain the opcode.
     *
     *   Bits 24-28 contain the binary operation to be performed:
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
     *   Bit patterns 0D-0F are reserved for future use
     *
     * @param instrAddr {Number}
     *   The address at which the instruction was found. This allows
     *   instructions that require additional words of information (following
     *   the debug data) to be retrieved.
     */
    binaryOp : function(instruction, instrAddr)
    {
      var             type1;
      var             type2;
      var             typeCoerceTo;
      var             binOp;
      var             operand1;
      var             operand2;
      var             result;
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
      binOp = operations[(instruction >>> 24) & 0x1f];
      
      // Extract the types of the two operands
      type1 = (instruction >>> 20) & 0x0f;
      type2 = (instruction >>> 16) & 0x0f;
      
      // Convert them to their string representations
      type1 = csthinker.machine.Instruction.__indexToType[type1];
      type2 = csthinker.machine.Instruction.__indexToType[type2];

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
      typeCoerceTo = csthinker.machine.Instruction.__coerce(type1, type2);
      
      // If the source is not already of the coerce-to type...
      if (type1 != typeCoerceTo)
      {
        // ... then cast it
        csthinker.machine.Instruction.__cast("R1", type1, typeCoerceTo);
      }

      // If the destination is not already of the coerce-to type...
      if (type2 != typeCoerceTo)
      {
        // ... then cast it
        csthinker.machine.Instruction.__cast("R2", type2, typeCoerceTo);
      }

      // Retrieve the two operands
      operand1 = mem.getReg('R1', type1);
      operand2 = mem.getReg('R2', type2);

      switch(binOp)
      {
      case ">>" :
        result = operand1 >> operand2;
        break;
        
      case "<<" :
        result = operand1 << operand2;
        break;
        
      case "&&" :
        result = operand1 && operand2;
        break;
        
      case "||" :
        result = operand1 || operand2;
        break;
        
      case "<" :
        result = operand1 < operand2;
        break;
        
      case "<=" :
        result = operand1 <= operand2;
        break;
        
      case "==" :
        result = operand1 == operand2;
        break;
        
      case "!=" :
        result = operand1 != operand2;
        break;
        
      case ">=" :
        result = operand1 >= operand2;
        break;
        
      case ">" :
        result = operand1 > operand2;
        break;
        
      case "&" :
        result = operand1 & operand2;
        break;
        
      case "|" :
        result = operand1 | operand2;
        break;
        
      case "^" :
        result = operand1 ^ operand2;
        break;
        
      case "+" :
        result = operand1 + operand2;
        break;
        
      case "-" :
        result = operand1 - operand2;
        break;
        
      case "*" :
        result = operand1 * operand2;
        break;
        
      case "/" :
        result = operand1 / operand2;
        break;
        
      case "%" :
        result = operand1 % operand2;
        break;
        
      default :
        throw new Error("Unrecognized binary operator: " + binOp);
      }

      // Store the result back into register R1.
      mem.setReg('R1', typeCoerceTo, result);
    },

    /**
     * Compute the result of a unary operation.  The value in register R1 is
     * the operand of the unary operation. Apply the specified operation.
     * Store the result into register R1.
     *
     * @param instruction {Number}
     *   Bits 29-31 contain the opcode.
     *
     *   Bits 24-28 contain the unary operation to be performed:
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
     *   Bit patterns 0D-0F are reserved for future use
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
     *     Bit patterns 0D-0F are reserved for future use
     *
     * @param instrAddr {Number}
     *   The address at which the instruction was found. This allows
     *   instructions that require additional words of information (following
     *   the debug data) to be retrieved.
     */
    unaryOp : function(instruction, instrAddr)
    {
      var             op;
      var             value;
      var             typeSrc;
      var             typeDest;
      
      // Extract the operation to be executed
      op = (instruction >>> 24) & 0x1f;
      
      // Extract the type of the source operand
      typeSrc  = (instruction >>> 20) & 0x0f;
    
      // Convert it to its string representation
      typeSrc = csthinker.machine.Instruction.__indexToType[typeSrc];

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
        typeDest = (instruction >>> 16) & 0x0f;
        
        // Convert it to its string representation
        typeDest = csthinker.machine.Instruction.__indexToType[typeDest];

        // If the type is not already of the destination type...
        if (typeSrc != typeDest)
        {
          // ... then cast it
          csthinker.machine.Instruction.__cast("R1", typeSrc, typeDest);
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

    /**
     * Compare the values in registers R1 and R2, using the specified
     * comparison condition. If the specified condition is met, jump to the
     * specified address. Otherwise, execution continues at the statement
     * after this one.
     *
     * @param instruction {Number}
     *   Bits 29-31 contain the opcode.
     * 
     *   Bits 24-28 contain the condition on which to jump
     *     00 : no comparison; unconditional jump
     *     01 : true
     *   Bit patterns 03-0F are reserved for future use
     *
     *   Bits 0-15 contain the address to which to jump, if the conditional
     *   test succeeds
     *
     * @param instrAddr {Number}
     *   The address at which the instruction was found. This allows
     *   instructions that require additional words of information (following
     *   the debug data) to be retrieved.
     */
    jumpConditionally : function(instruction, instrAddr)
    {
      var             addr;
      var             value;
      var             condition;
      
      // Extract the condition
      condition = (instruction >>> 24) & 0x1f;
      
      // Extract the address to which we'll jump
      addr = instruction & 0xffff;

      // Do condition-specific processing
      switch(condition)
      {
      case 0 :                  // jump unconditionally
        // Nothing special to do
        
        // TEMPORARY: If the jump-to address is 0xffff, throw an error to exit
        // the program.
        if (addr === 0xffff)
        {
          throw new Error("Normal program exit.");
        }
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

    /**
     * Memory operations (including stack)
     *
     * @param instruction
     *   Bits 29-31 contain the opcode.
     *
     *   Bits 24-28 contain an indication of whether this is a push or a pop
     *     00 : store from R1
     *     01 : store immediate
     *     02 : retrieve to R1
     *     03 : push
     *     04 : pop
     *     05 : swap R1, R2
     *
     *   Bits 20-23 contain the type of the source operand (for push)
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
     *   Bit patterns 0D-0F are reserved for future use
     *
     *   Bits 16-19 contain the type of the destination operand (for pop)
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
     *   Bit patterns 0D-0F are reserved for future use
     *
     *   Bits 0-15 contain the address of the value to be pushed onto the
     *   stack, or popped from the stack into.
     *
     * @param instrAddr {Number}
     *   The address at which the instruction was found. This allows
     *   instructions that require additional words of information (following
     *   the debug data) to be retrieved.
     */
    memory : function(instruction, instrAddr)
    {
      var             op;
      var             value;
      var             addr;
      var             type;
      var             sp;
      
      // Extract the sub-code specifying whether we are to push or pop
      op = (instruction >>> 24) & 0x1f;
      
      // Extract the source or destination address
      addr = instruction & 0xffff;

      switch(op)
      {
      case 0 :                  // store from R1 to memory
        // Extract the source type
        type = (instruction >>> 20) & 0x0f;

        // Extract the destination address
        addr = instruction & 0xffff;

        // Store the value in R1 to the specified address
        mem.move(csthinker.machine.Memory.register.R1, type, addr, type);
        break;
        
      case 1 :                  // store immediate to memory
        // Extract the source type
        type = (instruction >>> 20) & 0x0f;

        // Extract the destination address
        addr = instruction & 0xffff;

        // Increment the address instruction past the debug word, to the
        // immediate value to be stored.
        instrAddr += csthinker.machine.Memory.WORDSIZE * 2;

        // Store the value in to the specified address
        mem.move(instrAddr, type, addr, type);
        break;
        
      case 2 :                  // retrieve from memory into R1
        // Extract the source type
        type = (instruction >>> 20) & 0x0f;

        // Extract the source address
        addr = instruction & 0xffff;

        // Retrieve the value at the specified address into R1
        mem.move(addr, type, csthinker.machine.Memory.register.R1, type);
        break;

      case 3 :                  // push
        // Extract the source type
        type = (instruction >>> 20) & 0x0f;

        // Get the stack pointer address
        sp = mem.getReg("SP", "unsigned int");

        // Decrement the stack pointer so it's pointing to the first unused
        // location on the stack
        sp -= csthinker.machine.Memory.WORDSIZE;

        // Store the new value back into the stack pointer
        mem.setReg("SP", "unsigned int", sp);

        // Retrieve the value from the specified address, and store it at the
        // location pointed to by the stack pointer.
        mem.move(addr, type, sp, "unsigned int");
        break;
        
      case 4 :                  // pop
        // Extract the destination type
        type = (instruction >>> 16) & 0x0f;

        // Get the stack pointer address
        sp = mem.getReg("SP", "unsigned int");

        // Retrieve the value from the address pointed to by the stack pointer,
        // and store it at the specified address.
        mem.move(sp, "unsigned int", addr, type);

        // Increment the stack pointer so it's pointing to the next in-use
        // location on the stack
        sp += csthinker.machine.Memory.WORDSIZE;

        // Store the new value back into the stack pointer
        mem.setReg("SP", "unsigned int", sp);
        break;
        
      case 5 :                  // swap R1, R2
        // Retrieve the value from register R1
        value = mem.getReg("R1", "unsigned int");
        
        // Save the value from R2 in R1
        mem.setReg("R1", "unsigned int", mem.getReg("R2", "unsigned int"));
        
        // Store the former R1 value into R2
        mem.setReg("R2", "unsigned int", value);
        break;

      default :
        throw new Error("Unrecognized stack operation: " + op);
        break;
      }
    },

    /**
     * Call, or return from a function. To call a function, we push the
     * current program counter onto the stack, and jump to the function at the
     * specified address. To return from a function, we pop the return address
     * from the top of the stack, and jump to that address.
     *
     *
     * @param instruction {Number}
     *   Bits 29-31 contain the opcode.
     *
     *   Bits 24-28 dictate the function operation to be performed:
     *     00 : call a function
     *     01 : return from a function
     *
     *   Bits 0-15 contain the address to which to jump (when calling a
     *   function)
     *
     * @param instrAddr {Number}
     *   The address at which the instruction was found. This allows
     *   instructions that require additional words of information (following
     *   the debug data) to be retrieved.
     */
    functionOp : function(instruction, instrAddr)
    {
      var             op;
      var             value;
      var             addr;
      var             sp;
      
      // Extract the sub-code that indicates whether to call or return from a
      // function.
      op = (instruction >>> 24) & 0x1f;
      
      switch(op)
      {
      case 0 :                  // call a function
        // Extract the address to jump to
        addr = instruction & 0xffff;

        // Get the stack pointer address
        sp = mem.getReg("SP", "unsigned int");

        // Decrement the stack pointer so it's pointing to the first unused
        // location on the stack
        sp -= csthinker.machine.Memory.WORDSIZE;

        // Store the  value back into the stack pointer
        mem.setReg("SP", "unsigned int", sp);

        // Store the program counter's value into the new bottom of the stack
        mem.move(csthinker.machine.Memory.register.PC, "unsigned int", 
                 sp, "unsigned int");

        // Store the new address into the program counter
        mem.setReg("PC", "unsigned int", addr);
        break;
        
      case 1 :                  // return from a function
        // Get the stack pointer address
        sp = mem.getReg("SP", "unsigned int");

        // Retrieve the return address from the address pointed to by the stack
        // pointer, and store it in the program counter
        mem.move(sp, "unsigned int",
                 csthinker.machine.Memory.register.PC, "unsigned int");

        // Increment the stack pointer so it's pointing to the next in-use
        // location on the stack
        sp += csthinker.machine.Memory.WORDSIZE;

        // Store the new value back into the stack pointer
        mem.setReg("SP", "unsigned int", sp);
        break;
        
      default :
        throw new Error("Unrecognized function operation: " + op);
        break;
      }
    },


    //////////////////////////////////////////////////////////////////////////
    // Code generator functions
    //////////////////////////////////////////////////////////////////////////

    /**
     * Assemble an instruction give its constituate parts
     *
     * @param opName {String}
     *   The name of the instruction which indictes the opcode to be assigned
     *
     * @param subcode {Number}
     *   The opcode-specific subcode of the instruction
     *
     * @param typeSrc {Number}
     *   The type index of the source argument of the instruction
     *
     * @param typeDest {Number}
     *   The type index of the destination argument of the instruction
     *
     * @param addr {Number}
     *   The address argument of the instruction
     *
     * @return {Number}
     *   The word to place in memory, containing the assembled instruction.
     */
    _assemble : function(opName, subcode, typeSrc, typeDest, addr)
    {
      var             opcode;
      var             instr;

      // Convert the opcode name to its actual opcode
      opcode = csthinker.machine.Instruction.__nameToOpcode(opName);

      // Were we able to convert it?
      if (typeof opcode == "undefined")
      {
        // Nope.
        throw new Error("Unrecognized op name: " + opName);
      }

      // The caller is encouraged to pass null for irrelevant arguments, to make
      // it clear that they are unused. We'll convert them to zeros, here.
      typeSrc  = typeSrc  || 0x00;
      typeDest = typeDest || 0x00;
      addr     = addr     || 0;

      // Combine all of the pieces into a complete instruction
      instr = (((opcode & 0x07) << 29) |
               ((subcode & 0x1f) << 24) |
               ((typeSrc & 0x0f) << 20) |
               ((typeDest & 0x0f) << 16) |
               (addr & 0xffff)) >>> 0;

      // Give 'em what they came for!
      return instr;
    },

    /**
     * Assemble an instruction and write it to program memory.
     *
     * @param addrInfo {Map}
     *   A map containing a member "addr", which is the address to which the
     *   assembled instruction is to be written.
     *
     * @param line {Number}
     *   The source code line number from which this instruction derives
     *
     * @param destReg {String}
     *   The name of a register containing the address to which the instruction
     *   should be written
     *
     * @param opName {String}
     *   The name of the instruction which indictes the opcode to be assigned
     *
     * @param subcode {Number}
     *   The opcode-specific subcode of the instruction
     *
     * @param typeSrc {Number}
     *   The type index of the source argument of the instruction
     *
     * @param typeDest {Number}
     *   The type index of the destination argument of the instruction
     *
     * @param addr {Number}
     *   The address argument of the instruction
     */
    write : function(addrInfo, line,
                     opName, subcode, typeSrc, typeDest, addr,
                     data)
    {
      var             instr;

      // Assemble the instruction
      instr = this._assemble(opName, subcode, typeSrc, typeDest, addr);

      // We'll use register R3 to hold the instruction. Put the instruction
      // there, and then move it to its requested address.
      mem.setReg("R3", "unsigned int", instr);
      mem.move(csthinker.machine.Memory.register.R3, "unsigned int", 
               addrInfo.addr, "unsigned int", true);

      // Increment the instruction address to where the line number will go
      addrInfo.addr += csthinker.machine.Memory.WORDSIZE;

      // Ensure we have an array (possibly empty) of extra data for this
      // instruction
      data = data || [];

      // Write the debug information. The source code line number of this
      // instruction goes in the lower 16 bits. Encode the number of words of
      // extra data into the high-order three bits.
      mem.setReg("R3", "unsigned int",
                 (((data.length << 29) | (line & 0xffff)) >>> 0));
      mem.move(csthinker.machine.Memory.register.R3, "unsigned int",
                  addrInfo.addr, "unsigned int", 
                  true);

      // Increment to the next word
      addrInfo.addr += csthinker.machine.Memory.WORDSIZE;

      // Add any extra data after the debug information
      data.forEach(
        function(datum)
        {
          // Write this piece of extra data
          mem.setReg("R3", "unsigned int", datum);
          mem.move(csthinker.machine.Memory.register.R3, "unsigned int",
                      addrInfo.addr, "unsigned int", 
                      true);

          // Increment to the next word
          addrInfo.addr += csthinker.machine.Memory.WORDSIZE;
        });
    },
    
    //////////////////////////////////////////////////////////////////////////
    // Utility functions
    //////////////////////////////////////////////////////////////////////////

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
    __coerce : function(type1, type2)
    {
      // First, test for the common and easy case: both types are already the
      // same.
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
    },

    __cast : function(register, typeFrom, typeTo)
    {
      var value = mem.getReg(register, typeFrom);
      mem.setReg(register, typeTo, value);
    }
  },
  
  defer : function(statics)
  {
    statics.processOpcode =
      [
        statics["binaryOp"],
        statics["unaryOp"],
        statics["jumpConditionally"],
        statics["memory"],
        statics["functionOp"],
        null,
        null,
        null
      ];
  }
});

