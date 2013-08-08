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
     *       email : {String}
     *         user's email address
     *
     *       isAdmin : {Boolean}
     *         true if the user is an administrator; false otherwise
     *
     *     logoutUrl : {String}
     *       The URL to access, to log out
     */
    userInit : function(error)
    {
      var ret =
        {
          whoAmI    : this.getWhoAmI(),
          logoutUrl : this.getLogoutUrl()
        };

      return ret;
    }
  }
});
