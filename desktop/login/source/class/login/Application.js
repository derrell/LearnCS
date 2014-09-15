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
    __pages             : {},

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
      this.__pages["login"] = 
        new qx.ui.container.Composite(new qx.ui.layout.VBox(20));
      mainContainer.add(this.__pages["login"], { flex : 1 });
      this._addLoginPage(this.__pages["login"]);

      // Add the new account page
      this.__pages["new user"] = 
        new qx.ui.container.Composite(new qx.ui.layout.VBox(20));
      mainContainer.add(this.__pages["new user"], { flex : 1 });
      this._addNewUserPage(this.__pages["new user"]);
      
      // Add the new account instructions page
      this.__pages["new user instructions"] = 
        new qx.ui.container.Composite(new qx.ui.layout.VBox(20));
      mainContainer.add(this.__pages["new user instructions"], { flex : 1 });
      this._addNewUserInstructionsPage(this.__pages["new user instructions"]);
      
      //
      // blank space at the page bottom
      //
      mainContainer.add(new qx.ui.core.Spacer(0, 20));

  // Initially show the login page
      this.selectPage("login");
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
      var             vBox;
      var             username;
      var             password;
      var             form;
      var             renderer;
      var             butLogin;

      // create the form
      form = new qx.ui.form.Form();

      // add the first headline
      form.addGroupHeader(this.tr("Login"));

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
      butLogin = new qx.ui.form.Button(this.tr("Log in"));
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      hBox.add(butLogin);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

      butLogin.addListener(
        "execute",
        function()
        {
          var             request;

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
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      o = new qx.ui.basic.Label(
        this.tr(
          "<span style='font-weight: bold;'>UMass Lowell users:</span> " +
          "use your cs.uml.edu username and password." +
          "<br />" +
          "<span style='font-weight: bold;'>Outside users:</span> " +
          "use your registered email address and password."));
      o.setRich(true);
      hBox.add(o);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      
      // Add a vertical spacer
      page.add(new qx.ui.core.Spacer(), { flex : 1 });

      // Add the "Try LearnCS!" text and button, centered
      vBox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      page.add(vBox);

      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      vBox.add(hBox);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      o = new qx.ui.basic.Label(
        this.tr("Want to give ") +
        "<span style=" +
        "'font-weight: 900; font-size: 130%; font-family: JosefinSlab'>" +
        "LearnCS!" +
        "</span>" +
        this.tr(" a try? "));
      o.setRich(true);
      hBox.add(o);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

      // Add the Add New Account button, centered
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      vBox.add(hBox);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      o = new qx.ui.form.Button(this.tr("Create a new, temporary account"));
      o.addListener(
        "execute",
        function()
        {
          this.selectPage("new user");
        },
        this);
      hBox.add(o);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
    },
    
    /**
     * Add the create new user page 
     * 
     * @param pageNewUser {qx.ui.container.Composite}
     *   The container for this page's widgets
     * 
     * @lint ignoreDeprecated(alert)
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
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      hBox.add(renderer);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

      // create an hbox to center the login-in button
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      page.add(hBox);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      butCreateUser = new qx.ui.form.Button(this.tr("Create Account"));
      hBox.add(butCreateUser);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

      butCreateUser.addListener(
        "execute",
        function()
        {
          butCreateUser.setEnabled(false);
          butCreateUser.setLabel(this.tr("Validating..."));
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
            // ... then issue a request to verify that the account doesn't
            // already exist
            login.ServerOp.rpc(
              // success handler
              function(bExists, id)
              {
                if (! bExists)
                {
                  validator.setValid(true);
                }
                else
                {
                  validator.setValid(false, "User name already exists.");
                }

                // Re-enable the button
                butCreateUser.setEnabled(true);
                butCreateUser.setLabel(this.tr("Create Account"));
              }.bind(this),

              // failure handler
              function(ex, id)
              {
                // Ignore the failure. Should not ever occur.
                console.log("FAILED to determine if user exists: " + ex);
              }.bind(this),

              // function to call
              "userExists",

              // arguments
              [
                value
              ]
            );
          }
        }.bind(this));

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
        function(e)
        {
          var             request;

          // If all fields are valid...
          if (! manager.isValid())
          {
            // Re-enable the button
            butCreateUser.setEnabled(true);
            butCreateUser.setLabel(this.tr("Create Account"));
          }
          else
          {
            request = new qx.io.remote.Request("/newuser", "POST");
            request.setParameter("username", email.getValue(), true);
            request.setParameter("password", password.getValue(), true);
            request.setParameter("displayName", displayName.getValue(), true);

            request.addListener(
              "completed",
              function(e)
              {
                this.selectPage("new user instructions");
              },
              this);

            request.addListener(
              "failed",
              function(e)
              {
                // Something failed. Try again.
                alert("internal error: adding user failed");
                window.location = "/login";
              });

            request.addListener(
              "timeout",
              function(e)
              {
                alert("internal error: adding user timed out");
                window.location = "/login";
              });

            request.send();
            
            
          }
        },
        this);

/*
      // create an hbox to center the first set of instructions
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      page.add(hBox);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      o = new qx.ui.basic.Label(
        "<span style='font-weight: bold;'>UMass Lowell users:</span> " +
        "use your cs.uml.edu username and password." +
        "<br />" +
        "<span style='font-weight: bold;'>Outside users:</span> " +
        "use your registered email address and password.");
      o.setRich(true);
      hBox.add(o);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
*/
    },
    
    /**
     * Add the new user instructions page
     */
    _addNewUserInstructionsPage : function(page)
    {
      var             o;
      var             vBox;
      var             hBox;
      
      // This page is a series of vertically-placed items
      vBox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      page.add(vBox);
      
      // create an hbox to center the first set of instructions
      hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());
      vBox.add(hBox);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
      o = new qx.ui.basic.Label(
        "<span style='font-weight: bold;'>" +
        this.tr(
          "Thank you. Your account creation is now pending confirmation." +
          "<p />" +
          "Check your email for a confirmation link. Once you confirm your " +
          "account, you will be able to log in using the email address and " +
          "password you just provided.") +
        "</span>");
      o.setRich(true);
      hBox.add(o);
      hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
    },

    /**
     * Select the page to be shown.
     * 
     * @param pageName {String}
     *   The name of the page to be shown
     */
    selectPage : function(pageName)
    {
      var             name;

      // First, hide all pages
      for (name in this.__pages)
      {
        this.__pages[name].exclude();
      }
      
      // Now show the selected page
      this.__pages[pageName].show();
    }
  }
});
