/**
 * An end-of-file was encountered  "error"
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
  require("../lib/RuntimeError");
}

qx.Class.define("playground.c.stdio.EofError",
{
  extend : playground.c.lib.RuntimeError,
  
  construct : function()
  {
    this.base(arguments, playground.c.lib.Node._currentNode, "EOF");
  }
});
