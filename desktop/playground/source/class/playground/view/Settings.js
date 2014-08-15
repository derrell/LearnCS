/**
 * Settings page
 *
 * Copyright (c) 2014 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.view.Settings",
{
  extend : qx.ui.container.Composite,

  /**
   * @lint ignoreDeprecated(alert)
   */
  construct : function()
  {
    var             text;
    var             label;
    var             vBox;
    var             vBoxResearch;
    var             hBox;
    var             researchOk;
    var             saveButton;
    var             cancelButton;

    // horizontal box, to center the contents horizontally
    this.base(arguments, new qx.ui.layout.HBox());

    // left buffer, to center the vertical box
    this.add(new qx.ui.core.Spacer(), { flex : 1 });

    // vertical box 
    vBox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
    this.add(vBox);
    
    // right buffer, to center the vertical box
    this.add(new qx.ui.core.Spacer(), { flex : 1 });

    // Spacer at the top, so the list and its label aren't crammed to the top
    vBox.add(new qx.ui.core.Spacer(20, 20));

    // heading for course list
    label = new qx.ui.basic.Label();
    label.set(
      {
        font  : "bold",
        value : ("Please select the course that you are enrolled in:")
      });
    vBox.add(label);

    // the course list
    this._courses = new qx.ui.list.List();
    this._courses.setLabelPath("name");
    this._courses.getSelection().addListener(
      "change",
      function(e)
      {
        // Enable the save button once a selection has been made
        saveButton.setEnabled(
          this._courses.getSelection().getItem(0).getId() >= 0);
      },
      this);
    vBox.add(this._courses);
    
    // Spacer between course list and research approval
    vBox.add(new qx.ui.core.Spacer(20, 20));

    // vertical box 
    vBoxResearch = new qx.ui.container.Composite(new qx.ui.layout.VBox());
    vBox.add(vBoxResearch);
    
    // Plea for help
    label = new qx.ui.basic.Label();
    label.set(
      {
        font  : "bold",
        value : "Please help improve Computer Science education:"
      });
    vBoxResearch.add(label);
    
    // horizontally align the checkbox and its text
    hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox(20));
    vBoxResearch.add(hBox);

    this._researchOk = new qx.ui.form.CheckBox();
    this._researchOk.setValue(true);
    hBox.add(this._researchOk);

    text = 
      "Your programs' changes and operations are automatically saved, " +
      "periodically. " +
      "This allows you to revert to prior versions of your programs. " +
      "With your concurrence, we will also include your program changes and " +
      "operations in a research project aimed to improve introductory " +
      "computer " +
      "science educational procedures and processes. No " +
      "personally identifiable details " +
      "about you will ever be released or published without your " +
      "explicit consent. " +
      "<br><span style='font-weight: bold;'>" +
      "Check the box to the left if we may include your work in " +
      "this project." +
      "</span>";
    label = new qx.ui.basic.Label(text);
    label.set(
      {
        rich     : true,
        maxWidth : 500
      });
    hBox.add(label);
    
//    // Hide the research question for now. We have paper consent forms
//    vBoxResearch.hide();

    // Spacer between research approval and save/cancel buttons
    vBox.add(new qx.ui.core.Spacer(20, 20));

    // Warning about ensuring they've selected the correct class.
    label = new qx.ui.basic.Label();
    label.set(
      {
        font  : "bold",
        value : "CAUTION! Before clicking Save..."
      });
    vBox.add(label);
    
    label = new qx.ui.basic.Label("Verify you selected the correct course.");
    vBox.add(label);

    label = new qx.ui.basic.Label();
    label.set(
      {
        value : ("You will not be able to change it later, yet " +
                 "if it is incorrect, you may have the wrong labs provided " +
                 "to you.")
      });
    vBox.add(label);

    // horizontally align the Save and Cancel buttons
    hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
    vBox.add(hBox);
    
    // left buffer, to center the buttons
    hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

    saveButton = new qx.ui.form.Button("Save");
    hBox.add(saveButton);
    saveButton.setEnabled(false); // enabled upon course selection
    saveButton.addListener(
      "execute",
      function(e)
      {
        var             _this = this;

        // Issue an RPC to save their selections
        playground.ServerOp.rpc(
          // success handler
          function(result, id)
          {
            var             application = qx.core.Init.getApplication();
            var             whoAmI;

            // Keep track of the reseachOk flag
            whoAmI = application.getUserData("whoAmI");
            whoAmI.setResearchOk(_this._researchOk.getValue());

            // Allow rearranging displayed pages
            _this.fireEvent("settingsSaved");

            // Retrieve a new directory listing now
            playground.ServerOp.rpc(
              // success handler
              function(result, id)
              {
                application._displayDirectoryListing(result);
              },

              // failure handler
              function(ex, id)
              {
                // Ignore the failure. Should not ever occur.
                console.log("FAILED to get directory listing: " + ex);
              },

              // function to call
              "getDirectoryListing"
            );
          },

          // failure handler
          function(ex, id)
          {
            // Ignore the failure. Should not ever occur.
            alert("Unable to save settings: " + ex);
          },

          // function to call
          "saveSettings",
          
          // arguments
          [
            this._courses.getSelection().getItem(0).getId(),
            this._researchOk.getValue()
          ]
        );
      },
      this);
    
/*
    cancelButton = new qx.ui.form.Button("Cancel");
    hBox.add(cancelButton);
    cancelButton.addListener(
      "execute",
      function(e)
      {
      },
      this);
*/

    // right buffer, to center the buttons
    hBox.add(new qx.ui.core.Spacer(), { flex : 1 });
  },

  events :
  {
    /** Fired after settings have been successfully saved */
    settingsSaved : "qx.event.type.Event"
  },

  members : 
  {
    setCourseList : function(model, enrolledCourseId)
    {
      var             i;

      // Add an initial entry to tell them what to do
      model.unshift(
        {
          id               : -1,
          institution      : "",
          courseName       : "",
          labDay           : "",
          labStartTime     : "",
          isEnrollmentOpen : 1,
          instructors      : "[]",
          labInstructors   : "[]",
          name             : "<Select your lab section and course>"
        });

      // Set the complete model
      model = qx.data.marshal.Json.createModel(model);
      this._courses.setModel(model);

      // Select, by default, the initial entry we added
      this._courses.getSelection().setItem(0, model.getItem(0));

      // If there's no enrolled course id provided...
      if (typeof enrolledCourseId != "number")
      {
        // ... then there's no other selection necessary.
        return;
      }

      // Find the element with the specified enrolled course name
      for (i = 0; i < model.length; i++) 
      {
        if (model.getItem(i).getId() == enrolledCourseId) 
        {
          this._courses.getSelection().setItem(0, model.getItem(i));
          break;
        }
      }
    },
    
    setResearchOk : function(bAllow)
    {
      this._researchOk.setValue(bAllow);
    }
  }
});
