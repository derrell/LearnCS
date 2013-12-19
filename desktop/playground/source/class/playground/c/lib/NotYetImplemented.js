/**
 * A not-yet-implemented error
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

qx.Class.define("playground.c.lib.NotYetImplemented",
{
  extend : qx.core.Object,
  
  construct : function(thingNotImplemented)
  {
    this.base(arguments);
    this.thingNotImplemented = thingNotImplemented;
  }
});
