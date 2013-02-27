/**
 * Tests for stack operations
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

require("../Tester");

var program;
var test;

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "push",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "push uint null GLOBAL(0)",       // push global word 0 onto the stack
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  var Memory = learncs.machine.Memory;

  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(Memory.register.SP, "uint") === 
            Memory.info.rts.start + Memory.info.rts.length - Memory.WORDSIZE);
};

Tester.test(program, test);

//////////////////////////////////////////////////////////////////////////////

program =
  [
    "push/pop",

    "puti uint null GLOBAL(0) 0x13C", // assign 0x13C to global word 0
    "puti uint null GLOBAL(1) 0x23",  // assign 0x23 to global word 1
    "push uint null GLOBAL(0)",       // push global word 0 onto the stack
    "pop uint null GLOBAL(1)",        // pop the stack into global word 1
    "jump null null 0xffff"           // exit
  ];

test = function(mem, GLOBAL)
{
  var Memory = learncs.machine.Memory;

  return (mem.get(GLOBAL(0), "uint") === 0x13C &&
          mem.get(GLOBAL(1), "uint") === 0x13C &&
          mem.get(Memory.register.SP, "uint") === 
            Memory.info.rts.start + Memory.info.rts.length);
};

Tester.test(program, test);

