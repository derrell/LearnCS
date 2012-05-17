/**
 * Create a new node.
 * 
 * @param type {String}
 *   The node type
 * 
 * @param text {String}
 *   The token text (if this node is generated as the result of a rule parsing
 *   a terminal symbol)
 * 
 * @param line {Integer}
 *   The line number in the source code of the just-parsed code.
 *
 * @param filename {String?}
 *   The file name of the source code of the just-parsed code. May not be used.
 *
 * @return {Map}
 *   A node contains 'type' containing the specified node type, 'children', an
 *   initially empty array, and 'lineno' indicating the source code line which
 *   caused the node to be created.
 */
exports.create = function(type, text, line, filename)
{
  var             node;
    
  // Create this new node
  node =
    {
      type     : type,
      children : [],
      line     : line,
      filename : filename
    };
  
  // Redefine push() to save the parent of the pushed child in the child
  node.children.push = function(child)
  {
    // If this child is a node, save the parent of this child node
    if (child !== null)
    {
      child.parent = node;
    }
    
    // Now push this child node into the parent's children list
    [].push.call(node.children, child);
  };
  
  return node;
};

/**
 * Display, recursively, the abstract syntax tree beginning at the specified
 * node
 *
 * @param node {Map|String|Null}
 *   One of:
 *    - A Node object to be displayed, along with, recursively, all of its
 *      children.
 *    - A string, representing the value of the parent node. This is used for
 *      the names of identifiers, values of integers, etc.
 *    - null, to indicate lack of an optional child of the parent node
 *
 * @param indent {Integer?}
 *   The indentation level. The top-level call may be issued without passing
 *   this parameter, in which case 0 is used.
 */
exports.display = function(node, indent)
{
  var             i;

  // Default value for indent
  indent = indent || 0;

  // Create the tree lines
  sys.print(new Array(indent + 1).join("| "));
  
  // Is this a Node object?
  if (node && typeof node == "object")
  {
    // Yup. Display its type and line number, then call its children
    // recursively.
    if (typeof node.value !== "undefined")
    {
      sys.print(node.type + ": " + node.value + "\n");
    }
    else
    {
      sys.print(node.type + " (" + node.line + ")" +  "\n");

      // Call recursively to handle children
      for (i = 0; i < node.children.length; i++)
      {
        arguments.callee(node.children[i], indent + 1);
      }
    }
  }
  else
  {
    // It's null. Display a representation of a null value.
    sys.print("<null>\n");
  }
};

