/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.ObjPendingAuthLocal",
{
  extend : liberated.dbif.Entity,
  
  construct : function(secret)
  {
    var             now = new Date();

    // Pre-initialize the data
    this.setData(
      {
        "secret"       : secret,
        "timestamp"    : (now.getFullYear() +
                          "-" +
                          ("0" + (now.getMonth() + 1)).substr(-2) +
                          "-" +
                          ("0" + now.getDate()).substr(-2) +
                          "_" +
                          ("0" + now.getHours()).substr(-2) +
                          ":" +
                          ("0" + now.getMinutes()).substr(-2) +
                          ":" +
                          ("0" + now.getSeconds()).substr(-2))
      });

    // Call the superclass constructor
    this.base(arguments, "pendingAuthLocal", secret);
  },
  
  defer : function(statics)
  {
    liberated.dbif.Entity.registerEntityType(statics.classname, 
                                             "pendingAuthLocal");

    var databaseProperties =
      {
        /** secret key used to identify this pending user */
        "secret"           : "String",

        /** User name for authentication */
        "username"         : "String",
        
        /** Password hash (SHA1) */
        "passwordHash"     : "String",
        
        /** Name to display, for this user */
        "displayName"      : "String",
        
        /** Timestamp of request (allows clearing out old requests) */
        "timestamp"        : "String"
      };

    // Register our property types.
    liberated.dbif.Entity.registerPropertyTypes("pendingAuthLocal",
                                                databaseProperties,
                                                "secret");
  }
});
