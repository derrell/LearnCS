/**
 * A continue "error"
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/*
#ignore(require)
 */

/**
 * @lint ignoreUndefined(require)
 */
if (typeof qx === "undefined" && typeof window === "undefined")
{
  qx = require("qooxdoo");
  require("./RuntimeError");
}

qx.Class.define("playground.c.lib.Continue",
{
  extend : playground.c.lib.RuntimeError,
  
  construct : function(node)
  {
    this.base(arguments,
              node,
              "Encountered 'continue' while not in loop");
  }
});
