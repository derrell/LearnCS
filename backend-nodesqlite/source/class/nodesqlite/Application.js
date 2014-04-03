/**
 * Copyright (c) 2011 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

qx.Class.define("nodesqlite.Application",
{
  extend : qx.application.Basic,

  statics :
  {
    /** The database (and remote procedure call) interface instance */
    dbif : null,

    /**
     * Process a POST request. These are the standard GUI-initiated remote
     * procedure calls.
     *
     * @param request {Object}
     *   The object containing the request parameters.
     *
     * @param response {Object}
     *   The object to be used for returning the response.
     *
     * @ignore(require)
     */
    doPost : function(request, response)
    {
      var             sync = require("synchronize");
      
      // Run this request in a fiber, to allow for synchronous calls
      sync.fiber(
        function()
        {
          var             dbif=  new playground.dbif.DbifNodeSqlite();
          var             rpcResult;

          // Determine the logged-in user
          dbif.identify(request);

          // Process this request
          rpcResult = dbif.processRequest(request.body);

          // Ignore null results, which occur if the request is a notification.
          if (rpcResult !== null)
          {
            // Generate the response.
            response.set("Content-Type", "application/json");
            response.send(rpcResult);
          }
        });
    },


    /**
     * Process a GET request.
     *
     * @param request {Object}
     *   The object containing the request parameters.
     *
     * @param response {Object}
     *   The object to be used for returning the response.
     *
     * @ignore(require)
     */
    doGet : function(request, response)
    {
      var             sync = require("synchronize");
      
      // Run this request in a fiber, to allow for synchronous calls
      sync.fiber(
        function()
        {
          var             dbif=  new playground.dbif.DbifNodeSqlite();
          var             rpcResult;

          // Determine the logged-in user
          dbif.identify(request);

          // Process this request
          rpcResult = dbif.processRequest(request.query);

          // Ignore null results, which occur if the request is a notification.
          if (rpcResult !== null)
          {
            // Generate the response.
            response.set("Content-Type", "application/json");
            response.send(rpcResult);
          }
        });
    }
  },

  members :
  {
    /**
     * This method contains the initial application code and gets called 
     * during startup of the application
     *
     * @ignore(require)
     * @ignore(process)
     * @ignore(process.argv)
     * @ignore(process.argv.length)
     * @ignore(__dirname)
     */
    main : function()
    {
      var             i;
      var             _this = this;
      var             server;
      var             rpcHandler;
      var             resourceHandler;
      var             fs = require("fs");
      var             http = require("http");
      var             https = require("https");
      var             logger = require("morgan");
      var             express = require("express");
      var             passport = require("passport");
      var             cookieParser = require("cookie-parser");
      var             cookieSession = require("cookie-session");
      var             LocalStrategy = require("passport-local").Strategy;
      var             LdapStrategy = require("passport-ldapauth").Strategy;
      var             app = express();
      var             strategies = [ "local" ];
      var             ldapConfig;
      var             credentials;
      var             credentialFiles;
      var             httpServer;
      var             httpsServer;
      var             httpPort = 80;
      var             httpsPort = 443;
      var             users;
      
      if (qx.core.Environment.get("runtime.name") == "node.js") 
      {
        qx.log.Logger.register(qx.log.appender.NodeConsole);
      }

      // Retrieve port specification arguments
      if (process.argv) 
      {
        try 
        {
          for (i = 2; i < process.argv.length; i++)
          {
            if (process.argv[i].match(/^http\.port=/))
            {
              httpPort = process.argv[i].split("=", 2)[1];
            }
            else if (process.argv[i].match(/^https\.port=/))
            {
              httpsPort = process.argv[i].split("=", 2)[1];
            }
          }
        }
        catch(ex) 
        {
          this.error(ex.toString());
          return;
        }
      }

      //
      // Generic configuration
      //
      app.use(logger("short"));
      app.use(cookieParser());
      app.use(cookieSession(
                {
                  secret : "my secret test program",
                  cookie : 
                  {
                    maxAge : 1000 * 60 * 60 * 24 * 7 // one week idle time
                  }
                }));
      app.use(passport.initialize());
      app.use(passport.session());

      //
      // Prepare for authentication
      //

      // Function to obtain the user id for an authenticated user
      function getUserId(user)
      {
        var             userInfo;
        var             userObj;

        // See if this user is already registered
        userInfo = liberated.dbif.Entity.query(
          "playground.dbif.ObjUser",
          {
            type  : "element",
            field : "user",
            value : user
          });

        // If not...
        if (userInfo.length === 0)
        {
          // ... then create the user object
          userObj = new playground.dbif.ObjUser();

          // Get the object's data
          userInfo = userObj.getData();

          // Assign the user name
          userInfo.user = user;

          // Write it back to the database
          userObj.put();

          // Retrieve the ID of the just-written entity
          userInfo = liberated.dbif.Entity.query(
            "playground.dbif.ObjUser",
            {
              type  : "element",
              field : "user",
              value : user
            })[0];
        }
        else
        {
          // User is already registered. Get the one and only query result.
          userInfo = userInfo[0];
        }

        return userInfo.id;
      }


      // Our user list is hard-coded, here
      users =
          [
            {
              name        : "joe",
              password    : "joe",
              displayName : "Joe Blow",
              email       : "joe@blow.com"
            },
            {
              name        : "mary",
              password    : "mary",
              displayName : "Mary Contrary",
              email       : "mary@elsewhere.org"
            },
            {
              name        : "mpenta",
              password    : "ecg rules!",
              displayName : "Michael Penta",
              email       : "mpenta@cs.uml.edu"
            },
            {
              name        : "necc-1",
              password    : "naruto",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-2",
              password    : "batman",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-3",
              password    : "felix",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-4",
              password    : "tom+jerry",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-5",
              password    : "bullwinkle",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-6",
              password    : "gigantor",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-7",
              password    : "brady bunch",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-8",
              password    : "squad 51",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-9",
              password    : "dragnet",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-10",
              password    : "bugs bunny",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-11",
              password    : "elmer fudd",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-12",
              password    : "scooby-doo",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-13",
              password    : "fred flintstone",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-14",
              password    : "road runner",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-15",
              password    : "the jetsons",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-16",
              password    : "charlie brown",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-17",
              password    : "banana splits",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-18",
              password    : "pink panther",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-19",
              password    : "underdog",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-20",
              password    : "speed racer",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-21",
              password    : "gumby",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-22",
              password    : "woody woodpecker",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-23",
              password    : "spider-man",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-24",
              password    : "jonny quest",
              displayName : "NECC (Penta)",
              email       : ""
            },
            {
              name        : "necc-25",
              password    : "wile e. coyote",
              displayName : "NECC (Penta)",
              email       : ""
            }
        ];

      // Use the hard-coded user list to search for a provided user/password
      passport.use(
        new LocalStrategy(
          {
            usernameField : "username",
            passwordField : "password"
          },
          function(username, password, done)
          {
            var             sync = require("synchronize");

            sync.fiber(
              function()
              {
                var             i;
                var             userInfo;

                console.log("Attempting local authorization for " +
                            username + "...");

                // See if the user name is found
                for (i = 0; i < users.length; i++)
                {
                  if (users[i].name == username &&
                      users[i].password == password)
                  {
                    userInfo =
                      {
                        id          : getUserId(users[i].name),
                        displayName : users[i].displayName,
                        email       : users[i].email,
                        name        : users[i].name
                      };

                    console.log("Local authenticated user " + userInfo.name +
                                " (" + userInfo.displayName + 
                                ", " + userInfo.email + ")" +
                                ", id " + userInfo.id);
                    return done(null, userInfo);
                  }
                }

                // User was not found
                console.log("Local authentication of user " + 
                            username + " failed");
                return done(null, false, { message : "Login failed" } );
              });
          }));

      // See if we find LDAP configuration
      try
      {
        ldapConfig = fs.readFileSync("../ldapconfig.json");
        ldapConfig = JSON.parse(ldapConfig);
        
        // Authenticate against the LDAP server
        passport.use(
          new LdapStrategy(
            {
              server : ldapConfig
            },
            function(user, done)
            {
              var             sync = require("synchronize");

              sync.fiber(
                function()
                {
                  var             userInfo;

                  userInfo =
                    {
                      id          : getUserId(user.uid),
                      displayName : user.cn,
                      email       : user.mail,
                      name        : user.uid
                    };

                  console.log("LDAP authenticated user " + userInfo.name +
                                " (" + userInfo.displayName + 
                                ", " + userInfo.email + ")" +
                              ", id " + userInfo.id);
                  return done(null, userInfo);
                });
            }));
        
        // add ldap authentication to the list of stragies to try
        strategies.push("ldapauth");
        
        // Finally, add the certificate authority certificate.
        if (ldapConfig.tlsOptions && ldapConfig.tlsOptions.ca)
        {
          ldapConfig.tlsOptions.ca.push(
            fs.readFileSync("../../private/uml.cs-ldap-cert.pem"));
        }
      }
      catch(e)
      {
        // nothing to do. we simply won't use ldap.
        console.log("LDAP not being used. " + e);
      }


      // Serialize the user information so it can be stored in the session
      //
      // Note: If isAdmin is added, do not serialize it if using cookie
      // sessions, as it would be possible for an attacker to change it to
      // true.
      passport.serializeUser(
        function(user, done)
        {
          var             userInfo;
          
          userInfo =
            {
              id          : user.id,
              name        : user.name,
              displayName : user.displayName,
              email       : user.email
            };
          
          done(null, JSON.stringify(userInfo));
        });
      
      // Deserialize the JSON-encoded user back into its user object
      passport.deserializeUser(
        function(encoded, done)
        {
          done(null, JSON.parse(encoded));
        });



      //
      // Redirect any http request to https
      //
      
      // Create a redirecting middleware function
      function requireHTTPS(req, res, next)
      {
        var             redirectTo;

        if (! req.secure)
        {
          redirectTo = "https://" + req.host + ":8443/" + req.url;
          return res.redirect(redirectTo);
        }
        
        next();
        return undefined;
      }
      
      // Call our redirecting middleware function before any others
      if (httpsPort != 0)
      {
//        app.use(requireHTTPS);
      }

      //
      // Arrange to receive raw data
      //
      app.use(
        function(req, res, next) 
        {
          var data = [];

          req.setEncoding("utf8");

          req.on(
            "data",
            function(chunk) 
            { 
              data.push(chunk);
            });

          req.on(
            "end",
            function() 
            {
              req.body = data.join("");
              next();
            });
        });


      //
      // Remote Procedure Call handler
      //
      
      // Handle a POST request for an RPC
      app.post(
        "/rpc",
        function(req, res)
        {
          var             f;

          // Bind the functions to our application instance to allow them to
          // easily generate log messages.
          f = nodesqlite.Application.doPost.bind(_this);
          
          // Call the bound founction
          f(req, res);
        });

      // Handle a GET request for an RPC
      app.get(
        "/rpc",
        function(req, res)
        {
          var             f;

          // Bind the functions to our application instance to allow them to
          // easily generate log messages.
          f = nodesqlite.Application.doGet.bind(_this);
          
          // Call the bound founction
          f(req, res);
        });
      

      //
      // Login page
      //

      // Display login page upon GET
      app.get(
        "/login", 
        function(req, res, next)
        {
          res.sendfile(__dirname + "/login/index.html");
        });

      // Authenticate, upon POST
      app.post(
        "/login",
        function(req, res, next)
        {
          // We're not using bodyParser due to some internal problem. Instead,
          // parse the url-encoded body ourself, here.
          var qs = require("qs");
          req.body = qs.parse(req.body);

          // Authenticate
          passport.authenticate(
            strategies,
            {
              failureRedirect: "/login",
              failureFlash: false
            })(req, res, next);
        },
        function(req, res) 
        {
          res.redirect("/");
        });

      // Log out
      app.get(
        "/logout",
        function(req, res)
        {
          req.logout();
          res.redirect("/login");
        });


      //
      // Static File Handler
      //

      // Function to confirm that the user is authenticated
      function ensureAuthenticated(req, res, next)
      {
        if (req.isAuthenticated())
        {
          next();
          return;
        }
        
        res.redirect('/login');
      }

      // For static files, ensure the user is authenticated
      app.use(ensureAuthenticated);

      // Get files opened via stdio functions from a special directory
      app.use("/stdio_files", express["static"](__dirname + "/stdio_files"));

      // Get other static files from our build directory, for now
      app.use(express["static"](__dirname + "/frontend"));
      
      
      //
      // HTTPS server
      //
      
      // Begin listening now
      console.log("");
      if (httpPort == 0)
      {
        console.log("NOT starting HTTP server");
      }
      else
      {
        console.log("Starting HTTP server on port " + httpPort);
        
        // Create HTTP server
        httpServer = http.createServer(app);
        
        // Begin listening
        httpServer.listen(httpPort);
      }
      
      if (httpsPort == 0)
      {
        console.log("NOT starting HTTPS server");
      }
      else
      {
        console.log("Starting HTTPS server on port " + httpsPort);

        if (false)
        {
          // Set up the credential file names
          credentialFiles =
            {
              key  : "../../private/self-signed/server.key",
              cert : "../../private/self-signed/server.crt",
              ca   : "../../private/self-signed/ca.crt"
            };

          // Set up credentials
          credentials =
            {
              key                : fs.readFileSync(credentialFiles.key, "utf8"),
              cert               : fs.readFileSync(credentialFiles.cert, "utf8"),
              ca                 : fs.readFileSync(credentialFiles.ca, "utf8"),
              //            requestCert        : true,
              passphrase         : "mypass",
              rejectUnauthorized : false
            };
        }
        else
        {
          // Set up the credential file names
          credentialFiles =
            {
              key  : "../../private/learn.key",
              cert : "../../private/learn_cs_uml_edu_cert.cer"
//              ca   : "../../private/incommonserverca.cer"
            };

          // Set up credentials
          credentials =
            {
              key                : fs.readFileSync(credentialFiles.key, "utf8"),
              cert               : fs.readFileSync(credentialFiles.cert, "utf8"),
//              ca                 : fs.readFileSync(credentialFiles.ca, "utf8"),
//            requestCert        : true,
//            passphrase         : "mypass",
              rejectUnauthorized : false
            };
        }

        // Create HTTPS servers
        httpsServer = https.createServer(credentials, app);

        // Begin listening
        httpsServer.listen(httpsPort);
      }
      console.log("");
    }
  }
});
