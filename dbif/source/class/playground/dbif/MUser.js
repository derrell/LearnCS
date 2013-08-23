/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MUser",
{
  construct : function()
  {
    //
    // Register the remote procedure call services available in this mixin
    //
    
    // Initialize a user
    this.registerService("learncs.userInit",
                         this.userInit,
                         [ ]);
  },

  members :
  {
    /**
     * Initialize a user
     *
     * @return {Map}
     *   Map containing the following members:
     *
     *     whoAmI : {Map}
     *       user : {String}
     *         user name
     *
     *       isAdmin : {Boolean}
     *         true if the user is an administrator; false otherwise
     *
     *     logoutUrl : {String}
     *       The URL to access, to log out
     */
    userInit : function(error)
    {
      var             userId;
      var             userObj;
      var             userData;
      var             ret;
      
      // Get the pre-calculated values for our return value
      ret =
        {
          whoAmI    : this.getWhoAmI(),
          logoutUrl : this.getLogoutUrl()
        };

      // Ensure that this user has an ObjUser object in the datastore
      liberated.dbif.Entity.asTransaction(
        function()
        {
          // See if this user is already registered
          userData = liberated.dbif.Entity.query(
            "playground.dbif.ObjUser",
            {
              type  : "element",
              field : "user",
              value : ret.whoAmI.user
            });
          
          // If not...
         if (userData.length === 0)
          {
            // ... then create the user object
            userObj = new playground.dbif.ObjUser();

            // Get the object's data
            userData = userObj.getData();
            
            // Assign the user name
            userData.user = ret.whoAmI.user;
            
            // Write it back to the database
            userObj.put();

            // Retrieve the ID of the just-written entity
            userData = liberated.dbif.Entity.query(
              "playground.dbif.ObjUser",
              {
                type  : "element",
                field : "user",
                value : ret.whoAmI.user
              })[0];
          }
          else
          {
            // User is already registered. Get the one and only query result.
            userData = userData[0];
          }
          this.setMyUserId(userData.id);
        }.bind(this));

      // This is also the beginning of a new session. Note that.
      this.usageDetail(
        [
          {
            type : "new session"
          }
        ],
        error);

      return ret;
    }
  }
});
