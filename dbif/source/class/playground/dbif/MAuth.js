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
    
    // Request a new user account
    this.registerService("learncs.requestNewUser", 
                         this.requestNewUser,
                         [ 
                           "username",
                           "password",
                           "displayName"
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
     * Begin creating a new AuthLocal user account. This adds the requested
     * credentials to AuthLocalPending, and sends email to the user. The
     * account is pending until they click on the link in the email, at which
     * time the completeNewUser RPC is initiated.
     *
     * @param protocol {String}
     *   The protocol on which the request was made (http or https)
     * 
     * @param hostname {String}
     *   The hostname to which the request was made
     * 
     * @param port {Number}
     *   The port to which the request was made
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
     */
    requestNewUser : function(protocol, hostname, port,
                              username, password, displayName)
    {
      return liberated.dbif.Entity.asTransaction(
        function()
        {
          var             i;
          var             r;
          var             pendingAuthLocalObj;
          var             pendingAuthLocalData;
          var             passwordHash;
          var             crypto = require('crypto');
          var             shasum = crypto.createHash('sha1');
          var             secret = [];
          var             now = new Date();

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
          
          // Send email
          var mailOptions = 
            {
              from    : "LearnCS! <noone@learn.cs.uml.edu>",
              to      : username,
              subject : "Your LearnCS! account",
              text    : ("Please confirm your LearnCS! new account request " +
                         "by visiting this link: " +
                         protocol + "://" + hostname + ":" + port +
                         "/confirmuser?" + 
                         "q=" + encodeURIComponent(secret.join("")))
            };

          // Do we have an email transport yet?
          if (! playground.dbif.MAuth.transporter)
          {
            // Nope. Create one.
            (function()
             {
               var             emailConfig;
               var             fs = require("fs");
               var             nodemailer = require("nodemailer");

               // Read the email configuration
               emailConfig = fs.readFileSync("../emailconfig.json");
               emailConfig = JSON.parse(emailConfig);

               // Create an email transport
               playground.dbif.MAuth.transporter =
                 nodemailer.createTransport(emailConfig);
             })();
          }

          // send mail with defined transport object
          playground.dbif.MAuth.transporter.sendMail(
            mailOptions,
            function(error, info)
            {
              if(error)
              {
                console.log("Failed to send confirmation message to " +
                            username + ": " + error);
                
                // We couldn't send the email, so there's no reason to keep
                // the pendingAuthLocal object around any longer.
                // NOTE: This will happen outside of the transaction.
                pendingAuthLocalObj.removeSelf();
              }
              else
              {
                console.log("Confirmation message sent to " + 
                            username + ": " + info.response);
              }
          });

          return 0;
        }.bind(this));
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
