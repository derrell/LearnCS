/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.dbif.DbifSim",
{
  extend  : liberated.sim.Dbif,
  type    : "singleton",

  include : 
  [
    playground.dbif.MDbifCommon,
    playground.dbif.MSimData
  ],
  
  construct : function()
  {
    // Call the superclass constructor
    this.base(arguments);
    
    // Prepare for remote procedure calls to
    this.__rpc = new liberated.sim.Rpc("/rpc");
        
    // Save the logged-in user. The whoAmI property is in MDbifCommon.
    this.setWhoAmI(
      {
        user              : "jarjar@binks.org",
        displayName       : "obnoxious",
        isAdmin           : true
      });
      
      // Provide the logout URL
//      this.setLogoutUrl("javascript:alert(\"logout clicked\");");
      this.setLogoutUrl("javascript:playground.dbif.DbifSim.changeWhoAmI();");
  },
  
  statics :
  {
    changeWhoAmI : function(context)
    {
      var formData =  
      {
        'user'   : 
        {
          'type'  : "ComboBox", 
          'label' : "Login",
          'value' : null,
          'options' : [ ]
        },
        'isAdmin'   : 
        {
          'type'  : "SelectBox", 
          'label' : "User type",
          'value' : null,
          'options' : 
          [
            { 'label' : "Normal",        'value' : false }, 
            { 'label' : "Administrator", 'value' : true  }
          ]
        }
      };
      
      // Retrieve all of the user records
      liberated.dbif.Entity.query("playground.dbif.ObjUser").forEach(
        function(user, i)
        {
          // Add this user to the list
          formData.user.options.push(
            {
              label : user.user
            });
        });

      dialog.Dialog.form(
        "You have been logged out. Please log in.",
        formData,
        function(result)
        {
          var             userObj;
          var             userData;
          var             displayName;
          var             guiWhoAmI;
          var             backendWhoAmI;

          // Try to get this user's ID. Does the user exist?
          userData = liberated.dbif.Entity.query("playground.dbif.ObjUser",
                                                 {
                                                   "type" : "element",
                                                   "field" : "user",
                                                   "value" : result.user
                                                 });
          
          // Did we find it?
          if (userData.length > 0)
          {
            // Yup. There will be only one object. Get it.
            userData = userData[0];
          }
          else
          {
            // User didn't exist. Creat him.
            userObj = new playground.dbif.ObjUser();
            userData = userObj.getData();
            userData.user = result.user;
            userObj.put();
          }

          // Allow quick access to the backend whoAmI, logoutUrl, and userId
          backendWhoAmI = playground.dbif.DbifSim.getInstance();
            
          // Save the backend whoAmI information
          backendWhoAmI.setWhoAmI(
          {
            user              : userData.user,
            isAdmin           : result.isAdmin
          });

          // Save the logout URL (this function)
          backendWhoAmI.setLogoutUrl(
            "javascript:playground.dbif.DbifSim.changeWhoAmI();");
          
          // Save the user id
          backendWhoAmI.setMyUserId(userData.id);
          
          // Update the gui too
          guiWhoAmI = qx.core.Init.getApplication().getUserData("whoAmI");
          guiWhoAmI.setIsAdmin(result.isAdmin);
          guiWhoAmI.setEmail(userData.user);
          guiWhoAmI.setLogoutUrl(
            "javascript:playground.dbif.DbifSim.changeWhoAmI();");
        }
      );
    }
  },

  members :
  {
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
    }
  },
  
  defer : function()
  {
    // Retrieve the database from Web Storage, if such exists.
    if (typeof window.localStorage !== "undefined")
    {
      if (typeof localStorage.simDB == "string")
      {
        qx.Bootstrap.debug("Reading DB from Web Storage");
        liberated.sim.Dbif.setDb(qx.lang.Json.parse(localStorage.simDB),
                                 localStorage.nextKey || 0);
      }
      else
      {
        // No database yet stored. Retrieve the database from the MSimData mixin
        qx.Bootstrap.debug("No database yet. Using new SIM database.");
        liberated.sim.Dbif.setDb(playground.dbif.MSimData.Db, 0);
      }
    }
    else
    {
      // Retrieve the database from the MSimData mixin
      qx.Bootstrap.debug("No Web Storage available. Using new SIM database.");
      liberated.sim.Dbif.setDb(playground.dbif.MSimData.Db, 0);
    }
    
    // Register our put & query functions
    liberated.dbif.Entity.registerDatabaseProvider(
      liberated.sim.Dbif.query,
      liberated.sim.Dbif.put,
      liberated.sim.Dbif.remove,
      liberated.sim.Dbif.getBlob,
      liberated.sim.Dbif.putBlob,
      liberated.sim.Dbif.removeBlob,
      liberated.sim.Dbif.beginTransaction,
      { 
        dbif        : "sim"
      });
  }
});
