/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * Login application, which allows for source code editing and live
 * previews of a simple custom application.
 * 
 * @asset(qx/icon/${qx.icontheme}/*)
 */
qx.Class.define("login.Application",
{
  extend : qx.application.Standalone,

  members :
  {
    // UI Components
    __header            : null,
    __pageLogin         : null,
    __pageNewUser       : null,
    __pagePasswordReset : null,

    /**
     * This method contains the initial application code and gets called
     * during startup of the application.
     *
     * @ignore(qxc)
     */
    main : function()
    {
      var             mainContainer;
      
      // Call super class
      this.base(arguments);

      // register error handler
      qx.event.GlobalError.setErrorHandler(this.__onGlobalError, this);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        var             appender;
        appender = qx.log.appender.Native;
        appender = qx.log.appender.Console;
      }

      // main container
      mainContainer = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      this.getRoot().add(mainContainer, { edge : 0 });

      // header
      this.__header = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      this.__header.setAppearance("app-header");
      this.__header.add(new qx.ui.basic.Label("LearnCS!"));
      mainContainer.add(this.__header);

      //
      // blank space beneath header
      //
      mainContainer.add(new qx.ui.core.Spacer(0, 20));

      // add the login page
      this.__pageLogin = 
        new qx.ui.container.Composite(new qx.ui.layout.VBox(20));
      mainContainer.add(this.__pageLogin, { flex : 1 });
      this._addLoginPage(this.__pageLogin);

      this.__pageNewUser = 
        new qx.ui.container.Composite(new qx.ui.layout.VBox(20));
      mainContainer.add(this.__pageNewUser, { flex : 1 });
      this._addNewUserPage(this.__pageNewUser);
    },
    
    /**
     * Add the login page
     * 
     * @param pageLogin {qx.ui.container.Composite}
     *   The container for this page's widgets
     */
    _addLoginPage : function(page)
    {
      var             o;
      var             hBox;
      var             username;
      var             password;
      var             form;
      var             renderer;
      var             butLogin;

      // create the form
      form = new qx.ui.form.Form();

      // add the first headline
      form.addGroupHeader("Login");

      // add usernamne
      username = new qx.ui.form.TextField();
      form.add(username, "User name");
      
      // add password
      password = new qx.ui.form.PasswordField();
      form.add(password, "Password");

      // create the renderer
      renderer = new qx.ui.form.renderer.Single(form);
      
      // Get the renderer's first item, the header, and center it
      o = renderer._getChildren()[0];
      o.setAlignX("center");
      o.setHeight(30);

      // create an hbox to center the form
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      page.add(hBox);

      // create the form and add it, centered
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      hBox.add(renderer);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

      // create an hbox to center the login-in button
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      page.add(hBox);

      // create the log-in button and add it, centered
      butLogin = new qx.ui.form.Button("Log in");
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      hBox.add(butLogin);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

      butLogin.addListener(
        "execute",
        function()
        {
          var             request;

          console.log("username=" + username.getValue() +
                      ", password=" + password.getValue());
          request = new qx.io.remote.Request("/trylogin", "POST");
          request.setParameter("username", username.getValue(), true);
          request.setParameter("password", password.getValue(), true);
          
          request.addListener(
            "completed",
            function(e)
            {
              // Redirect to playground. We'll get back here if auth failed.
              window.location = "/";
            });

          request.addListener(
            "failed",
            function(e)
            {
              // Something failed. Try again.
              window.location = "/login";
            });

          request.addListener(
            "timeout",
            function(e)
            {
              window.location = "/login";
            });

          request.send();
        }, 
        this);

      // create an hbox to center the first set of instructions
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      page.add(hBox);

      // create the instructions and add it, centered
      o = new qx.ui.basic.Label(
        "<span style='font-weight: bold;'>UMass Lowell users:</span> " +
        "use your cs.uml.edu username and password." +
        "<br />" +
        "<span style='font-weight: bold;'>Outside users:</span> " +
        "use your registered email address and password.");
      o.setRich(true);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      hBox.add(o);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
    },
    
    /**
     * Add the create new user page 
     * 
     * @param pageNewUser {qx.ui.container.Composite}
     *   The container for this page's widgets
     */
    _addNewUserPage : function(page)
    {
      var             o;
      var             hBox;
      var             email;
      var             password;
      var             passwordRepeat;
      var             displayName;
      var             form;
      var             renderer;
      var             manager;
      var             butCreateUser;

      // create the form
      form = new qx.ui.form.Form();

      // add the first headline
      form.addGroupHeader("Create new, temporary account");

      // add name
      displayName = new qx.ui.form.TextField();
      displayName.setRequired(true);
      form.add(displayName, "Your name");
      
      // add email
      email = new qx.ui.form.TextField();
      email.setRequired(true);
      form.add(email, "Email");
      
      // add password
      password = new qx.ui.form.PasswordField();
      password.setRequired(true);
      form.add(password, "New account password");

      // add password repeat
      passwordRepeat = new qx.ui.form.PasswordField();
      passwordRepeat.setRequired(true);
      form.add(passwordRepeat, "Repeat new password");

      // create the renderer
      renderer = new qx.ui.form.renderer.Single(form);
      
      // Get the renderer's first item, the header, and center it
      o = renderer._getChildren()[0];
      o.setAlignX("center");
      o.setHeight(30);

      // create an hbox to center the form
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      page.add(hBox);

      // create the form and add it, centered
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      hBox.add(renderer);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

      // create an hbox to center the login-in button
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      page.add(hBox);

      // create the log-in button and add it, centered
      butCreateUser = new qx.ui.form.Button("Create Account");
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      hBox.add(butCreateUser);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

      butCreateUser.addListener(
        "execute",
        function()
        {
          butCreateUser.setEnabled(false);
          butCreateUser.setLabel("Validating...");
          manager.validate();
        }, 
        this);

      // create the form manager
      manager = new qx.ui.form.validation.Manager();

      // create a validator function for the password length
      var passwordLengthValidator = function(value, item) 
      {
        var             valid;
          
        valid = value != null && value.length >= 6;
        if (!valid) 
        {
          item.setInvalidMessage(
            "Passwords must be at least 6 characters long.");
        }
        
        return valid;
      };

      // create an async validator function to ensure the account doesn't exist
      var emailValidator = new qx.ui.form.validation.AsyncValidator(
        function(validator, value) 
        {
          var             bStillValid = true;

          // First, ensure that it's a valid email address. 
          try
          {
            qx.util.Validate.checkEmail(value, validator);
          }
          catch(e)
          {
            validator.setValid(false);
            bStillValid = false;
          }

          // If it's a valid email address...
          if (bStillValid)
          {
            // ... then verify that the account doesn't already exist

            // use a timeout instead of a server request (async)
            window.setTimeout(
              function() 
              {
                if (value.substr(-4) == ".com") 
                {
                  validator.setValid(false, "Server said no!");
                }
                else
                {
                  validator.setValid(true);
                }
              }, 
              3000);
          }
        }
      );

      // add the email with a predefined email validator
      manager.add(email, qx.util.Validate.email());

      // add the email with the async validator too
      manager.add(email, emailValidator);

      // add the password fields with the notEmpty validator
      manager.add(password, passwordLengthValidator);
      manager.add(passwordRepeat, passwordLengthValidator);

      // add a validator to the manager itself (passwords must be equal)
      manager.setValidator(
        function(items) 
        {
          var             valid;
          var             message;

          valid = password.getValue() == passwordRepeat.getValue();
          if (!valid) 
          {
            message = "Passwords do not match.";
            password.setInvalidMessage(message);
            passwordRepeat.setInvalidMessage(message);
            password.setValid(false);
            passwordRepeat.setValid(false);
          }
          
          return valid;
        });

      manager.addListener(
        "complete",
        function()
        {
          butCreateUser.setEnabled(true);
          butCreateUser.setLabel("Create Account");
        });

/*
      // create an hbox to center the first set of instructions
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      page.add(hBox);

      // create the instructions and add it, centered
      o = new qx.ui.basic.Label(
        "<span style='font-weight: bold;'>UMass Lowell users:</span> " +
        "use your cs.uml.edu username and password." +
        "<br />" +
        "<span style='font-weight: bold;'>Outside users:</span> " +
        "use your registered email address and password.");
      o.setRich(true);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      hBox.add(o);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
*/

/*
      // Issue a request to rename the program
      login.ServerOp.rpc(
        // success handler
        function(result, id)
        {
          if (result.status === 0)
          {
            this.setName(result.name);
            this._displayDirectoryListing(result.dirList);
          }
          else
          {
            alert(this.tr("Could not rename file. ") +
                  this.tr("Maybe the name you requested already exists?"));
          }
        }.bind(this),

        // failure handler
        function(ex, id)
        {
          // Ignore the failure. Should not ever occur.
          console.log("FAILED to rename file " + oldName +
                      " to " + newName + ": " + ex);
        }.bind(this),

        // function to call
        "renameProgram",
        
        // arguments
        [
          oldName,
          newName,
          this.editor.getCode()
        ]
      );
*/
    }
  }
});
