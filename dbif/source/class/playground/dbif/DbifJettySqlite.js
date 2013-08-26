/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.DbifJettySqlite",
{
  extend  : liberated.jetty.SqliteDbif,
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
    this.__rpc = new liberated.jetty.Rpc("/rpc");
  },
  
  members :
  {
    /** The remote procedure call instance */
    __rpc : null,

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
    identify : function(request)
    {
      var             principal;
      var             user;
      var             bAdmin;
      
      // Find out who is logged in
      principal = request.getUserPrincipal();
      user = String(principal.getName());
      
      // If no one is logged in...
      if (! user)
      {
        this.setWhoAmI(
          {
            user         : "anonymous",
            displayName  : "",
            isAdmin      : false
          });
        return;
      }

      // Specify who we are
      this.setWhoAmI(
        {
          user        : user,
          displayName : "no name",
          isAdmin     : false
        });

      // Provide the logout URL
      this.setLogoutUrl("/login");
    }
  },

  defer : function()
  {
    // Register our database driver functions and features
    liberated.dbif.Entity.registerDatabaseProvider(
      liberated.jetty.SqliteDbif.query,
      liberated.jetty.SqliteDbif.put,
      liberated.jetty.SqliteDbif.remove,
      liberated.jetty.SqliteDbif.getBlob,
      liberated.jetty.SqliteDbif.putBlob,
      liberated.jetty.SqliteDbif.removeBlob,
      liberated.jetty.SqliteDbif.beginTransaction,
      { 
        dbif        : "jetty"
      });
    
    // Initialize the database
    liberated.jetty.SqliteDbif.init("./learncs.db");
  }
});
