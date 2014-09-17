/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * @use(playground.dbif.ObjCourse)
 * @use(playground.dbif.ObjAuthLocal)
 * @use(playground.dbif.ObjPendingAuthLocal)
 */

qx.Mixin.define("playground.dbif.MDbifCommon",
{
  include :
  [
    playground.dbif.MUser,
    playground.dbif.MUsageDetail,
    playground.dbif.MFiles,
    playground.dbif.MSettings,
    playground.dbif.MAuth
  ],

  properties :
  {
    /**
     * Information about the currently-logged-in user. The value is a map
     * containing the fields: user, isAdmin, and optionally, displayName and
     * email.
     */
    whoAmI :
    {
      nullable : true,
      init     : null,
      check    : "Object"
    },
    
    logoutUrl :
    {
      init     : "",
      check    : "String"
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
    }
  },


  members :
  {
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
      var             whoAmI;
      var             bAnonymous;

      whoAmI = this.getWhoAmI();

      // If the user is an adminstrator, ...
      if (whoAmI && whoAmI.isAdmin)
      {
        // ... they implicitly have access.
        return true;
      }

      // Are they logged in, or anonymous?
      bAnonymous = (whoAmI === null);

      // Get a shortcut to my user name
      me = (bAnonymous ? null : whoAmI.user);

      //
      // Authorize individual methods. Use of a method may be authorized for
      // any user, for any logged-in user, or only for specific users.
      //
      switch(methodName)
      {
      case "learncs.userInit":
        return ! bAnonymous;    // Access is allowed if they're logged in

      case "learncs.usageDetail":
        return ! bAnonymous;    // Access is allowed if they're logged in

      case "learncs.getDirectoryListing":
        return ! bAnonymous;    // Access is allowed if they're logged in

      case "learncs.getProgram":
        return ! bAnonymous;    // Access is allowed if they're logged in

      case "learncs.renameProgram":
        return ! bAnonymous;    // Access is allowed if they're logged in

      case "learncs.removeProgram":
        return ! bAnonymous;    // Access is allowed if they're logged in

      case "learncs.copyProgram":
        return ! bAnonymous;    // Access is allowed if they're logged in

      case "learncs.saveSettings":
        return ! bAnonymous;    // Access is allowed if they're logged in

      case "learncs.userExists":
        return true;            // Access is always allowed

/*
      case "learncs.somePrivateMethod":
        return (me == "joe@blow.com");
*/

      default:
        // Do not allow access to unrecognized method names
        return false;
      }
    },
    
    /**
     * Send a mail message
     *
     * @param mailOptions {Map}
     *   Map conforming to nodemailer specifications. Typically, it will
     *   contain four members: from, to, subject, and text.
     *
     * @param onSuccess {Function?}
     *   Function to call upon successful sending of the email. This function
     *   is called asyncronously!
     *
     * @param onFailure {Function?}
     *   Function to call upon failure to send the email.  This function
     *   is called asyncronously!
     *
     * @ignore(require)
     * @ignore(nodesqlite.Application.config)
     * @ignore(nodesqlite.Application.config.*)
     */
    sendMail : function(mailOptions, onSuccess, onFailure)
    {
      // Never let email failure crash the system
      try
      {
        // Do we have an email transport yet?
        if (! playground.dbif.MDbifCommon.transporter)
        {
          // Nope. Create one.
          (function()
           {
             var             config = nodesqlite.Application.config;
             var             fs = require("fs");
             var             nodemailer = require("nodemailer");

             // Create an email transport
             playground.dbif.MDbifCommon.transporter =
               nodemailer.createTransport(config.email);
           })();
        }


        // send mail with defined transport object
        playground.dbif.MDbifCommon.transporter.sendMail(
          mailOptions,
          function(error, info)
          {
            if (error && onFailure)
            {
              onFailure(error, info);
            }
            else if (onSuccess)
            {
              onSuccess(info);
            }
        });
      }
      catch(e)
      {
        console.log("Failed to send mail: " + e);
      }
    }
  }
});
