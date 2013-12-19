/**
 * An exit request
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
}

qx.Class.define("playground.c.lib.Exit",
{
  extend : qx.core.Object,
  
  construct : function(exitCode)
  {
    this.base(arguments);
    this.exitCode = exitCode;
  }
});
