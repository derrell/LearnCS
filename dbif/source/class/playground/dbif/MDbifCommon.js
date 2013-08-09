/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MDbifCommon",
{
  include :
  [
    playground.dbif.MUser
  ],

  construct : function()
  {
    // Use our authorization function
    liberated.AbstractRpcHandler.authorizationFunction = 
      playground.dbif.MDbifCommon.authorize;
  },

  properties :
  {
    /**
     * Information about the currently-logged-in user. The value is a map
     * containing the fields: email, userId, and isAdmin.
     */
    whoAmI :
    {
      nullable : true,
      init     : null,
      check    : "Object",
      apply    : "_applyWhoAmI"
    },
    
    logoutUrl :
    {
      init     : "",
      check    : "String"
    }
  },

  members :
  {
    _applyWhoAmI : function(value, old)
    {
      playground.dbif.MDbifCommon.__whoAmI = value;
    }
  },

  statics :
  {
    /**
     * Standardized time stamp for all Date fields
     *
     * @return {Integer}
     *   The number of milliseconds since midnight, 1 Jan 1970
     */
    currentTimestamp : function()
    {
      return new Date().getTime();
    },

    /**
     * Function to be called for authorization to run a service
     * method.
     *
     * @param methodName {String}
     *   The fully-qualified name of the method to be called
     *
     * @return {Boolean}
     *   true to allow the function to be called, or false to indicates
     *   permission denied.
     */
    authorize : function(methodName)
    {
      var             me;
      var             bAnonymous;

      // Are they logged in, or anonymous?
      bAnonymous = (playground.dbif.MDbifCommon.__whoAmI === null);

      // Get a shortcut to my email address
      me = (bAnonymous ? null : playground.dbif.MDbifCommon.__whoAmI.email);

      // If the user is an adminstrator, ...
      if (! bAnonymous && playground.dbif.MDbifCommon.__whoAmI.isAdmin)
      {
        // ... they implicitly have access.
        return true;
      }

      //
      // Authorize individual methods. Use of a method may be authorized for
      // any user, for any logged-in user, or only for specific users.
      //
      switch(methodName)
      {
      case "learncs.userInit":
        return ! bAnonymous;    // Access is allowed if they're logged in

/*
      case "learncs.somePrivateMethod":
        return (me == "joe@blow.com");
*/

      default:
        // Do not allow access to unrecognized method names
        return false;
      }
    }
  }
});