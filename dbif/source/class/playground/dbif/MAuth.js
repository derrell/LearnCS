/**
 * Copyright (c) 2014 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MAuth",
{
  construct : function()
  {
    //
    // Register the remote procedure call services available in this mixin
    //
    
    // Determine if a user name already exists
    this.registerService("learncs.userExists", 
                         this.userExists,
                         [ 
                           "username"
                         ]);

    // Complete creation of a new user account
    this.registerService("learncs.completeNewUser", 
                         this.completeNewUser,
                         [ "secret" ]);
  },

  statics :
  {
    transporter : null          // initialized in defer
  },

  members :
  {
    /**
     * Determine whether a user name already exists in AuthLocal
     *
     * @param username {String}
     *   New user's email address (which becomes their user name)
     * 
     * @return {Integer}
     *   1 if the user exists; 0 otherwise
     */
    userExists : function(username)
    {
      var             users;
      var             bFound;

      // See if this user exists
      users = liberated.dbif.Entity.query(
        "playground.dbif.ObjAuthLocal",
        {
          type  : "element",
          field : "username",
          value : username.toLowerCase()
        });

      // Let 'em know whether the user name was found
      bFound = users && users.length > 0;
      return bFound ? 1 : 0;
    },
    
    /**
     * Begin creating a new AuthLocal user account. This adds the requested
     * credentials to AuthLocalPending, and sends email to the user. The
     * account is pending until they click on the link in the email, at which
     * time the completeNewUser RPC is initiated.
     *
     * @param username {String}
     *   New user's email address (which becomes their user name)
     * 
     * @param password {String}
     *   New user's password
     * 
     * @param displayName {String}
     *   Full name of new user
     * 
     * @return {Integer}
     *   0 upon success; non-zero upon error
     *
     * @ignore(require)
     * @ignore(nodesqlite.Application.config)
     * @ignore(nodesqlite.Application.config.*)
     */
    requestNewUser : function(username, password, displayName)
    {
      return liberated.dbif.Entity.asTransaction(
        function()
        {
          var             i;
          var             r;
          var             pendingAuthLocalObj;
          var             pendingAuthLocalData;
          var             passwordHash;
          var             fs = require("fs");
          var             crypto = require('crypto');
          var             shasum = crypto.createHash('sha1');
          var             secret = [];
          var             now = new Date();
          var             mailOptions;

          // Hash the entered password
          shasum.update(password);
          passwordHash = shasum.digest('hex');

          // Build a random secret
          secret.push(username);
          secret.push("/");
          for (i = 0; i < 32; i++)
          {
            r = Math.floor(Math.random() * 63);
            secret.push(
              ("abcdefghijklmnopqrstuvwxyz" +
               "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
               "1234567890 ")[r]);
          }

          // Create a new Pending Auth Local object
          pendingAuthLocalObj = 
            new playground.dbif.ObjPendingAuthLocal(secret.join(""));
          
          // Get the user data object
          pendingAuthLocalData = pendingAuthLocalObj.getData(username);
          
          // Set the data
          pendingAuthLocalData.username = username;
          pendingAuthLocalData.passwordHash = passwordHash;
          pendingAuthLocalData.displayName = displayName;
          
          // Save this new pending auth object
          pendingAuthLocalObj.put();
          
          // Do we have an email transport yet?
          if (! playground.dbif.MAuth.transporter)
          {
            // Nope. Create one.
            (function()
             {
               var             config = nodesqlite.Application.config;
               var             fs = require("fs");
               var             nodemailer = require("nodemailer");

               // Create an email transport
               playground.dbif.MAuth.transporter =
                 nodemailer.createTransport(config.email);
             })();
          }

          // Send email
          mailOptions = 
            {
              from    : "LearnCS! <noreply@learn.cs.uml.edu>",
              to      : username,
              subject : "Your LearnCS! account",
              text    : ("Please confirm your LearnCS! account request " +
                         "by visiting this link: " +
                         nodesqlite.Application.config.url +
                         "/confirmuser?" + 
                         "q=" + encodeURIComponent(secret.join("")) +
                         "\n\n" +
                         "(Do not click the link if you did not issue " +
                         "a LearnCS! new-user or password reset request)")
            };

          // send mail with defined transport object
          playground.dbif.MAuth.transporter.sendMail(
            mailOptions,
            function(error, info)
            {
              var             sync = require("synchronize");
              
              if(error)
              {
                console.log("Failed to send confirmation message to " +
                            username + ": " + error);
                
                // We couldn't send the email, so there's no reason to keep
                // the pendingAuthLocal object around any longer.
                //
                // NOTE: This will happen outside of the transaction, and
                // outside of the original fiber created in Application.js
                sync.fiber(
                  function()
                  {
                    pendingAuthLocalObj.removeSelf();
                  });
              }
              else
              {
                console.log("Confirmation message sent to " + 
                            username + ": " + info.response);
              }
          });

          // If someone is configured to receive email notification of new
          // accounts...
          if (nodesqlite.Application.config.notifyRecipients)
          {
            // Send email
            mailOptions = 
              {
                from    : "LearnCS! <noreply@learn.cs.uml.edu>",
                to      : nodesqlite.Application.config.notifyRecipients,
                subject : "New account notification",
                text    : ("A new account has been requested:\n" +
                           "  " + displayName + " <" + username + ">")
              };

            // send mail with defined transport object
            playground.dbif.MAuth.transporter.sendMail(
              mailOptions,
              function(error, info)
              {
                if(error)
                {
                  console.log("Failed to send notification message to " +
                              nodesqlite.Application.config.notifyRecipients +
                              ": " + error);
                }
                else
                {
                  console.log("Notification message sent to " + 
                              nodesqlite.Application.config.notifyRecipients +
                              ": " + info.response);
                }
            });
          }

          return 0;
        }.bind(this));
    },
    
    /**
     * Reset a local user's password. This just retrieves the user's display
     * name and then calls requestNewUser() to do all of the heavy lifting.
     *
     * @param username {String}
     *   New user's email address (which becomes their user name)
     * 
     * @param password {String}
     *   New user's password
     * 
     * @return {Integer}
     *   0 upon success; non-zero upon error
     *
     * @ignore(require)
     */
    resetPassword : function(username, password)
    {
      var             users;

      // Look up this user to ensure he exists and to get his display name
      users = liberated.dbif.Entity.query(
        "playground.dbif.ObjAuthLocal",
        {
          type  : "element",
          field : "username",
          value : username.toLowerCase()
        });
      
      // Did we find him?
      if (! users || users.length != 1)
      {
        // Nope. Nothing to do. Don't indicate error; just silently fail.
        return 0;
      }
      
      // Call requestNewUser() to do the rest of the work
      return this.requestNewUser(username, password, users[0].displayName);
    },
    
    /**
     * Complete creating a new authLocal user account. This function should be
     * called when the user has clicked on their emailed confirmation
     * link. Find the pendingAuthLocal object for the given secret, copy its
     * data to authLocal, and delete the pendingAuthLocal object.
     *
     * @param username {String}
     *   New user's email address (which becomes their user name)
     * 
     * @param password {String}
     *   New user's password
     * 
     * @param displayName {String}
     *   Full name of new user
     * 
     * @return {Integer}
     *   0 upon success; non-zero upon error
     */
    completeNewUser : function(secret)
    {
      return liberated.dbif.Entity.asTransaction(
        function()
        {
          var             pendingAuthLocalObj;
          var             pendingAuthLocalData;
          var             authLocalObj;
          var             authLocalData;
          
          // Find the secret among the PendingAuthLocal objects
          pendingAuthLocalObj = new playground.dbif.ObjPendingAuthLocal(secret);
          
          // Did we find it?
          if (pendingAuthLocalObj.getBrandNew())
          {
            // Nope. Let 'em know it didn't exist. (It's probably expired.)
            return 1;
          }
          
          // Get the pending auth data
          pendingAuthLocalData = pendingAuthLocalObj.getData();

          // Get or create the AuthLocal object for this user. If the object
          // already exists, this serves to change the password or display
          // name values.
          authLocalObj = 
            new playground.dbif.ObjAuthLocal(pendingAuthLocalData.username);
          
          // Get its data object
          authLocalData = authLocalObj.getData();
          
          // Initialize auth data
          authLocalData.passwordHash = pendingAuthLocalData.passwordHash;
          authLocalData.displayName = pendingAuthLocalData.displayName;
          
          // Misuse the email field (since username contains their email) to
          // hold the timestamp at which they requested this account. We'll
          // then be able to remove temporary accounts if we want to.
          authLocalData.email = pendingAuthLocalData.timestamp;
          
          // Save the data
          authLocalObj.put();

          // Remove the pendingAuthLocal object
          pendingAuthLocalObj.removeSelf();

          return 0;
        }.bind(this));      
    }
  }
});
