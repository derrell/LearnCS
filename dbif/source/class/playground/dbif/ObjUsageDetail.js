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
    // Pre-initialize a bit of data
    this.setData(
      {
        "user"               : playground.dbif.MDbifCommon.getCurrentUserId(),
        "timestamp"          : playground.dbif.MDbifCommon.currentTimestamp()
      });

    // Call the superclass constructor
    this.base(arguments, "usage_detail", id);
  },
  
  defer : function(statics)
  {
    liberated.dbif.Entity.registerEntityType(statics.classname, "usage_detail");

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

        /** Type of detail in this entity */
        "type"               : "String",

        /** Session change, e.g. new session, load new file, etc. */
        "session_change"     : "String", // may be issued by MUser

        /** A breakpoint changed. Value is row that toggled */
        "breakpoint_row"     : "Number",

        /** A breakpoint changed. Value is "on" or "off" */
        "breakpoint_value"   : "String",

        /** A breakpoint changed. Value is the current breakpoint rows array */
        "breakpoints"        : "NumberArray",
        
        /** Line number at which a breakpoint has occurred during execution */
        "breakpoint_stop_at" : "Integer",
        
        /** The program terminated via an exit() call or return from main */
        "exit_code"          : "Integer",
        
        /** The program crashed. Value is the resulting error string. */
        "exit_crash"         : "String",
        
        /** Change action ("insertText", "removeText", etc.) */
        "change_action"      : "string",
        
        /** Change start location (row, col) */
        "change_start"       : "NumberArray",
        
        /** Change end location (row, col) */
        "change_end"         : "NumberArray",
        
        /** Changed text */
        "change_text"        : "String",

        /** Memory View button was toggled. New boolean string is stored. */
        "show_memory_view"   : "String",
        
        /** A button was pressed, e.g., "Run", "Step", "Continue" */
        "button_press"       : "String",
        
        /** File name, if button_press is "Load File" */
        "filename"           : "String",

        /** Displayed compiler or run-time error error */
        "displayError"       : "String",

        //
        // put 'error' last, since its data can be long.
        //

        /** Compiler or run-time error, as JSON depiction of hash map */
        "error"              : "LongString"
      };

    // Register our property types.
    liberated.dbif.Entity.registerPropertyTypes("usage_detail",
                                                databaseProperties,
                                                "id");
  }
});
