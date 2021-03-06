/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The playground toolbar containing all buttons and menus.
 *
 * @asset(playground/images/*)
 * 
 * @ignore(Blob)
 */
qx.Class.define("playground.view.Toolbar",
{
  extend : qx.ui.toolbar.ToolBar,


  construct : function()
  {
    this.base(arguments);

    this.__menuItemStore = {};

    var application = qx.core.Init.getApplication();

/* djl: no longer needed...
    // Load button
    var loadButton = 
      new uploadwidget.UploadButton("loadfile",
                                    "Load File",
                                    "icon/16/actions/document-open.png");
    loadButton.setToolTipText(this.tr("Load a source file from disk"));
    loadButton.set(
      {
        height      : 28,
        maxHeight   : 28,
        marginTop   : 8,
        marginLeft  : 12,
        marginRight : 8
      });
    this.add(loadButton);
    
    // When this button gets a changeFileName event, pass it along
    loadButton.addListener(
      "changeFileName",
      function(e)
      {
        var             reader;

        try
        {
          reader = new qx.bom.FileReader();
        }
        catch(err)
        {
          this.uploadReader = null;

          var message =
            "Your browser does not support the required functionality. " +
            "Please use a recent version of Chrome or Firefox.";

          window.alert(message);
          return;
        }

        // Arrange to be told when the file is fully loaded
        reader.addListener(
          "load",
          function(e)
          {
            // Retrieve the code from the upload button, and add it to the
            // editor.
            var code = e.getData().content;

            application.addCodeToHistory(code);
            application.editor.setCode(code);
            application.setOriginCode(application.editor.getCode());
          },
          this);

        // Listen for errors, too.
        reader.addListener(
          "error",
          function(e)
          {
            // FIXME: Find a better mechanism for displaying the error
            window.alert("ERROR: " + e.progress +
                         " (" + e.progress.getMessage() + ")");
          },
          this);

        // Get the selected File object
        var loadElement = loadButton.getInputElement().getDomElement();
        var selection = loadElement.files[0];

        // Generate a status report showing that they've pressed Load File
        playground.ServerOp.statusReport(
          {
            type         : "button_press",
            button_press : "Load File",
            filename     : selection
          });

        // Begin reading the file.
        reader.readAsText(selection);
      },
      this);


    // Save As button
    var saveButton = 
      new qx.ui.form.Button("Save As", "icon/16/actions/document-save.png");
    saveButton.setToolTipText(this.tr("Save the current source to disk"));
    saveButton.set(
      {
        height      : 28,
        maxHeight   : 28,
        marginTop   : 8,
        marginRight : 8
      });
    this.add(saveButton);

    // Bring up a Save-as dialog when the Save button is pressed
    saveButton.addListener(
      "execute",
      function(e)
      {
        playground.util.FileSaver.saveAs(
          new Blob([ application.editor.getCode() ]), "code.c");
      },
      this);
*/

    // Create a grid for the primary buttons
    var gridLayout = new qx.ui.layout.Grid(4, 0);
    gridLayout.setRowHeight(0, 38);
    gridLayout.setRowHeight(1, 38);
    var grid = new qx.ui.container.Composite(gridLayout);
    this.add(grid, { flex : 1 });



    // show files button
    this.__showFilesButton = new qx.ui.form.ToggleButton(
      this.tr("Show Files"), "icon/22/actions/edit-find.png"
    );
    this.__showFilesButton.setValue(true);
    gridLayout.setColumnAlign(2, "right");
    grid.add(this.__showFilesButton, { column : 2, row : 1 });
    this.__showFilesButton.setToolTipText(this.tr("Show files"));
    this.__showFilesButton.setAppearance("toolbar-button");
    this.__showFilesButton.addListener("changeValue", function(e) {
      this.fireDataEvent("changeSample", e.getData(), e.getOldData());
    }, this);

    // Create an input area for command line arguments
    var label = new qx.ui.basic.Label("Command line: ");
    label.set(
      {
        marginTop : 14
      });
    grid.add(label, { column : 0, row : 0 });

    label = new qx.ui.basic.Label("a.out");
    label.set(
      {
        marginTop   : 14,
        marginLeft  : 12,
        marginRight : 8,
        font        : "bold"
      });
    grid.add(label, { column : 1, row : 0 });

    var cmdLine = new qx.ui.form.TextField();
    cmdLine.set(
      {
        height    : 28,
        width     : 140,
        marginTop : 8
      });
    grid.add(cmdLine, { column : 2, row : 0 });
    cmdLine.setToolTipText(
      this.tr("Command line arguments. Arguments are split at whitespace. "
/*
              +
              "To include a space within an argument, precede it with a " +
              "backslash. To include a backslash, enter two of them. " +
              "Any other character preceded by a backslash is taken to be " +
              "that character, with the backslash removed."
*/
             ));
    application.setUserData("cmdLine", cmdLine);

    // run button
    var runButton = new qx.ui.toolbar.Button(
      this.tr("Run"), "icon/22/actions/media-playback-start.png"
    );
    grid.add(runButton, { column : 3, row : 0 });
    runButton.setToolTipText(this.tr("Run the source code"));
    application.setUserData("runButton", runButton);
    runButton.addListener("execute", function() {
      // Run the program
      this.fireEvent("run");

      // Generate a status report showing that they've pressed Run
      playground.ServerOp.statusReport(
        {
          type         : "button_press",
          button_press : "Run",
          snapshot     : application.editor.getCode(),
          filename     : application.getName()
        });
    }, this);
    
    // step button
    var stepButton = new qx.ui.toolbar.Button(
      this.tr("Step"), "icon/22/actions/go-next.png");
    stepButton.setEnabled(false);
    grid.add(stepButton, { column : 4, row : 0 });
    stepButton.setToolTipText(
      this.tr("Run current line of the program, then stop in called " +
              "function, or at next line"));
    application.setUserData("stepButton", stepButton);

    // continue button
    var continueButton = new qx.ui.toolbar.Button(
      this.tr("Continue"), "icon/22/actions/go-down.png");
    continueButton.setEnabled(false);
    grid.add(continueButton, { column : 4, row : 1 });
    continueButton.setToolTipText(
      this.tr("Continue running the program until the next breakpoint " +
              "or the program ends"));
    application.setUserData("continueButton", continueButton);

    // stop button
    var stopButton = new qx.ui.toolbar.Button(
      this.tr("Stop"), "icon/22/actions/process-stop.png");
    grid.add(stopButton, { column : 3, row : 1 });
    stopButton.setToolTipText(
      this.tr("Stop running the program"));
    application.setUserData("stopButton", stopButton);
    stopButton.setEnabled(false);
    stopButton.addListener("execute", playground.view.Toolbar.programStopped);

    // clear errors button
    var clearErrButton = new qx.ui.toolbar.Button(
      this.tr("Clear Errors"), "icon/22/actions/edit-clear.png");
    grid.add(clearErrButton, { column : 5, row : 0 });
    stopButton.setToolTipText(
      this.tr("Clear displayed error indicators"));
    application.setUserData("clearErrButton", clearErrButton);
    clearErrButton.setEnabled(false);
    clearErrButton.addListener(
      "execute",
      function(e)
      {
        qx.core.Init.getApplication().clearErrors();
      },
      this);

    // highlighting button
    this.__highlightButton = new qx.ui.form.ToggleButton(
      this.tr("Syntax Highlighting"), "icon/22/actions/check-spelling.png"
    );
    this.add(this.__highlightButton);
    this.__highlightButton.setAppearance("toolbar-button");
    this.__highlightButton.addListener("changeValue", function(e) {
      this.fireDataEvent("changeHighlight", e.getData(), e.getOldData());
    }, this);
    var initValue = qx.bom.Cookie.get("playgroundHighlight") !== "false";
    this.__highlightButton.setValue(initValue);
    this.__highlightButton.exclude(); // djl

    // MOTD
    label = new qx.ui.basic.Label();
    label.set(
      {
        rich            : true,
        maxWidth        : 300,
        value           : (
          "<b style='color:blue'>" +
/*
          "Get the UMass Lowell Computing 1 (CS1) " +
          "<a target='_blank' " +
          "   href='http://www.cs.uml.edu/~dlipman/computing1-labs'>" +
          "lab&nbsp;handouts" +
          "</a>." +
*/
          "</b>")
      });
    gridLayout.setColumnFlex(7, 1);
    grid.add(label, { column : 7, row : 0, rowSpan : 2 });

    // log Check button
    this.__logCheckButton = new qx.ui.toolbar.CheckBox(
      this.tr("Log"), "icon/22/apps/utilities-log-viewer.png"
    );
    this.add(this.__logCheckButton);
// djl...
    this.__logCheckButton.exclude();
// ...djl
    this.__logCheckButton.setToolTipText(this.tr("Show log output"));
    this.__logCheckButton.addListener("changeValue", function(e) {
      this.fireDataEvent("changeLog", e.getData(), e.getOldData());
    }, this);

// djl...
    // Memory View button
    this.__showMemTemplateButton = new qx.ui.toolbar.CheckBox(
      this.tr("Memory View"), "icon/22/apps/utilities-log-viewer.png"
    );
    grid.add(this.__showMemTemplateButton, { column : 5, row : 1 });
    this.__showMemTemplateButton.setValue(true);
    this.__showMemTemplateButton.setToolTipText(
      this.tr("Show/hide memory view"));
    
    // default to hiding the memory template view before adding listener that
    // would send a status report showing the user toggling its view
    this.__showMemTemplateButton.setValue(false);

    this.__showMemTemplateButton.addListener(
      "changeValue",
      function(e) {
        var             bOn = !!e.getData();

        // If we're not opening the memory view due to an error, generate a
        // status report showing toggling of Memory Template view
        if (! application.getUserData("memoryViewButtonInternalSet"))
        {
          playground.ServerOp.statusReport(
            {
              type             : "show_memory_view",
              show_memory_view : bOn.toString()
            });
        }

        // Show or hide the Memory Template view
        if (bOn)
        {
          application.memTemplateBox.show();
        }
        else
        {
          application.memTemplateBox.exclude();
        }
    }, this);
    
    application.setUserData("memoryViewButton", this.__showMemTemplateButton);


    // Open Memory View button on error
    this.__openMemoryViewOnError =
      new qx.ui.form.CheckBox(this.tr("Debug on error"));
    grid.add(this.__openMemoryViewOnError, { column : 6, row : 1 });
    this.__openMemoryViewOnError.setAlignY("bottom");
    this.__openMemoryViewOnError.setValue(true);
    this.__openMemoryViewOnError.setToolTipText(
      this.tr("Show the Memory View automatically if a run-time error occurs"));
    application.setUserData("openOnError", this.__openMemoryViewOnError);
    
// ...djl

    // url shortening button
    var urlShortButton = new qx.ui.toolbar.Button(
      this.tr("Shorten URL"), "icon/22/actions/bookmark-new.png"
    );
    this.add(urlShortButton);
    urlShortButton.setToolTipText(this.tr("Use tinyurl to shorten the url."));
    urlShortButton.addListener("execute", function() {
      this.fireEvent("shortenUrl");
    }, this);
    urlShortButton.exclude();   // djl

    // api button
    var apiButton = new qx.ui.toolbar.Button(
      this.tr("API Viewer"), "icon/22/actions/help-contents.png"
    );
    this.add(apiButton);
    apiButton.setToolTipText(this.tr("Open the qooxdoo API Viewer"));
    apiButton.addListener("execute", function() {
      this.fireEvent("openApi");
    }, this);
    apiButton.exclude();        // djl

    // help button
    var helpButton = new qx.ui.toolbar.Button(
      this.tr("Manual"), "icon/22/actions/help-about.png"
    );
    this.add(helpButton);
    helpButton.setToolTipText(this.tr("Open the qooxdoo Manual"));
    helpButton.addListener("execute", function() {
      this.fireEvent("openManual");
    }, this);
    helpButton.exclude();       // djl

    // demobrowser button
    var demoBrowserButton = new qx.ui.toolbar.Button(
      this.tr("Demo Browser"), "icon/22/actions/application-exit.png"
    );
    this.add(demoBrowserButton);
    demoBrowserButton.setToolTipText(this.tr("Open the qooxdoo Demo Browser"));
    demoBrowserButton.addListener("execute", function() {
      this.fireEvent("openDemoBrowser");
    }, this);
    demoBrowserButton.exclude();

    // enable doverflow handling
    this.setOverflowHandling(true);

    // remove priority for overflow handling
    this.setRemovePriority(demoBrowserButton, 8);
    this.setRemovePriority(helpButton, 7);
    this.setRemovePriority(apiButton, 6);
    this.setRemovePriority(this.__logCheckButton, 5);
    this.setRemovePriority(this.__showFilesButton, 4);
    this.setRemovePriority(this.__highlightButton, 3);
    this.setRemovePriority(urlShortButton, 1);

    // add a button for overflow handling
    var chevron = new qx.ui.toolbar.MenuButton(null, "icon/22/actions/media-seek-forward.png");
    chevron.setAppearance("toolbar-button");  // hide the down arrow icon
    this.add(chevron);
    this.setOverflowIndicator(chevron);

    // add the overflow menu
    this.__overflowMenu = new qx.ui.menu.Menu();
    chevron.setMenu(this.__overflowMenu);

    // add the listener
    this.addListener("hideItem", function(e) {
      var item = e.getData();
      var menuItem = this._getMenuItem(item);
      menuItem.setVisibility("visible");
      // menus
      if (item.getMenu && item.getMenu()) {
        var menu = item.getMenu();
        item.setMenu(null);
        menuItem.setMenu(menu);
      }
    }, this);

    this.addListener("showItem", function(e) {
      var item = e.getData();
      var menuItem = this._getMenuItem(item);
      menuItem.setVisibility("excluded");
      // menus
      if (menuItem.getMenu()) {
        var menu = menuItem.getMenu();
        menuItem.setMenu(null);
        item.setMenu(menu);
      }
    }, this);
  },


  events :
  {
    /**
     * Fired if the run button is pressed.
     */
    "run" : "qx.event.type.Event",

    /**
     * Fired if a new sample should be selected. The data contains the name of
     * the new sample.
     */
    "changeSample" : "qx.event.type.Data",

    /**
     * Data event if the code highlighting should be used.
     */
    "changeHighlight" : "qx.event.type.Data",

    /**
     * Data event if the log should be shown.
     */
    "changeLog" : "qx.event.type.Data",

    /**
     * Event which will indicate a url shortening action.
     */
    "shortenUrl" : "qx.event.type.Event",

    /**
     * Event which will be fired to open the api.
     */
    "openApi" : "qx.event.type.Event",

    /**
     * Event which will be fired to open the manual.
     */
    "openManual" : "qx.event.type.Event",

    /**
     * Event which will be fired to open the demo browser.
     */
    "openDemoBrowser" : "qx.event.type.Event"
  },


  statics :
  {
    /**
     * Called when program is stopped
     * 
     * @param e {qx.event.type.Event|String}
     *   If this function is called with a String argument, e.g., as a result of
     *   editing in the code editor, the "Program Stopped" message is appended
     *   with the provided string.
     */
    programStopped : function(e)
    {
      var             terminal;

      // Set the stop flag
      playground.c.lib.Node._bStop = true;

      // Set EOF on the terminal
      terminal = qx.core.Init.getApplication().getUserData("terminal");
      terminal.addOutput(
        ">>> Program stopped " +
          (typeof e == "string" ? e : "by user") + 
          "\n");
      terminal.setEof(true);

      // Simulate stdin data available, in case it's blocked awaiting input
      playground.c.stdio.Stdin.getInstance().fireEvent("inputdata");
    }
  },

  members :
  {
    __menuItemStore         : null,
    __overflowMenu          : null,
    __highlightButton       : null,
    __logCheckButton        : null,
    __showFilesButton    : null,
    __showMemTemplateButton : null,

    /**
     * Controlls the presed state of the log button.
     * @param show {Boolean} True, if the button should be pressed.
     */
    showLog : function(show) {
      this.__logCheckButton.setValue(show);
    },


    /**
     * Controlls the presed state of the samples button.
     * @param show {Boolean} True, if the button should be pressed.
     */
    showExamples : function(show) {
      this.__showFilesButton.setValue(show);
    },


    /**
     * Controlls the enabled property of the highlight button.
     * @param value {Boolean} True, if the button should be enabled.
     */
    enableHighlighting : function(value) {
      this.__highlightButton.setEnabled(value);
      // if the button will be disable, remove the pressed state
      if (!value) {
        this.__highlightButton.setValue(false);
      }
    },


    /**
     * Helper for the overflow handling. It is responsible for returning a
     * corresponding menu item for the given toolbar item.
     *
     * @param toolbarItem {qx.ui.core.Widget} The toolbar item to look for.
     * @return {qx.ui.core.Widget} The coresponding menu item.
     */
    _getMenuItem : function(toolbarItem) {
      var cachedItem = this.__menuItemStore[toolbarItem.toHashCode()];

      if (!cachedItem) {
        if (toolbarItem instanceof qx.ui.toolbar.CheckBox) {
          cachedItem = new qx.ui.menu.CheckBox(toolbarItem.getLabel());
        } else {
          cachedItem = new qx.ui.menu.Button(toolbarItem.getLabel(), toolbarItem.getIcon());
        }

        // connect the execute
        cachedItem.addListener("execute", function() {
          toolbarItem.execute();
        });

        this.__overflowMenu.addAt(cachedItem, 0);
        this.__menuItemStore[toolbarItem.toHashCode()] = cachedItem;
      }

      return cachedItem;
    }
  },


  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

  destruct : function() {
    this._disposeObjects("__highlightButton", "__logCheckButton",
    "__overflowMenu");
  }
});
