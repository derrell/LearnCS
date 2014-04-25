/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.ObjAuthLocal",
{
  extend : liberated.dbif.Entity,
  
  construct : function(id)
  {
    // Pre-initialize the data
    this.setData(
      {
        "username" : null
      });

    // Call the superclass constructor
    this.base(arguments, "authLocal", id);
  },
  
  defer : function(statics)
  {
    liberated.dbif.Entity.registerEntityType(statics.classname, "authLocal");

    var databaseProperties =
      {
        /** User name for authentication */
        "username"         : "String",
        
        /** Password hash (SHA1) */
        "passwordHash"     : "String",
        
        /** Name to display, for this user */
        "displayName"      : "String",
        
        /** User's email address */
        "email"            : "String"
      };

    // Register our property types.
    liberated.dbif.Entity.registerPropertyTypes("authLocal",
                                                databaseProperties,
                                                "username");
  }
});
