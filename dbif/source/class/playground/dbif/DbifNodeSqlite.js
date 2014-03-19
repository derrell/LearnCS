/**
 * Copyright (c) 2014 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */

qx.Class.define("playground.dbif.DbifNodeSqlite",
{
  extend  : liberated.node.SqliteDbif,

  include : 
  [
    playground.dbif.MDbifCommon
  ],
  
  construct : function()
  {
    // Call the superclass constructor
    this.base(arguments);
    
    // Prepare for remote procedure calls
    this.__rpc = new liberated.node.Rpc("/rpc", this);
  },
  
  members :
  {
    /** The remote procedure call instance */
    __rpc : null,

    /**
     * Register a service name and function.
     *
     * @param serviceName {String}
     *   The fully-qualified name of this service
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
    

    /*
     * Identify the current user. 
     */
    identify : function(request)
    {
      var             user;
      var             bAdmin;

      // Provide the logout URL
      this.setLogoutUrl("/logout");
      
      // Find out who is logged in
      user = request.user;
      console.log("user=" + JSON.stringify(user));
      
      // If no one is logged in...
      if (! user)
      {
        this.setWhoAmI(null);
        return;
      }

      // Specify who we are
      this.setWhoAmI(
        {
          user              : user.name,
          userId            : user.id,
          isAdmin           : false
        });
    }
  },

  defer : function()
  {
    // Register the selected database interface entry points
    liberated.dbif.Entity.registerDatabaseProvider(
      liberated.node.SqliteDbif.query,
      liberated.node.SqliteDbif.put,
      liberated.node.SqliteDbif.remove,
      liberated.node.SqliteDbif.getBlob,
      liberated.node.SqliteDbif.putBlob,
      liberated.node.SqliteDbif.removeBlob,
      liberated.node.SqliteDbif.beginTransaction,
      { 
        dbif        : "nodesqlite"
      });
    
    // Register the system functions that will be used
    liberated.dbif.System.registerSystemProvider(liberated.node.System);

    // Initialize the database
    liberated.node.SqliteDbif.init("../learncs.db");
  }
});
