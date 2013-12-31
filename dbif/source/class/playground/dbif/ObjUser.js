/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.ObjUser",
{
  extend : liberated.dbif.Entity,
  
  construct : function(id)
  {
    // Pre-initialize the data
    this.setData(
      {
        "id"            : null,
        "isInstructor"  : 0,
        "templatesFrom" : []
      });

    // Call the superclass constructor
    this.base(arguments, "user", id);
  },
  
  defer : function(statics)
  {
    liberated.dbif.Entity.registerEntityType(statics.classname, "user");

    var databaseProperties =
      {
        /** Id of this user */
        "id"            : "Key",
        
        /** User name */
        "user"          : "String",
        
        /** User's display name (mostly for the instructor) */
        "displayName"   : "String",
        
        /** Whether this user is an instructor (so can save templates) */
        "isInstructor"  : "Integer",                 // Boolean (0 or 1)

        /** Where to locate templates */
        "templatesFrom" : "KeyArray"                 // references ObjUser
      };

    // Register our property types.
    liberated.dbif.Entity.registerPropertyTypes("user",
                                                databaseProperties,
                                                "id");
  }
});
