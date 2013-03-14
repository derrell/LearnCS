/**
 * A return-value "error"
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
 * Code used during testing with Node; ignored when in playground
 * 
 * @lint ignoreUndefined(require)
 */
if (typeof qx === 'undefined')
{
  var qx = require("qooxdoo");
}

qx.Class.define("playground.c.lib.Return",
{
  extend : Error,
  
  construct : function(returnCode)
  {
    this.returnCode = returnCode;
  }
});
