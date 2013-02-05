var sys = require("sys");
var Memory = require("./Memory");
var instr = require("./Instruction");

var mem = Memory.getInstance();

mem.debugDisplay("Initial reg: ",
                 Memory.info.reg.start, Memory.info.reg.length);

mem.setReg("R1", "unsigned int", 0x11223344);
mem.debugDisplay("After setting R1: ",
                 Memory.info.reg.start, Memory.info.reg.length);
