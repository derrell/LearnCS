/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Container for the examples.
 * 
 * @ignore(require)
 * @ignore(ace)
 * @asset(playground/*)
 */
qx.Class.define("playground.view.Samples",
{
  extend : qx.ui.container.Composite,


  construct : function()
  {
    this.base(arguments);

    // layout stuff
    var layout = new qx.ui.layout.VBox();
    this.setLayout(layout);
    this.setDecorator("main");

    // horizontal box to hold caption and versions toggle button
    var hbox = new qx.ui.container.Composite(new qx.ui.layout.HBox());

    // caption
    var caption = new qx.ui.basic.Label(this.tr("Files")).set({
      font       : "bold",
      padding    : 5,
      allowGrowX : true,
      allowGrowY : true
    });
    hbox.add(caption, { flex : 1 });
    
    // versions toggle button
    this._versions = new qx.ui.form.CheckBox(this.tr("Show Versions"));
    this._versions.setToolTipText(
      this.tr("Show versions of the selected program in My Programs"));
    this._versions.addListener(
      "changeValue", function(e) 
      {
        // Get the selected sample
        var sample = this.__list.getSelection().getItem(0);

        if (sample) 
        {
          this.fireDataEvent("updateDirectory", 
                             e.getData() ? sample.getOrigName() : null);
        }
      },
      this);
    hbox.add(this._versions);

    // Add the caption and versions toggle button to the top of list
    this.add(hbox);

    // list
    this.add(this._createList(), {flex: 1});

    // toolbar
    this.add(this._createToolbar());

    // make sure we are on a white background
    this.setBackgroundColor("white");
  },


  events : {
    /** Change event which signals the change of an example.*/
    "selectSample" : "qx.event.type.Data",

    /** Event triggered by the save button. */
    "save" : "qx.event.type.Event",

    /** Event triggered by the save as button. */
    "saveAs" : "qx.event.type.Event",

    /** Event triggered by the delete button. */
    "delete" : "qx.event.type.Event",

    /** Event triggered by the rename button. */
    "rename" : "qx.event.type.Event",

    /** Event triggered by the copy button. */
    "copy"   : "qx.event.type.Event",

    /** Cancelable event fired before the selection changes. */
    "beforeSelectSample" : "qx.event.type.Event",
    
    /** Event triggered by Show Versions checkbox */
    "updateDirectory" : "qx.event.type.Data"
  },


  properties : {
    /** Model property which contains the data for showing the examples. */
    model : {
      check : "qx.data.IListData",
      event : "changeModel",
      apply : "_applyModel"
    },

    /** Storage for the application mode. */
    mode : {
      check : "String",
      apply : "_applyMode",
      init : ""
    },

    /** Storage for the current selected sample, if any. */
    currentSample : {
      apply : "_applyCurrentSample",
      nullable : true
    }
  },


  members :
  {
    __list : null,
    __deleteButton : null,
    __renameButton : null,
    __copyButton   : null,


    /**
     * Selects the given example. If non is given, the selection will be
     * removed.
     * @param sample {qx.core.Obejct} The sample to select.
     */
    select : function(sample) {
      this.__list.getSelection().setItem(0, sample);
    },


    /**
     * Selects a sample by the given code.
     * @param code {String} The code which the sample contains.
     */
    selectByCode : function(code) {
      var model = this.__list.getModel();
      for (var i=0; i < model.length; i++) {
        if (model.getItem(i).getCode() == code) {
          this.select(model.getItem(i));
          return;
        }
      };
    },


    /**
     * Selects a sample by the given name.
     * @param code {String} The name of the sample.
     */
    selectByName : function(name) {
      var model = this.__list.getModel();
      this.__internalSelect = true;
      for (var i=0; i < model.length; i++) {
        if (model.getItem(i).getName() == name) {
          this.select(model.getItem(i));
          break;
        }
      };
      this.__internalSelect = false;
    },


    /**
     * Creating helper which is responsible for creating the list.
     */
    _createList : function() {
      // create and configure the list
      this.__list = new qx.ui.list.List();
      this.__list.setAppearance("sample-list");
      this.__list.setLabelPath("name");

      // CARFULL: HACK TO GET THE SELECTION PREVENTED
      this.__list._manager.detatchMouseEvents();
      // store the old hous handler
      var oldHandler = this.__list._manager.handleMouseDown;
      var self = this;
      // attach a new handler function
      this.__list._manager.handleMouseDown = function(e) {
        // fire the cancleable event
        var changeOk = self.fireEvent("beforeSelectSample", qx.event.type.Event, [false, true]);
        if (changeOk) {
          // if not canceled, execute the original handler
          oldHandler.call(self.__list._manager, e);
        }
      };
      this.__list._manager.attachMouseEvents();
      // ////////////////////////////////////////////

      // set the delegate
      this.__list.setDelegate(
        {
/* djl
          // filter: only show samples for the current mode
          filter : function(data) 
          {
            return data.getMode() == self.getMode();
          },
*/
          // group the samples by category
          group : function(data) 
          {
            return data.getCategory();
          },

          sorter : function(a, b)
          {
            var             aName = a.getOrigName();
            var             bName = b.getOrigName();
            var             aCategory = a.getCategory();
            var             bCategory = b.getCategory();
            var             aVersionNum = a.getVersionNum();
            var             bVersionNum = b.getVersionNum();

            // Sort first by category, ...
            if (aCategory != bCategory)
            {
              return (aCategory < bCategory 
                      ? -1 
                      : (aCategory > bCategory
                         ? 1
                         : 0));
            }

            // ... then by name, ...
            if (aName != bName)
            {
              return (aName < bName
                      ? -1
                      : (aName > bName
                         ? 1
                         : 0));
            }

            // and finally by version number
            return (aVersionNum < bVersionNum 
                    ? -1 
                    : (aVersionNum > bVersionNum
                       ? 1
                       : 0));
          }
      });

      // selection change handler
      this.__list.getSelection().addListener(
        "change",
        function() 
        {
          // Get the selected sample
          var sample = this.__list.getSelection().getItem(0);
          
          if (sample) 
          {
            // Enable versions button only if selection is in My Programs, and
            // is not an older version of a program.
            this._versions.setEnabled(sample.getCategory() == "My Programs" &&
                                      sample.getVersionNum() == 0);
        
            // If this isn't an internal selection (i.e., it's by user click)...
            if (! this.__internalSelect)
            {
              // ... then handle a user selection
              this.fireDataEvent("selectSample", sample);
            }
          }
        }, 
        this);

      return this.__list;
    },


    /**
     * Helper for creating the toolbar.
     */
    _createToolbar : function() {
      // crate and initialize the toolbar
      var toolbar = new qx.ui.toolbar.ToolBar();
      toolbar.setDecorator("separator-vertical");
      toolbar.setBackgroundColor("white");

/* djl...
      // save button
      var saveButton = new qx.ui.toolbar.Button(
        null, "icon/16/actions/document-save.png"
      );
      toolbar.add(saveButton);
      saveButton.setToolTipText(this.tr("Save"));
      saveButton.addListener("execute", function() {
        this.fireEvent("save");
      }, this);
*/

      // copy button
      this.__copyButton = new qx.ui.toolbar.Button(
        null, "icon/16/actions/document-save-as.png"
      );
      toolbar.add(this.__copyButton);
      this.__copyButton.setToolTipText(
        this.tr("Copy to new name in My Programs"));
      this.__copyButton.addListener("execute", function() {
        this.fireEvent("copy");
      }, this);

      // delete button
      this.__deleteButton = new qx.ui.toolbar.Button(
        null, "icon/16/places/user-trash.png"
      );
      toolbar.add(this.__deleteButton);
      this.__deleteButton.setToolTipText(this.tr("Delete"));
      this.__deleteButton.addListener("execute", function() {
        this.fireEvent("delete");
      }, this);

      // rename button
      this.__renameButton = new qx.ui.toolbar.Button(
        null, "icon/16/actions/format-text-direction-ltr.png"
      );
      toolbar.add(this.__renameButton);
      this.__renameButton.setToolTipText(this.tr("Rename"));
      this.__renameButton.addListener("execute", function() {
        this.fireEvent("rename");
      }, this);

      // Separate the primary buttons from the download button
      toolbar.add(new qx.ui.toolbar.Separator());

      // save button
      this.__saveAsButton = new qx.ui.toolbar.Button(
        null, "icon/16/actions/document-save.png"
      );
      toolbar.add(this.__saveAsButton);
      this.__saveAsButton.setToolTipText(this.tr("Download"));
      this.__saveAsButton.addListener("execute", function() {
        this.fireEvent("saveAs");
      }, this);

      return toolbar;
    },


    // property apply
    _applyCurrentSample : function(value) {
      this.select(value);
      // only change the state of the buttons if they are available
      if (this.__deleteButton && this.__renameButton && this.__copyButton)
      {
        if (value)
        {
          this.__copyButton.setEnabled(true);
          this.__saveAsButton.setEnabled(true);
        }

        // only change the state of the buttons for non-Template categories
        if (value && ! value.getCategory().match(/Templates/))
        {
          this.__deleteButton.setEnabled(true);
          this.__renameButton.setEnabled(true);
        }
        else
        {
          this.__deleteButton.setEnabled(false);
          this.__renameButton.setEnabled(false);
          this.__copyButton.setEnabled(false);
          this.__saveAsButton.setEnabled(false);
        }
      }
    },


    // property apply
    _applyModel : function(value) {
      if (value) {
        this.__list.setModel(value);
      }
    },


    // property apply
    _applyMode : function(value) {
      // refresh is needed because the filter has changed
      this.__list.refresh();
    }
  }
});
