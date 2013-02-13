/**
 * An array of Node objects, with an extra facility to save the node's parent
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx = require("qooxdoo");

qx.Class.define("learncs.lib.NodeArray",
{
  extend : Array,
  
  construct : function(node)
  {
    this.__node = node;
  },

  members :
  {
    // Overridden:
    // Save the parent of the pushed child, in the child
    push :function(child)
    {
      // If this child is a node, save the parent of this child node
      if (child !== null)
      {
        child.parent = this.__node;
      }

      // Now push this child node into the parent's children list
      [].push.call(this.__node.children, child);
    }
  }
});