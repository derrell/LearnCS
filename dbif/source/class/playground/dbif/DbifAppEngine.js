/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.DbifAppEngine",
{
  extend  : liberated.appengine.Dbif,
  type    : "singleton",

  include : 
  [
    playground.dbif.MDbifCommon
  ],
  
  construct : function()
  {
    // Call the superclass constructor
    this.base(arguments);
    
    // Prepare for remote procedure calls
    this.__rpc = new liberated.appengine.Rpc("/rpc");
  },
  
  members :
  {
    /**
     * Register a service name and function.
     *
     * @param serviceName {String}
     *   The name of this service within the <[rpcKey]> namespace.
     *
     * @param fService {Function}
     *   The function which implements the given service name.
     * 
     * @param paramNames {Array}
     *   The names of the formal parameters, in order.
     */
    registerService : function(serviceName, fService, paramNames)
    {
      // Register with the RPC provider
      this.__rpc.registerService(serviceName, fService, this, paramNames);
    },

    /**
     * Process an incoming request which is presumably a JSON-RPC request.
     * 
     * @param jsonData {String}
     *   The data provide in a POST request
     * 
     * @return {String}
     *   Upon success, the JSON-encoded result of the RPC request is returned.
     *   Otherwise, null is returned.
     */
    processRequest : function(jsonData)
    {
      return this.__rpc.processRequest(jsonData);
    },

    /**
     * Identify the current user. Register him in the whoAmI property.
     */
    identify : function()
    {
      var             UserServiceFactory;
      var             userService;
      var             user;
      var             whoami;
      var             displayName;
      var             visitor;
      var             googleUserId;
      var             googleNickname;

      // Find out who is logged in
      UserServiceFactory =
        Packages.com.google.appengine.api.users.UserServiceFactory;
      userService = UserServiceFactory.getUserService();
      user = userService.getCurrentUser();
      
      // If no one is logged in...
      if (! user)
      {
        this.setWhoAmI(
          {
            user              : "anonymous",
            displayName       : "",
            isAdmin           : false
          });
        return;
      }

      // Determine details about the logged-in user
      whoami = String(user.getEmail());
      googleNickname = String(user.getNickname());
      googleUserId = String(user.getUserId());

      // Get this user's display name. Does the visitor exist?
      displayName = googleNickname || googleUserId;

      // Save the logged-in user. The whoAmI property is in MDbifCommon.
      this.setWhoAmI(
        {
          user              : whoami,
          displayName       : displayName,
          isAdmin           : userService.isUserAdmin()
        });
      
      // Provide the logout URL
      this.setLogoutUrl(String(userService.createLogoutURL("/")));
    }
  },

  defer : function()
  {
    // Register our database driver functions and features
    liberated.dbif.Entity.registerDatabaseProvider(
      liberated.appengine.Dbif.query,
      liberated.appengine.Dbif.put,
      liberated.appengine.Dbif.remove,
      liberated.appengine.Dbif.getBlob,
      liberated.appengine.Dbif.putBlob,
      liberated.appengine.Dbif.removeBlob,
      liberated.appengine.Dbif.beginTransaction,
      { 
        dbif        : "appengine",
        initRootKey : liberated.appengine.Dbif.initRootKey
      });
  }
});
