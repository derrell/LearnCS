/**
 * Error handling for the parser
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/* Saved parser object */
var parser = null;

/**
 * Save the parser object so upon error, we can determine the input text
 * which caused it.
 *
 * @param p {parser}
 *   The parser object which contains a lexer object which contains
 *   information about text being processed.
 */
exports.setParser = function(p)
{
  parser = p;
}


/**
 * Function called upon each error encountered during parsing
 * 
 * @param str {String}
 *   A pre-defined error string which shows where in the line the error
 *   occurred.
 * 
 * @param hash {Map}
 *   A map containing details of the error and its location.
 */
exports.parseError = function(str, hash)
{
  var             sys = require("sys");

  if (true)
  {
    var errStr =
      "Parse error on line " +
      hash.line +
      ":\n" +
      parser.lexer.showPosition() +
      "\n"
      ;

    sys.print(errStr + "\n");
  }
  else
  {
    // For debugging, this code displays all values of hash.
    sys.print(str + "\n");

    sys.print("Details:\n");
    for (var x in hash)
    {
      sys.print("  " + x + ": " + hash[x] + "\n");
    }
  }

  // Increment the number of errors encountered so far.
  ++exports.errorCount;
};

/** Count of errors encountered so far */
exports.errorCount = 0;

