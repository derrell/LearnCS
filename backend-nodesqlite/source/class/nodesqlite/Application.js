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
      var             express = require("express");
      var             passport = require("passport");
      var             LocalStrategy = require("passport-local").Strategy;
      var             app = express();
      var             credentials;
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
      app.configure(
        function()
        {
          app.use(express.logger());
          app.use(express.cookieParser());
          app.use(express.cookieSession(
                    {
                      secret : "my secret test program",
                      cookie : 
                      {
                        maxAge : 60 * 60 * 1000
                      }
                    }));
          app.use(passport.initialize());
          app.use(passport.session());
        });

      //
      // Prepare for authentication
      //

      // Our user list is hard-coded, here
      users =
          [
            {
              id       : 80,
              name     : "joe",
              password : "joe"
            },
            {
              id       : 443,
              name     : "mary",
              password : "mary"
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
            var             i;

            console.log("Authenticating " + username);

            // See if the user name is found
            for (i = 0; i < users.length; i++)
            {
              if (users[i].name == username && users[i].password == password)
              {
                return done(null, users[i]);
              }
            }
            
            // User was not found
            return done(null, false, { message : "Login failed" } );
          }));

      // Serialize the user information so it can be stored in the session
      //
      // Note: If isAdmin is added, do not serialize it if using cookie
      // sessions, as it would be possible for an attacker to change it to
      // true.
      passport.serializeUser(
        function(user, done)
        {
          done(null, JSON.stringify({
                                      id      : user.id,
                                      name    : user.name
                                    }));
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
//      app.use(requireHTTPS);

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
            "local",
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

      // Get static files from our build directory, for now
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

        // Set up credentials
        credentials =
          {
            key                : fs.readFileSync("server.pem", "utf8"),
            cert               : fs.readFileSync("server.pem", "utf8"),
//            ca                 : fs.readFileSync("ca.crt", "utf8"),
            requestCert        : true,
            passphrase         : "xxxx",
            rejectUnauthorized : false
          };

        // Create HTTPS servers
        httpsServer = https.createServer(credentials, app);

        // Begin listening
        httpsServer.listen(httpsPort);
      }
      console.log("");
    }
  }
});
