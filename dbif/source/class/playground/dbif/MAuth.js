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
//console.log("loc 1");
      return liberated.dbif.Entity.asTransaction(
        function()
        {
//console.log("loc 2");
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
//console.log("loc 3");
          shasum.update(password);
//console.log("loc 4");
          passwordHash = shasum.digest('hex');

          // Build a random secret
//console.log("loc 5");
          secret.push(username);
//console.log("loc 6");
          secret.push("/");
//console.log("loc 7");
          for (i = 0; i < 32; i++)
          {
            r = Math.floor(Math.random() * 63);
            secret.push(
              ("abcdefghijklmnopqrstuvwxyz" +
               "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
               "1234567890 ")[r]);
          }

          // Create a new Pending Auth Local object
//console.log("loc 8");
          pendingAuthLocalObj = 
            new playground.dbif.ObjPendingAuthLocal(secret.join(""));
          
          // Get the user data object
//console.log("loc 9");
          pendingAuthLocalData = pendingAuthLocalObj.getData(username);
          
          // Set the data
//console.log("loc 10");
          pendingAuthLocalData.username = username;
//console.log("loc 11");
          pendingAuthLocalData.passwordHash = passwordHash;
//console.log("loc 12");
          pendingAuthLocalData.displayName = displayName;
          
          // Save this new pending auth object
          pendingAuthLocalObj.put();
          
          // Send email
//console.log("loc 13");
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
//console.log("loc 14");
          if (! playground.dbif.MAuth.transporter)
          {
//console.log("loc 15");
            // Nope. Create one.
            (function()
             {
//console.log("loc 16");
               var             emailConfig;
               var             fs = require("fs");
               var             nodemailer = require("nodemailer");

               // Read the email configuration
//console.log("loc 17");
               emailConfig = fs.readFileSync("../emailconfig.json");
//console.log("loc 18");
               emailConfig = JSON.parse(emailConfig);

               // Create an email transport
//console.log("loc 19");
               playground.dbif.MAuth.transporter =
                 nodemailer.createTransport(emailConfig);
//console.log("loc 20");
             })();
          }

          // send mail with defined transport object
//console.log("loc 21");
          playground.dbif.MAuth.transporter.sendMail(
            mailOptions,
            function(error, info)
            {
//console.log("loc 22");
              if(error)
              {
//console.log("loc 23");
                console.log("Failed to send confirmation message to " +
                            username + ": " + error);
                
                // We couldn't send the email, so there's no reason to keep
                // the pendingAuthLocal object around any longer.
                // NOTE: This will happen outside of the transaction.
//console.log("loc 24");
                pendingAuthLocalObj.removeSelf();
//console.log("loc 25");
              }
              else
              {
//console.log("loc 26");
                console.log("Confirmation message sent to " + 
                            username + ": " + info.response);
//console.log("loc 27");
              }
          });

//console.log("loc 28");
          return 0;
        }.bind(this));
//console.log("loc 29");
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
console.log("loc 30");
      return liberated.dbif.Entity.asTransaction(
        function()
        {
console.log("loc 31");
          var             pendingAuthLocalObj;
          var             pendingAuthLocalData;
          var             authLocalObj;
          var             authLocalData;
          
          // Find the secret among the PendingAuthLocal objects
console.log("loc 32: secret=[" + secret + "]");
          pendingAuthLocalObj = new playground.dbif.ObjPendingAuthLocal(secret);
          
          // Did we find it?
console.log("loc 33");
          if (pendingAuthLocalObj.getBrandNew())
          {
            // Nope. Let 'em know it didn't exist. (It's probably expired.)
console.log("loc 35");
            return 1;
          }
          
          // Get the pending auth data
console.log("loc 36");
          pendingAuthLocalData = pendingAuthLocalObj.getData();

          // Get or create the AuthLocal object for this user. If the object
          // already exists, this serves to change the password or display
          // name values.
console.log("loc 37");
          authLocalObj = 
            new playground.dbif.ObjAuthLocal(pendingAuthLocalData.username);
          
          // Get its data object
console.log("loc 38");
          authLocalData = authLocalObj.getData();
          
          // Initialize auth data
console.log("loc 39");
          authLocalData.passwordHash = pendingAuthLocalData.passwordHash;
console.log("loc 40");
          authLocalData.displayName = pendingAuthLocalData.displayName;
          
          // Misuse the email field (since username contains their email) to
          // hold the timestamp at which they requested this account. We'll
          // then be able to remove temporary accounts if we want to.
console.log("loc 41");
          authLocalData.email = pendingAuthLocalData.timestamp;
          
          // Save the data
console.log("loc 42");
          authLocalObj.put();

          // Remove the pendingAuthLocal object
console.log("loc 43");
          pendingAuthLocalObj.removeSelf();

console.log("loc 44");
          return 0;
        }.bind(this));      
    }
  }
});
