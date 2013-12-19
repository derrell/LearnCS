/**
 * Instructions (implemented as function calls) for this virtual machine
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
#ignore(require)
#ignore(qx.bConsole)
 */

/**
 * Code used during testing with Node; ignored when in playground
 * 
 * @ignore(require)
 * @ignore(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
  qx.bConsole = true;
  require("./Memory");
}

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
qx.Class.define("playground.c.machine.Instruction",
{
  type    : "static",

  statics :
  {
    /** Reference to the Memory singleton instance */
    mem : null,

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
     *  Conversion of type name to its numeric index
     */
    __typeToIndex :
      {
        "char"               : 0,

        "unsigned char"      : 1,
        "uchar"              : 1,

        "short"              : 2,

        "unsigned short"     : 3,
        "ushort"             : 3,

        "int"                : 4,

        "unsigned int"       : 5,
        "uint"               : 5,
        "null"               : 5, // assume unsigned int for any unspecified

        "long"               : 6,

        "unsigned long"      : 7,
        "ulong"              : 7,

        "long long"          : 8,
        "llong"              : 8,

        "unsigned long long" : 9,
        "ullong"             : 9,

        "float"              : 10,

        "double"             : 11,

        "pointer"            : 12
      },

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
     * Compute the result of a binary operation.  The value at the top of the
     * expression stack is the right operand of the binary operation. The
     * second value from the top of the expression stack is the left operand
     * of the binary operation. Apply the specified operation. Push the result
     * back onto the expression stack.
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
      var             mem = playground.c.machine.Instruction.mem;
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
      type1 = playground.c.machine.Instruction.__indexToType[type1];
      type2 = playground.c.machine.Instruction.__indexToType[type2];

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

        if (type2.match(/^unsigned /) === null)
        {
          throw new Error("Illegal operand for the " + binOp + " operation. " +
                          "Must be of an unsigned integral type, " +
                          "but right operand has type " + type2);
        }
        break;
      }

      // Calculate the type to which both operands should be implicitly cast
      typeCoerceTo = playground.c.machine.Instruction.__coerce(type1, type2);
      
      // If the source is not already of the coerce-to type...
      if (type1 != typeCoerceTo)
      {
        // ... then cast it
        playground.c.machine.Instruction.__cast("R1", type1, typeCoerceTo);
      }

      // If the destination is not already of the coerce-to type...
      if (type2 != typeCoerceTo)
      {
        // ... then cast it
        playground.c.machine.Instruction.__cast("R2", type2, typeCoerceTo);
      }

      // Retrieve the two operands
      operand2 = playground.c.machine.Instruction.__epop(type1, "R2");
      operand1 = playground.c.machine.Instruction.__epop(type1, "R1");

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

      // Push the result back onto the expression stack
      mem.setReg("R1", typeCoerceTo, result);
      playground.c.machine.Instruction.__epush(typeCoerceTo, "R1");
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
      var             mem = playground.c.machine.Instruction.mem;

      
      // Extract the operation to be executed
      op = (instruction >>> 24) & 0x1f;
      
      // Extract the type of the source operand
      typeSrc  = (instruction >>> 20) & 0x0f;
    
      // Convert it to its string representation
      typeSrc = playground.c.machine.Instruction.__indexToType[typeSrc];

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

        // Retrieve the value from the top of the expression stack
        value = playground.c.machine.Instruction.__epop(typeSrc, "R1");
        
        // Invert the bits and push the result back onto the expression stack
        mem.setReg("R1", typeSrc, ~value);
        playground.c.machine.Instruction.__epush(typeSrc, "R1");
        break;
        
      case 1:                   // !
        // Ensure that the operand is of a legal type. It must be an unsigned
        // integer type. (ISO/IEC 9899:TC2 section 6.5(4)
        if (typeSrc.match(/^unsigned /) === null)
        {
          throw new Error("Illegal operand for ! operation. " +
                          "Type must be of some unsigned integral type, " +
                          "but found " + typeSrc);
        }

        // Retrieve the value from the top of the expression stack
        value = playground.c.machine.Instruction.__epop(typeSrc, "R1");
        
        // Take the logical not of the value, and save the results back onto
        // the expression stack
        mem.setReg("R1", typeSrc, !value);
        playground.c.machine.Instruction.__epush(typeSrc, "R1");
        break;
        
      case 2:                   // cast
        // Extract the type to cast to
        typeDest = (instruction >>> 20) & 0x0f;
        
        // Convert it to its string representation
        typeDest = playground.c.machine.Instruction.__indexToType[typeDest];

        // If the type is not already of the destination type...
        if (typeSrc != typeDest)
        {
          // ... then cast it
          playground.c.machine.Instruction.__cast("R1", typeSrc, typeDest);
        }
        break;
        
      case 3:                   // test
        // Retrieve the value from the top of the expression stack, into
        // register R1
        value = playground.c.machine.Instruction.__epop(typeSrc, "R1");
        
        // Store into register R1 the value 0 if what we retrieved from
        // register R1 was 0; otherwise store 1.
        mem.setReg("R1", "int", value != 0);
        break;
      }
    },

    /**
     * Jump to a specified address, optionally after checking that R1 is
     * either true or false.
     *
     * @param instruction {Number}
     *   Bits 29-31 contain the opcode.
     *
     *   Bits 24-28 contain the condition on which to jump
     *     00 : no comparison; unconditional jump
     *     01 : true
     *     02 : false
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
      var             mem = playground.c.machine.Instruction.mem;
      
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
        
      case 2 :                  // R1 must be false to jump
        // Retrieve the value in register R1
        value = mem.getReg("R1", "unsigned int");
        
        // If it's non-zero...
        if (value)
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
     * @param instruction {Number}
     *   Bits 29-31 contain the opcode.
     *
     *   Bits 24-28 have the subcode indicating the specific memory operation 
     *     00 : store from R1
     *     01 : store immediate
     *     02 : retrieve to R1
     *     03 : push
     *     04 : pop
     *     05 : swap R1, R2
     *     06 : epush
     *     07 : epop
     *
     *   Bits 20-23 contain the type of the source (or only) operand
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
     *   Bits 16-19 contain the type of the destination operand
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
      var             mem = playground.c.machine.Instruction.mem;
      
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
        mem.move(playground.c.machine.Memory.register.R1, type, addr, type);
        break;
        
      case 1 :                  // store immediate to memory
        // Extract the source type
        type = (instruction >>> 20) & 0x0f;

        // Extract the destination address
        addr = instruction & 0xffff;

        // Increment the address instruction past the debug word, to the
        // immediate value to be stored.
        instrAddr += playground.c.machine.Memory.WORDSIZE * 2;

        // Store the value in to the specified address
        mem.move(instrAddr, type, addr, type);
        break;
        
      case 2 :                  // retrieve from memory into R1
        // Extract the source type
        type = (instruction >>> 20) & 0x0f;

        // Extract the source address
        addr = instruction & 0xffff;

        // Retrieve the value at the specified address into R1
        mem.move(addr, type, playground.c.machine.Memory.register.R1, type);
        break;

      case 3 :                  // push
        // Extract the source type
        type = (instruction >>> 20) & 0x0f;

        // Get the stack pointer address
        sp = mem.getReg("SP", "unsigned int");

        // Decrement the stack pointer so it's pointing to the first unused
        // location on the stack
        sp -= playground.c.machine.Memory.WORDSIZE;

        // Store the new value back into the stack pointer
        mem.setReg("SP", "unsigned int", sp);

        // Retrieve the value from the specified address, and store it at the
        // location pointed to by the stack pointer.
        mem.move(addr, type, sp, "unsigned int");
        break;
        
      case 4 :                  // pop
        // Extract the type of the value
        type = (instruction >>> 20) & 0x0f;

        // Get the stack pointer address
        sp = mem.getReg("SP", "unsigned int");

        // Retrieve the value from the address pointed to by the stack pointer,
        // and store it at the specified address.
        mem.move(sp, "unsigned int", addr, type);

        // Increment the stack pointer so it's pointing to the next in-use
        // location on the stack
        sp += playground.c.machine.Memory.WORDSIZE;

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

      case 6 :                  // epush (push onto expression stack)
        playground.c.machine.Instruction.__epush(
          (instruction >>> 20) & 0x0f, addr);
        break;
        
      case 7 :                  // epop (pop from expression stack)
        playground.c.machine.Instruction.__epop(
          (instruction >>> 20) & 0x0f, addr);
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
      var             addr;
      var             sp;
      var             mem = playground.c.machine.Instruction.mem;
      
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
        sp -= playground.c.machine.Memory.WORDSIZE;

        // Store the  value back into the stack pointer
        mem.setReg("SP", "unsigned int", sp);

        // Store the program counter's value into the new bottom of the stack
        mem.move(playground.c.machine.Memory.register.PC, "unsigned int", 
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
                 playground.c.machine.Memory.register.PC, "unsigned int");

        // Increment the stack pointer so it's pointing to the next in-use
        // location on the stack
        sp += playground.c.machine.Memory.WORDSIZE;

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
    _assemble : function(opName, typeSrc, typeDest, addr)
    {
      var             op;
      var             opcode;
      var             subcode;
      var             instr;
      var             pseudoops =
        {
          ">>"    : [ "binaryOp", 0x00 ],
          "<<"    : [ "binaryOp", 0x01 ],
          "&&"    : [ "binaryOp", 0x02 ],
          "||"    : [ "binaryOp", 0x03 ],
          "<"     : [ "binaryOp", 0x04 ],
          "<="    : [ "binaryOp", 0x05 ],
          "=="    : [ "binaryOp", 0x06 ],
          "!="    : [ "binaryOp", 0x07 ],
          ">="    : [ "binaryOp", 0x08 ],
          ">"     : [ "binaryOp", 0x09 ],
          "&"     : [ "binaryOp", 0x0A ],
          "|"     : [ "binaryOp", 0x0B ],
          "^"     : [ "binaryOp", 0x0C ],
          "+"     : [ "binaryOp", 0x0D ],
          "-"     : [ "binaryOp", 0x0E ],
          "*"     : [ "binaryOp", 0x0F ],
          "/"     : [ "binaryOp", 0x10 ],
          "%"     : [ "binaryOp", 0x11 ],

          "~"     : [ "unaryOp", 0x00 ],
          "!"     : [ "unaryOp", 0x01 ],
          "cast"  : [ "unaryOp", 0x02 ],
          "test"  : [ "unaryOp", 0x03 ],

          "jump"  : [ "jumpConditionally", 0x00 ],
          "jit"   : [ "jumpConditionally", 0x01 ],
          "jif"   : [ "jumpConditionally", 0x02 ],

          "put"   : [ "memory", 0x00 ],
          "puti"  : [ "memory", 0x01 ],
          "get"   : [ "memory", 0x02 ],
          "push"  : [ "memory", 0x03 ],
          "pop"   : [ "memory", 0x04 ],
          "swap"  : [ "memory", 0x05 ],
          "epush" : [ "memory", 0x06 ],
          "epop"  : [ "memory", 0x07 ],

          "call"  : [ "functionOp", 0x00 ],
          "ret"   : [ "functionOp", 0x01 ]
        };

      // Convert the pseudo operation into its opcode and subcode parts
      op = pseudoops[opName];

      // Ensure it exists
      if (typeof op == "undefined")
      {
        throw new Error("Unrecognized op name: " + opName);
      }

      // Convert the opcode name to its actual opcode, and retrieve the subcode
      opcode = playground.c.machine.Instruction.__nameToOpcode(op[0]);
      subcode = op[1];

      // If we're given string type names, convert them to indexes
      if (typeof typeSrc == "string")
      {
        typeSrc = playground.c.machine.Instruction.__typeToIndex[typeSrc];
        if (typeof typeSrc == "undefined")
        {
          throw new Error("Programmer error: Unrecognized source type");
        }
      }

      if (typeof typeDest == "string")
      {
        typeDest = playground.c.machine.Instruction.__typeToIndex[typeDest];
        if (typeof typeDest == "undefined")
        {
          throw new Error("Programmer error: Unrecognized destination type");
        }
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
     * @param instruction {String}
     *   A text description of the instruction to be assembled and written
     *
     * @param addrInfo {Map}
     *   A map containing a member "addr", which is the address to which the
     *   assembled instruction is to be written.
     *
     * @param line {Number}
     *   The source code line number from which this instruction derives
     *
     * @ignore(eval)
     */
    write : function(instruction, addrInfo, line)
    {
      var             instr;
      var             opName;
      var             typeSrc;
      var             typeDest;
      var             addr;
      var             data;
      var             args;
      var             Memory = playground.c.machine.Memory;
      var             mem = playground.c.machine.Instruction.mem;

      // Function to retrieve a word address in the globals&statics area
      var GLOBAL = function(index)
      {
        return (Memory.info.gas.start + (Memory.WORDSIZE * index));
      };
      
      // Make a copy of the program line, so we can prepend and append arguments
      args = instruction.split(" ");

      // If there's an address provided...
      if (args.length > 3)
      {
        // ... then evaluate it. It may be a function call.
        if (! args[3].match(/^GLOBAL[(]|[0-9]/))
        {
          throw new Error("Line " + line + ": " +
                          "Illegal address specified (" + instruction + ")");
        }
        args[3] = eval(args[3]);
      }

      // Convert any arguments after the address into a data array, remove those
      // elements from the arguments array, and then add the data array onto the
      // end of the arguments.
      if (args.length > 4)
      {
        data = args.slice(4).map(function(datum) { return eval(datum); } );
        args = args.slice(0, 4);
        args.push(data);
      }

      // Retrieve the individual arguments
      opName = args[0];
      typeSrc = (typeof args[1] == "undefined" ? null : args[1]);
      typeDest = (typeof args[2] == "undefined" ? null : args[2]);
      addr = (typeof args[3] == "undefined" ? null : args[3]);

      // Assemble the instruction
      instr = playground.c.machine.Instruction._assemble(
        opName, typeSrc, typeDest, addr);

      // We'll use register R3 to hold the instruction. Put the instruction
      // there, and then move it to its requested address.
      mem.setReg("R3", "unsigned int", instr);
      mem.move(playground.c.machine.Memory.register.R3, "unsigned int", 
               addrInfo.addr, "unsigned int", true);

      // Increment the instruction address to where the line number will go
      addrInfo.addr += playground.c.machine.Memory.WORDSIZE;

      // Ensure we have an array (possibly empty) of extra data for this
      // instruction
      data = data || [];

      // Write the debug information. The source code line number of this
      // instruction goes in the lower 16 bits. Encode the number of words of
      // extra data into the high-order eight bits.
      mem.setReg("R3", "unsigned int",
                 (((data.length << 24) | (line & 0xffff)) >>> 0));
      mem.move(playground.c.machine.Memory.register.R3, "unsigned int",
                  addrInfo.addr, "unsigned int", 
                  true);

      // Increment to the next word
      addrInfo.addr += playground.c.machine.Memory.WORDSIZE;

      // Add any extra data after the debug information
      data.forEach(
        function(datum)
        {
          // Write this piece of extra data
          mem.setReg("R3", "unsigned int", datum);
          mem.move(playground.c.machine.Memory.register.R3, "unsigned int",
                      addrInfo.addr, "unsigned int", 
                      true);

          // Increment to the next word
          addrInfo.addr += playground.c.machine.Memory.WORDSIZE;
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
      var             mem = playground.c.machine.Instruction.mem;
      var             value = mem.getReg(register, typeFrom);

      mem.setReg(register, typeTo, value);
    },
    
    __epush : function(type, addr)
    {
      var             esp;
      var             mem = playground.c.machine.Instruction.mem;
      
      // If the address given is a string...
      if (typeof addr == "string")
      {
        // ... then it's a register name. Convert it to an address
        addr = playground.c.machine.Memory.register[addr];
      }
      
      // Get the stack pointer address
      esp = mem.getReg("ESP", "unsigned int");

      // Decrement the stack pointer so it's pointing to the first unused
      // location on the stack
      esp -= playground.c.machine.Memory.WORDSIZE;

      // Store the new value back into the stack pointer
      mem.setReg("ESP", "unsigned int", esp);

      // Retrieve the value from the specified address, and store it at the
      // location pointed to by the stack pointer.
      mem.move(addr, type, esp, "unsigned int");
    },

    /**
     * Pop a value off of the expression stack. It gets popped into the
     * specified address, and also returned by this function.
     *
     * @param type {String}
     *   The C type of which the value is written to the specified address
     *
     * @param addr {Number}
     *   The destination address.
     *
     * @return {Number}
     *   The value that was popped
     *
     */
    __epop : function(type, addr)
    {
      var             esp;
      var             mem = playground.c.machine.Instruction.mem;

      // If the address given is a string...
      if (typeof addr == "string")
      {
        // ... then it's a register name. Convert it to an address
        addr = playground.c.machine.Memory.register[addr];
      }
      
      // Get the stack pointer address
      esp = mem.getReg("ESP", "unsigned int");

      // Retrieve the value from the address pointed to by the stack pointer,
      // and store it at the specified address.
      mem.move(esp, "unsigned int", addr, type);

      // Increment the stack pointer so it's pointing to the next in-use
      // location on the stack
      esp += playground.c.machine.Memory.WORDSIZE;

      // Store the new value back into the stack pointer
      mem.setReg("ESP", "unsigned int", esp);
      
      // Return the value we just stored
      return mem.get(addr, type);
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
    
    statics.mem = playground.c.machine.Memory.getInstance();
  }
});

