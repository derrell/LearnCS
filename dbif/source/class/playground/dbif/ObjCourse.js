/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.ObjCourse",
{
  extend : liberated.dbif.Entity,
  
  construct : function(id)
  {
    // Pre-initialize the data
    this.setData(
      {
        "id"               : null,
        "isEnrollmentOpen" : 1,
        "instructors"      : [],
        "labInstructors"   : []
      });

    // Call the superclass constructor
    this.base(arguments, "course", id);
  },
  
  defer : function(statics)
  {
    liberated.dbif.Entity.registerEntityType(statics.classname, "course");

    var databaseProperties =
      {
        /** Id of this course */
        "id"               : "Key",
        
        /** Institution providing the course */
        "institution"      : "String",

        /** Course name */
        "courseName"       : "String",
        
        /** Lab day */
        "labDay"           : "String",
        
        /** Lab start time */
        "labStartTime"     : "String",

        /** Whether enrollment is open or not */
        "isEnrollmentOpen" : "Integer",         // boolean, 1 or 0
        
        /** Course Instructors */
        "instructors"      : "KeyArray",        // references ObjUser
        
        /** Lab instructors */
        "labInstructors"   : "KeyArray"         // references ObjUser
      };

    // Register our property types.
    liberated.dbif.Entity.registerPropertyTypes("course",
                                                databaseProperties,
                                                "id");
  }
});
