/**
 * A return-value "error"
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
@ignore(require)
@ignore(qx.bConsole)
 */

/**
 * @ignore(require)
 * @ignore(qx.bConsole)
 */
if (typeof qx === "undefined" || qx.bConsole)
{
  qx = require("qooxdoo");
  qx.bConsole = true;
  require("./RuntimeError");
}

qx.Class.define("playground.c.lib.Return",
{
  extend : playground.c.lib.RuntimeError,
  
  construct : function(node, returnCode)
  {
    this.base(arguments, node, "Return from function");
    this.returnCode = returnCode;
  }
});
