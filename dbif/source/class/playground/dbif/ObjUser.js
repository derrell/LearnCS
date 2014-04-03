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
        "enrolledIn"    : [],
        "templatesFrom" : [],
        "courseAccess"  : [],
        "researchOk"    : 0
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

        /** Users whose templates this user has access to */
        "templatesFrom" : "KeyArray",                // references ObjUser
        
        /** Enrolled courses */
        "enrolledIn"    : "KeyArray",                // references ObjCourse

        /** Courses to which this user has access to all users */
        "courseAccess" : "KeyArray",                 // references ObjCourse
        
        /** Accepted research agreement */
        "researchOk"   : "Integer"                   // Boolean (0 or 1)
      };

    // Register our property types.
    liberated.dbif.Entity.registerPropertyTypes("user",
                                                databaseProperties,
                                                "id");
  }
});
