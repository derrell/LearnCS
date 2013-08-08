/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de
     2013 Derrell Lipman

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)
     * Derrell Lipman (derrell)

************************************************************************ */
/**
 * Application header widget.
 */
qx.Class.define("playground.view.Header",
{
  extend : qx.ui.container.Composite,

  /**
   * @lint ignoreUndefined(qxc)
   */
  construct : function()
  {
    var             mycall;

    this.base(arguments, new qx.ui.layout.HBox());
    this.setAppearance("app-header");

    // Prepare to issue remote procedure calls
    this.__rpc = new qx.io.remote.Rpc();
    this.__rpc.setProtocol("2.0");
    this.__rpc.setUrl("/rpc");
    this.__rpc.setServiceName("learncs");

    // EVIL HACK
    this.addListener("appear", function() {
      var el = this.getContentElement();
      el.setStyle("top", (parseInt(el.getStyle("top")) + 1) + "px");
    }, this);
    // /////////

    var whoAmI = new playground.view.WhoAmI();
    whoAmI.set(
      {
        font : "default"
      });

    var version = 
      new qxc.ui.versionlabel.VersionLabel("Playground", "0.025");
    version.set(
      {
        font : "default",
        rich : true
      });
    
    var consoleButton = new qx.ui.form.RadioButton(this.tr("Console Mode"));
    consoleButton.set({
      model: "ria",
      appearance: "modeButton"
    });

/*
    var mobileButton = new qx.ui.form.RadioButton(this.tr("Phone App"));
    mobileButton.set({
      model: "mobile",
      appearance: "modeButton"
    });
*/

    this.__buttons = [consoleButton];

    this.__group = new qx.ui.form.RadioGroup(consoleButton);

    this.__group.bind("modelSelection[0]", this, "mode");

    this.add(new qx.ui.basic.Label("LearnCS!"));
    this.add(new qx.ui.core.Spacer(40));
    
    this.add(consoleButton);
//    this.add(mobileButton);
    
    this.add(new qx.ui.core.Spacer(), { flex : 1 });
    this.add(whoAmI);

    this.add(new qx.ui.core.Spacer(), { flex : 1 });
    this.add(version);

    // When the page appears...
    this.addListener(
      "appear",
      function(e)
      {
        // If there's a request in progress...
        if (mycall)
        {
          // ... then abort it
          this.__rpc.abort(mycall);
        }

        // Issue an RPC to initialize ourself and get our whoAmI data
        mycall = this.__rpc.callAsync(
          function(result, ex, id) 
          {
            // This call is complete
            mycall = null;

            // Was there an exception?
            if (ex == null) 
            {
              // Nope. Display returned data.
              whoAmI.set(result.whoAmI);
              whoAmI.setLogoutUrl(result.logoutUrl);
            } 
            else
            {
              alert("Async(" + id + ") exception: " + ex);
            }
          }, 
          "userInit");
      },
      this);
  },


  properties : {
    /** The mode the header should be currently in. */
    mode : {
      event : "changeMode",
      check : "String",
      init : "ria",
      apply : "_applyMode"
    }
  },


  members : {
    __rpc : null,
    __buttons : null,
    __group : null,

    // property apply
    _applyMode : function(value) {
      if (this.__group.getModelSelection().getItem(0) != value) {
        this.__group.setModelSelection([value]);
      }
    },


    /**
     * Enables or disabled the button for the given mode.
     * @param mode {String} the mode to change the enabled state.
     * @param value {boolean} <code>true</true> if the button should be enabled.
     */
    setEnabledMode : function(mode, value) {
      for (var i=0; i < this.__buttons.length; i++) {
        if (this.__buttons[i].getModel() == mode) {
          var button = this.__buttons[i];
          break;
        }
      };

      var label = value ? this.tr("Mobile") : this.tr("Mobile (Webkit only)");
      button.setEnabled(value);
      button.setLabel(label);
    }
  }
});
