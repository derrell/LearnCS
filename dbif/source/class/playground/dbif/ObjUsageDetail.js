/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.ObjUsageDetail",
{
  extend : liberated.dbif.Entity,
  
  construct : function(id)
  {
    // Pre-initialize the data
    this.setData(
      {
        "id"           : null,
        "user"         : playground.dbif.MDbifCommon.getCurrentUserId(),
        "timestamp"    : playground.dbif.MDbifCommon.currentTimestamp()
      });

    // Call the superclass constructor
    this.base(arguments, "usage_detail", id);
  },
  
  defer : function(statics)
  {
    liberated.dbif.Entity.registerEntityType(statics.classname, "user");

    var databaseProperties =
      {
        //
        // Automatically-generated members
        //

        /** Id of this Usage Detail record */
        "id"                 : "Key",
        
        /** ObjUser.id of current user */
        "user"               : "Key",
        
        /** Time of this event */
        "timestamp"          : "Date",
        
        //
        // User-provided members
        //

        /** User's code (in editor) at this time */
        "snapshot"           : "LongString",
        
        /** Line number at which a breakpoint has been set */
        "set_breakpoint_at"  : "Integer",
        
        /** Line number at which a breakpoint has occurred during execution */
        "breakpoint_stop_at" : "Integer",
        
        /** Memory View button was toggled. New value is stored. */
        "show_memory_view"   : "Integer",
        
        /** A button was pressed. Value is "Run", "Step", "Continue" */
        "button_press"       : "String",
        
        /** The program terminated via an exit() call or return from main */
        "exit_code"          : "Integer",
        
        /** The program crashed. Value is the resulting error string. */
        "exit_crash"         : "String",
        
        /** Parse tree, after being properly generated (via Run) */
        "parse_tree"         : "LongString",
        
        /** Compiler or run-time error, as JSON depiction of hash map */
        "error"              : "LongString",
        
        /** Displayed compiler or run-time error error */
        "displayError"       : "String"
      };

    // Register our property types.
    liberated.dbif.Entity.registerPropertyTypes("usage_detail",
                                                databaseProperties,
                                                "id");
  }
});
