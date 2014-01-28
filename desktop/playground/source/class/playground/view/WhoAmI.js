/**
 * Copyright (c) 2011, 2013 Derrell Lipman
 * 
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html 
 *   EPL : http://www.eclipse.org/org/documents/epl-v10.php
 */


/**
 * The container and children to implement the who's-logged-in line on the GUI
 */
qx.Class.define("playground.view.WhoAmI",
{
  extend  : qx.ui.core.Widget,

  construct : function()
  {
    var             layout;

    // Call the superclass constructor
    this.base(arguments);
    this.setAppearance("default");
    this.setPaddingTop(0);
    
    // Give ourself a layout
    layout = new qx.ui.layout.Grid();
    layout.setSpacingX(2);
    this._setLayout(layout);
    
    this.setUser("anonymous");
    this.setLogoutUrl("");
  },

  properties :
  {
    /** This user's id */
    id :
    {
      check : "String"
    },
    
    /** This user's user name */
    user :
    {
      check : "String",
      apply : "_applyUser"
    },
    
    /** The user's visible name (not currently displayed, though) */
    displayName :
    {
      check : "String"
    },

    /** Whether this user is an administrator */
    isAdmin :
    {
      check : "Boolean",
      apply : "_applyIsAdmin"
    },
    
    /** Whether this user has allowed research */
    researchOk :
    {
      check : "Boolean",
      apply : "_applyResearchOk"
    },

    /** The logout URL */
    logoutUrl :
    {
      check : "String",
      apply : "_applyLogoutUrl"
    }
  },

  members :
  {
    // apply function
    _applyUser : function(value, old)
    {
      var control = this.getChildControl("user");
      if (control) 
      {
        control.setValue(value);
      }
    },

    // apply function
    _applyIsAdmin : function(value, old)
    {
      var control = this.getChildControl("isAdmin");
      if (control) 
      {
        control.setValue(value ? "*" : "");
      }
    },

    // apply function
    _applyResearchOk : function(value, old)
    {
      var control = this.getChildControl("researchOk");
      if (control) 
      {
        control.setValue(value ? "." : "");
      }
    },

    // apply function
    _applyLogoutUrl : function(value, old)
    {
      var control = this.getChildControl("logoutUrl");
      if (control) 
      {
        control.setValue(
          "<a href='" + value + "' style='color:rgb(0,170,255);'>" +
          "Logout" +
          "</a>");
      }
    },

    // overridden
    _createChildControlImpl : function(id, hash)
    {
      var control;

      switch(id)
      {
      case "isAdmin" :
        control = new qx.ui.basic.Label();
        control.setAnonymous(true);
        this._add(control, { row : 0, column : 0 });
        break;

      case "user":
        control = new qx.ui.basic.Label(this.getUser() + "    ");
        control.setFont(new qx.bom.Font.fromString("sans-serif bold 20"));
        control.setAnonymous(true);
        this._add(control, { row : 0, column : 1 });
        break;

      case "logoutUrl":
        control = new qx.ui.basic.Label(this.getLogoutUrl());
        control.setRich(true);
        control.setAnonymous(true);
        this._add(control, { row : 0, column : 2 });
        break;

      case "researchOk" :
        control = new qx.ui.basic.Label();
        control.setAnonymous(true);
        this._add(control, { row : 0, column : 3 });
        break;
      }

      return control || this.base(arguments, id);
    }
  }
});
