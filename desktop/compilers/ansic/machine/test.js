var sys = require("sys");
var mem = require("./Memory");
var instr = require("./Instruction");

var data = mem.getInstance().toDisplayArray(0, 32);
sys.print(" 0: ");
data.forEach(
  function(value, i)
  {
    if (i != 0 && i % 16 == 0)
    {
      sys.print("\n" + ("000000000" + i.toString(16)).substr(-2) + ": ");
    }
    sys.print(("00" + value.toString(16)).substr(-2) + " ");
  });
sys.print("\n");
