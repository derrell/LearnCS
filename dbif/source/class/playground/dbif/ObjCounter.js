/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.ObjCounter",
{
  extend : liberated.dbif.Entity,
  
  construct : function(id)
  {
    // Pre-initialize the data
    this.setData(
      {
        "id"        : null,
        "count"     : 0
      });

    // Call the superclass constructor
    this.base(arguments, "counter", id);
  },
  
  defer : function(clazz)
  {
    liberated.dbif.Entity.registerEntityType(clazz.classname, "counter");

    var databaseProperties =
      {
        /** Id of this counter */
        "id"    : "String",
        
        /** Current counter value */
        "count" : "Integer"
      };

    // Register our property types.  'id' is the key field.
    liberated.dbif.Entity.registerPropertyTypes("counter",
                                                databaseProperties,
                                                "id");
  }
});
