/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

/**
 * Playground application, which allows for source code editing and live
 * previews of a simple custom application.
 * 
 * @asset(qx/icon/${qx.icontheme}/*)
 */
qx.Class.define("playground.Application",
{
  extend : qx.application.Standalone,


  properties :
  {
    /** The name of the current application.*/
    name : {
      check : "String",
      apply : "_applyName",
      init: ""
    },


    /** Code to check agains as unchanged source of the loaded code.*/
    originCode : {
      check : "String",
      apply : "_applyOriginCode",
      init : ""
    },


    /** The current selected sample model. */
    currentSample : {
      apply : "_applyCurrentSample",
      event : "changeCurrentSample",
      nullable : true
    },
    
    
    /** Current state of the program, for keeping gui in sync */
    programState : {
      apply : "_applyProgramState",
      check : [ "idle", "running", "stopped", "continuing", "crashed" ]
    }
  },


  /*
   *****************************************************************************
      MEMBERS
   *****************************************************************************
  */
  members :
  {
    // UI Components
    __header         : null,
    __mainsplit      : null,
    __toolbar        : null,
    __log            : null,
    __playArea       : null,
    __samplesPane    : null,
    __editorsplit    : null,
    __websiteContent : null,
    __blockEditor    : null,
    __terminalsplit  : null,
    __initCalled     : false,

    editor : null,
    __bFirstError : true,

    // storages
    __samples : null,
    __store : null,

    __history : null,
    __urlShorter : null,

    __currentStandalone: null,

    // flag used for the warning for IE
    __ignoreSaveFaults : false,

    __modified : false,

    // used for removing the created objects in the run code
    __beforeReg : null,
    __afterReg : null,
    __oldCode : null,

    __errorMsg: qx.locale.Manager.tr(
      "Unfortunately, an unrecoverable internal error was caused by your code." +
      " This may prevent the playground application to run properly.||"
    ),

    __mode : null,
    __maximized : null,

    /**
     * This method contains the initial application code and gets called
     * during startup of the application.
     *
     * @ignore(qxc)
     */
    main : function()
    {
      var             timer;
      
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

      // Enable simulation in the source version; disable it in the
      // build version (unless qx.debug is specifically set in the config
      // file).
      if (qx.core.Environment.get("qx.debug"))
      {
        // Start the RPC simulator by getting its singleton instance
        this.dbif = playground.dbif.DbifSim.getInstance();

        // Select to use the simulated transport
        liberated.sim.remote.MRpc.SIMULATE = true;
      }
      else
      {
        // Use the real transport
        liberated.sim.remote.MRpc.SIMULATE = false;        
      }

      // container layout
      var layout = new qx.ui.layout.VBox();

      // main container
      var mainContainer = new qx.ui.container.Composite(layout);
      this.getRoot().add(mainContainer, { edge : 0 });

      // editing container
      this._editingContainer = new qx.ui.container.Composite(
        new qx.ui.layout.VBox(), { flex : 1 });
      
      mainContainer.add(this._editingContainer, { flex : 1 });

      // qooxdoo header
      this.__header = new playground.view.Header();
      this._editingContainer.add(this.__header, { flex : 0 });
//      this.__header.addListener("changeMode", this._onChangeMode, this);

      // toolbar
      this.__toolbar = new playground.view.Toolbar();
      this._editingContainer.add(this.__toolbar, { flex : 0 });
      
      // settings container
      this._settingsContainer = 
        new qx.ui.container.Composite(new qx.ui.layout.VBox());
      this._settingsContainer.exclude();
      
      this._settings = new playground.view.Settings();
      this._settingsContainer.add(this._settings);
      mainContainer.add(this._settingsContainer, { flex : 1 });
      
      // settings listener
      this._settings.addListener(
        "settingsSaved",
        function(e)
        {
          // Hide settings container
          this._settingsContainer.exclude();
          
          // Show the editing container
          this._editingContainer.show();
        },
        this);

      // toolbar listener
      this.__toolbar.addListener("run", this.run, this);
      this.__toolbar.addListener("changeSample", this.__onSampleChange, this);
      this.__toolbar.addListener("changeHighlight", this.__onHighlightChange, this);
      this.__toolbar.addListener("changeLog", this.__onLogChange, this);
      this.__toolbar.addListener("shortenUrl", this.__onUrlShorten, this);
      this.__toolbar.addListener("openApi", this.__onApiOpen, this);
      this.__toolbar.addListener("openManual", this.__onManualOpen, this);
      this.__toolbar.addListener("openDemoBrowser",this.__onDemoBrowser,this);

      // mainsplit, contains the editor splitpane and the info splitpane
      this.__mainsplit = new qx.ui.splitpane.Pane("horizontal");
      this._editingContainer.add(this.__mainsplit, { flex : 1 });
      this.__mainsplit.setAppearance("app-splitpane");

      // editor split (left side of main split)
      this.__editorsplit = new qx.ui.splitpane.Pane("horizontal");
      this.__editorsplit.setDecorator(null); // get rid of the 3px broder
      // info split (right side of the main split)
      var infosplit = new qx.ui.splitpane.Pane("vertical");
      infosplit.setDecorator(null);
      
      // examples pane
      this.__samplesPane = new playground.view.Samples();
//      this.__samplesPane.addListener("save", this.__onSave, this);
      this.__samplesPane.addListener("saveAs", this.__onSaveAs, this);
      this.__samplesPane.addListener("delete", this.__onDelete, this);
      this.__samplesPane.addListener("rename", this.__onRename, this);
      this.__samplesPane.addListener("copy", this.__onCopy, this);
      this.__samplesPane.addListener("updateDirectory", 
                                     this.__onUpdateDirectory, 
                                     this);
      this.bind("currentSample", this.__samplesPane, "currentSample");
      this.__samplesPane.addListener("beforeSelectSample", function(e) {
        if (this.__discardChanges()) {
          e.stop();
        }
      }, this);
      this.__samplesPane.addListener("selectSample", function(e) {
        this.setCurrentSample(e.getData());
      }, this);

      // initialize custom samples
/* djl
      this.__store = new qx.data.store.Offline("qooxdoo-playground-samples");
      // if the local storage is not empty
      if (this.__store.getModel() != null) {
        // use the stored array to initialize the built in samples
        this.__samples = new playground.Samples(this.__store.getModel());
      } else {
        // init the samples and store in the local storage
        this.__samples = new playground.Samples();
        this.__store.setModel(this.__samples.getModel());
      }
      this.__store.bind("model", this.__samplesPane, "model");
else... */
      this.__samples = new playground.Samples();
// ...djl

      // Create a split for the tabview and the terminal
      this.__terminalsplit = new qx.ui.splitpane.Pane("vertical");
      this.__terminalsplit.setDecorator(null); // get rid of the 3px broder
      
      // Create a tabview to hold the Source and Block Editors
      var tabview = new qx.ui.tabview.TabView();
      var page;
        
      // Create the page for the Source editor
      this.__sourcePage = page = new qx.ui.tabview.Page("");
      page.setLayout(new qx.ui.layout.VBox());
      this.editor = new playground.view.Editor();
      this.editor.addListener("disableHighlighting", function() {
        this.__toolbar.enableHighlighting(false);
      }, this);
      playground.view.Editor.loadAce(function() {
        this.init("ace");
      }, this);
      
      // Make the editor available, for such things as its getBreakpoints()
      qx.core.Init.getApplication().setUserData("sourceeditor", this.editor);
      
      // Add the source editor to the page
      page.add(this.editor, { flex : 1 });
      
      // Add the page to the tabview
      tabview.add(page);

      // Create the page for the Preprocessor output
      page = new qx.ui.tabview.Page("Preprocessor Output");
      page.setLayout(new qx.ui.layout.VBox());
      
      this.__cppOutput = new qx.ui.form.TextArea();
      this.__cppOutput.set(
        {
          font       : "monospace",
          decorator  : null,
          value      : "",
          wrap       : false,
          readOnly   : true
        });
      
      // Add the preprocessor output text area to the page
      page.add(this.__cppOutput, { flex : 1 });

      // Make the preprocessor output available
      qx.core.Init.getApplication().setUserData("cppoutput", this.__cppOutput);

      // Add the page to the tabview
      if (qx.core.Environment.get("qx.debug"))
      {
        tabview.add(page);
      }

      // When the preprocessor page is selected, generate preprocessed output
      var             cppPage = page;
      tabview.addListener(
        "changeSelection",
        function(e)
        {
          if (e.getData()[0] == cppPage)
          {
            try
            {
              playground.c.lib.Preprocessor.preprocess(
                this.editor.getCode(),
                function(preprocessedText)
                {
                  var             lines;
                  var             lineNum = 1;

                  // Split the preprocessed text by line
                  lines = preprocessedText.split("\n");

                  // Prepend a line number to each one
                  lines = lines.map(
                    function(line)
                    {
                      return ("      " + lineNum++).substr(-4) + " " + line;
                    });
                  this.__cppOutput.setValue(lines.join("\n"));
                }.bind(this));
            }
            catch(e2)
            {
              this.__cppOutput.setValue("Errors encountered. See 'Terminal'");
            }
          }
        },
        this);

      // Create the page for the Block editor
      page = new qx.ui.tabview.Page("Blocks");
      page.setLayout(new qx.ui.layout.VBox());
      this.__blockEditor = new playground.view.Blockly();
      playground.view.Blockly.loadBlockly(function() {
          this.init("blockly");
        },
        this);
      
      // Add the block editor to the page
      page.add(this.__blockEditor, { flex : 1 });

      // Add the page to the tabview
      if (qx.core.Environment.get("qx.debug"))
      {
        tabview.add(page);
      }
      
      // Create a terminal window
      var terminal = new playground.view.Terminal();
      qx.core.Init.getApplication().setUserData("terminal", terminal);

      this.__editorsplit.add(this.__samplesPane, 1);
// djl...
//      this.__samplesPane.exclude();
// ...djl
      this.__terminalsplit.add(tabview, 4);
      this.__terminalsplit.add(terminal, 2);
      this.__editorsplit.add(this.__terminalsplit, 4);
      this.__mainsplit.add(this.__editorsplit, 6);
      this.__mainsplit.add(infosplit, 3);

/* djl removed...
      {
        this.__playArea = new playground.view.PlayArea();
        this.__playArea.addListener("toggleMaximize",
                                    this._onToggleMaximize, this);
        infosplit.add(this.__playArea, 2);
      }
... djl removed */

      // djl...
      // Create a composite container for the memory template
      var vbox = new qx.ui.container.Composite(new qx.ui.layout.VBox());
      
      // Add the radio buttons for displaying either decimal or hex addresses
      var addrFormat = new qx.ui.container.Composite(new qx.ui.layout.HBox(12));
      addrFormat.add(new qx.ui.core.Spacer(), { flex : 1 });
      addrFormat.add(new qx.ui.basic.Label(this.tr("Address format: ")));

      var decimal = new qx.ui.form.RadioButton("decimal");
      var hex = new qx.ui.form.RadioButton("hex");
      var mgr = new qx.ui.form.RadioGroup();
      mgr.add(decimal, hex);
      addrFormat.add(decimal);
      addrFormat.add(hex);
      addrFormat.add(new qx.ui.core.Spacer(), { flex : 1 });
      
      mgr.addListener(
        "changeSelection",
        function(e)
        {
          var             selection = mgr.getSelection()[0];
          
          playground.view.c.MemoryWord.addrBase = 
            selection == decimal ? 10 : 16;
          this.memTemplate.refresh();
        },
        this);

      // The default is decimal view
      decimal.setValue(true);
      vbox.add(addrFormat);
      
      // Create some space between the radio buttons and the header
      vbox.add(new qx.ui.core.Spacer(null, 12));

      // Create the header for column labels of the memory view
      var header = new qx.ui.container.Composite();

      // Create a grid layout. Leave some horizontal space between elements.
      var gridLayout = new qx.ui.layout.Grid(8, 0);
      header._setLayout(gridLayout);

      // Set column widths exactly as they are in each MemoryWord list item
      gridLayout.setColumnWidth(0, 120);
      gridLayout.setColumnFlex(0, 1);
      gridLayout.setColumnAlign(0, "center", "middle");

      gridLayout.setColumnWidth(1, 50);
      gridLayout.setColumnMaxWidth(1, 50);
      gridLayout.setColumnMinWidth(1, 50);
      gridLayout.setColumnAlign(1, "center", "middle");

      for (var col = 2; col < 6; col++)
      {
        gridLayout.setColumnWidth(col, 26);
        gridLayout.setColumnMaxWidth(col, 26);
        gridLayout.setColumnMinWidth(col, 26);
        gridLayout.setColumnAlign(col, "center", "middle");
      }
      
      var label = new qx.ui.basic.Label(
        "<span style='font-weight: bold;'>Name</span>");
      label.setRich(true);
      header.add(label, { row : 0, column : 0 } );

      label = new qx.ui.basic.Label(
        "<span style='font-weight: bold;'>Addr</span>");
      label.setRich(true);
      header.add(label, { row : 0, column : 1 } );

      label = new qx.ui.basic.Label(
        "<span style='font-weight: bold;'>Content</span>");
      label.setRich(true);
      header.add(label, { row : 0, column : 2, colSpan : 4 } );

      // spacer where scrollbar goes
      label = new qx.ui.basic.Label("");
      header.add(label, { row : 0, column : 6 } );

      vbox.add(header);

      // Add the memory template
      var model = playground.c.machine.Memory.getInstance().getDataModel();
      model = qx.data.marshal.Json.createModel(model);
      this.memTemplate = new playground.view.c.Memory(model);
      vbox.add(this.memTemplate, { flex : 1 });

      // Make the memory template infosplit accessible to the button that
      // hides/shows it
      this.memTemplateBox = infosplit;

      // default to hiding the memory template view
      this.memTemplateBox.exclude();

      infosplit.add(vbox, 2);
      // ...djl
      

      this.__mainsplit.getChildControl("splitter").addListener("mousedown", function() {
        this.__editor.block();
      }, this);

      this.__mainsplit.addListener("losecapture", function() {
        this.editor.unblock();
      }, this);

      this.__log = new qxc.ui.logpane.LogView();

      infosplit.add(this.__log, 1);
      this.__log.exclude();

      // Start a timer to autosave the program
      timer = qx.util.TimerManager.getInstance();
      timer.start(
        function()
        {
          var             timeout;
          var             oneMinute = 60 * 1000;
          var             name = this.getName();
          var             code = this.editor.getCode();
          
          // If they're editing some code...
          if (name && name.length > 0 && code != this.getOriginCode())
          {
            // ... then autosave it
            playground.ServerOp.statusReport(
              {
                type         : "autosave",
                snapshot     : code,
                filename     : name,
                versions     : this.__samplesPane._versions.getValue()
              });
            
            // Save the autosaved code as the origin code, so we won't
            // autosave again until it changes.
            this.setOriginCode(code);
          }

          // Restart the timer to expire in some random amount of time
          // in a specified range
          timeout = 
            Math.floor(Math.random() * oneMinute * 2) + // 2 minute range
            oneMinute;                                  // starting at 1 minute
          timer.start(arguments.callee, 0, this, null, timeout);
        },
        0,
        this,
        null,
        2 * 60 * 1000);
    },


    /**
     * Initialization after the external editor has been loaded.
     */
    init: function(who) {
      // If this is the first call to init...
      if (! this.__initCalled) {
        // ... then initialize a map to store who has called us
        this.__initCalled = {};
      }
      
      // Remember that we were called by the current caller
      this.__initCalled[who] = true;

      // Call the appropriate editor's init function
      if (who == "ace") {
        this.editor.init();
      } else { // "blockly"
        this.__blockEditor.init();
      }
      
      // If we haven't initialized both "ace" and "blockly"...
      if (! this.__initCalled["ace"] || 
          ! this.__initCalled["blockly"]) {
        // ... then await the other call to this function
        return;
      }

/*
      // check if mobile chould be used
      if (this.__supportsMode("mobile")) {
        // check for the mode cookie
        if (qx.bom.Cookie.get("playgroundMode") === "mobile") {
          this.setMode("mobile");
        } else {
          this.setMode("ria");
        }
      } else {
        this.setMode("ria");
        this.__header.setEnabledMode("mobile", false);
      }
*/

      // Back button and bookmark support
      this.__initBookmarkSupport();

      // check for the highlight and examples cookie
      if (qx.bom.Cookie.get("playgroundHighlight") === "false") {
        this.editor.useHighlight(false);
      }
      if (qx.bom.Cookie.get("playgroundShowExamples") === "false") {
        this.__toolbar.showExamples(false);
      }
    },


    _displayDirectoryListing : function(result)
    {
      var             model;
      var             marshaler;

      // Display the result values.
      marshaler = new qx.data.marshal.Json();
      marshaler.toClass(result, true);

      model = marshaler.toModel(result, true);
      if (typeof model == "undefined") 
      {
        model = null;
      }
      this.__samplesPane.setModel(model);
      
      // Select the currently-displayed program
      this.__samplesPane.selectByName(this.getName());
    },

    // ***************************************************
    // PROPERTY APPLY
    // ***************************************************
    // property apply
    _applyName : function(value, old) {
      this.__updateTitle(value);
      this.__sourcePage.setLabel(value);
    },


    // property apply
    _applyOriginCode : function(value, old) {
      this.__modified = false;
    },


    // property apply
    _applyCurrentSample : function(newSample, old) {
      var             args = [];
      var             bRefreshDirectoryListing;

      // ignore when the sample is set to null
      if (!newSample) {
        return;
      }

      // Build the argument list for retrieving the requested program. First,
      // add the always-there arguments.
      args.push(newSample.getOrigName());
      args.push(newSample.getHash());
      args.push(newSample.getCategory());
      args.push(newSample.getUser());
      
      // Request a new directory listing if the new selected file has the
      // versions button enabled. That would mean that it's in My Programs,
      // and is not itself a version. (This will clear out any versions of the
      // prior program.)
      bRefreshDirectoryListing = this.__samplesPane._versions.getEnabled();
      args.push(bRefreshDirectoryListing);
      
      // If the code in the editor has changed from its original...
      if (this.editor.getCode() != this.getOriginCode())
      {
        // ... then also send it, to be saved.
        args.push(this.getName());
        args.push(this.editor.getCode());
      }

      // Issue a request to retrieve the requested program
      playground.ServerOp.rpc(
        // success handler
        function(result, id)
        {
          this.editor.setCode(result.code);
          this.setOriginCode(result.code);
          this.addCodeToHistory(result.code);
          this.setName(result.name);
          
          // Is there a directory listing?
          if (result.dirList)
          {
            // Yup. Display it.
            this._displayDirectoryListing(result.dirList);
            
            // This is a new file (with no versions), so turn off the checkbox
            this.__samplesPane._versions.setValue(false);
          }
        }.bind(this),

        // failure handler
        function(ex, id)
        {
          // Ignore the failure. Should not ever occur.
          console.log("FAILED to retrieve file " + newSample.getOrigName() + 
                      ", hash " + newSample.getHash() + ": " + ex);
        }.bind(this),

        // function to call
        "getProgram",
        
        // arguments
        args
      );
    },


    // property apply
    _applyProgramState : function(newState, old)
    {
      var             setGuiState;
      var             application = qx.core.Init.getApplication();
      
      setGuiState = function(info)
      {
        // Set the button state for each button
        info.buttonInfo.forEach(
          function(buttonInfo)
          {
            var             button;

            button = this.getUserData(buttonInfo.button);
            button.setEnabled(buttonInfo.enabled);
          }.bind(this));
        
        // Reset the Stop flag, if requested
        if (info.resetStopFlag)
        {
          playground.c.lib.Node._bStop = false;
        }
        
        // Clear all errors, if requested
        if (info.clearErrors)
        {
          this.clearErrors();
        }
        
        // Open the memory view, if requested
        if (info.openMemoryView)
        {
          // Automatically display the memory view now, without sending the
          // normal status report.
          application.setUserData("memoryViewButtonInternalSet", true);
          application.getUserData("memoryViewButton").setValue(true);
          application.setUserData("memoryViewButtonInternalSet", false);
        }
      }.bind(this);

      try
      {
        switch(newState)
        {
        case "idle" :             // not yet run or exited without crash
          setGuiState(
            {
              buttonInfo :
                [
                  {
                    button : "runButton",
                    enabled: true
                  },
                  {
                    button : "stepButton",
                    enabled: false
                  },
                  {
                    button : "continueButton",
                    enabled: false
                  },
                  {
                    button : "stopButton",
                    enabled: false
                  }
                ],

              resetStopFlag : true
            });
          break;

        case "running" :          // starting program running
          setGuiState(
            {
              buttonInfo :
                [
                  {
                    button : "runButton",
                    enabled: false
                  },
                  {
                    button : "stepButton",
                    enabled: false
                  },
                  {
                    button : "continueButton",
                    enabled: false
                  },
                  {
                    button : "stopButton",
                    enabled: true
                  }
                ],

              resetStopFlag : true,
              clearErrors   : true
            });
          break;

        case "stopped" :          // stopped at a breakpoint
          setGuiState(
            {
              buttonInfo :
                [
                  {
                    button : "runButton",
                    enabled: false
                  },
                  {
                    button : "stepButton",
                    enabled: true
                  },
                  {
                    button : "continueButton",
                    enabled: true
                  },
                  {
                    button : "stopButton",
                    enabled: true
                  }
                ],

              resetStopFlag  : true,
              openMemoryView : true
            });
          break;

        case "continuing" :       // continuing via Step or Continue
          setGuiState(
            {
              buttonInfo :
                [
                  {
                    button : "runButton",
                    enabled: false
                  },
                  {
                    button : "stepButton",
                    enabled: false
                  },
                  {
                    button : "continueButton",
                    enabled: false
                  },
                  {
                    button : "stopButton",
                    enabled: true
                  }
                ]
            });
          break;

        case "crashed" :          // program crashed
          setGuiState(
            {
              buttonInfo :
                [
                  {
                    button : "runButton",
                    enabled: true
                  },
                  {
                    button : "stepButton",
                    enabled: false
                  },
                  {
                    button : "continueButton",
                    enabled: false
                  },
                  {
                    button : "stopButton",
                    enabled: false
                  }
                ],

              resetStopFlag : true
            });
          break;

        default:
          throw new Error("unexpected program state: " + newState);
        }
      }
      catch(e)
      {
          // fails in non-gui environment
      }
    },


    // ***************************************************
    // MODE HANDLING
    // ***************************************************
    __enableWebsiteMode : function(enabled) {
      if (enabled) {
        this.__toolbar.exclude();
        this.__mainsplit.exclude();
      } else {
        this.__toolbar.show();
        this.__mainsplit.show();
      }

      // on demand creation
      if (!this.__websiteContent && enabled) {
        this.__websiteContent = new playground.view.WebsiteContent();
        this.getRoot().getChildren()[0].add(this.__websiteContent, {flex: 1});
      }

      if (this.__websiteContent) {
        if (!enabled) {
          this.__websiteContent.exclude();
        } else {
          this.__websiteContent.show();
        }
      }

    },

    /**
     * Event handler for changing the mode of the palyground.
     * @param e {qx.event.type.Data} The data event containing the mode.
     */
    _onChangeMode : function(e) {
      var mode = e.getData();
      // ignore setting the same mode
      if (mode == this.__mode) {
        return;
      }

      if (!this.setMode(mode)) {
        this.__header.setMode(e.getOldData());
      } else {
        // select the first sample
        this.setCurrentSample(this.__samples.getFirstSample(mode));
      }
    },


    /**
     * Helper to determinate if the mode is currently supported e.g. mobile
     * in the current runtime.
     * @param mode {String} The name of the mode.
     * @return {boolean} <code>true</code>, if the given mode can be used.
     */
    __supportsMode : function(mode) {
      if (mode == "mobile") {
        var engine = qx.core.Environment.get("engine.name");

        // all webkits are ok
        if (engine == "webkit") {
          return true;
        }
        // ie > 10 is ok
        if (engine == "mshtml" && parseInt(qx.core.Environment.get("browser.documentmode")) >= 10) {
          return true;
        }
        // ff > 10 is ok
        if (engine == "gecko" && parseInt(qx.core.Environment.get("engine.version")) >= 10) {
          return true;
        }
      } else if (mode == "ria" || mode == "website") {
        return true;
      }
      return false;
    },


    /**
     * Setter and dispatcher for the current mode the playground is in.
     * @param mode {String} The mode to use.
     */
    setMode : function(mode) {
      // check if the mode is supported
      if (!this.__supportsMode(mode)) {
        throw new Error("Mode '" + mode + "' not supported");
      }

      // only set new mode if not already set
      if (this.__mode == mode) {
        return true;
      }

      // only change the mode if no code gets lost
      if (this.__discardChanges()) {
        return false;
      }

      // store the mode
      qx.bom.Cookie.set("playgroundMode", mode, 100);
      this.__mode = mode;

      // update the views (changes the play application)
      if (this.__playArea) {
        this.__playArea.setMode(mode);
        this.__header.setMode(mode);
        this.__samplesPane.setMode(mode);
      }

      // erase the code
      this.editor.setCode("");

      this.__enableWebsiteMode(mode == "website");

      return true;
    },


    // ***************************************************
    // SAMPEL SAVE / DELETE
    // ***************************************************
    /**
     * Helper to write the current code to the model and with that to the
     * offline store.
     */
/* djl...
    __onSave : function() {
      var current = this.getCurrentSample();

      // if we don't have a current sample and the sample is a static one
      if (!current || current.getCategory() == "static") {
        this.__onSaveAs();
      // if its a user sample which is selected, we just store the new code
      } else {
        // store in curent sample
        current.setCode(this.editor.getCode());
        this.setOriginCode(current.getCode());
        // set the name to make sure no "changed" state is displayed
        this.setName(current.getName());
      }
    },
*/


    /**
     * Helper to write the current code to the model and with that to the
     * offline store.
     *
     * @ignore(Blob)
     */
    __onSaveAs : function() 
    {
      playground.util.FileSaver.saveAs(
        new Blob([ this.editor.getCode() ]), 
        this.getName());
    },


    /**
     * Helper to delete the selected sample.
     *
     * @lint ignoreDeprecated(alert)
     * @lint ignoreDeprecated(confirm)
     */
    __onDelete : function() 
    {
      var             name;
      
      // Retrieve the name of the current program
      name = this.getName();
      
      // Confirm that the user wants to remove the file
      if (! confirm(this.tr("Really delete program ") + name))
      {
        return;
      }
      
      // Issue a request to remove the program
      playground.ServerOp.rpc(
        // success handler
        function(result, id)
        {
          if (result.status === 0)
          {
            this.setName(null);
            this.editor.setCode("");
            this._displayDirectoryListing(result.dirList);
          }
          else
          {
            alert(this.tr("Internal error: Could not remove the program."));
          }
        }.bind(this),

        // failure handler
        function(ex, id)
        {
          // Ignore the failure. Should not ever occur.
          console.log("FAILED to remove program " + name + ": " + ex);
        }.bind(this),

        // function to call
        "removeProgram",
        
        // arguments
        [ name ]
      );
    },


    /**
     * Helper to rename a sample.
     *
     * @lint ignoreDeprecated(alert)
     */
    __onRename : function() 
    {
      var             oldName;
      var             newName;
      var             testName;

      // Retrieve the current name of the program
      oldName = this.getName();
      
      // We'll use the old name as the default new name for now
      testName = oldName;

      // ask the user for a new name
      do
      {
        newName = prompt(this.tr("New name: "), testName);
        if (!newName) 
        {
          return;
        }
        
        // Sanitize the name, for better chance of success at the backend
        testName = newName.replace(/ /g, "-");
        testName = testName.replace(/\.\./g, "DOTDOT");
        testName = testName.replace();
        testName = testName.replace(/\\/g, "/");
        testName = testName.replace(/\/\//g, "/");
        testName = testName.replace(/\//g, "SLASH");
      } while (testName != newName);
      
      // Issue a request to rename the program
      playground.ServerOp.rpc(
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
    },

    /**
     * Helper to copy a sample.
     *
     * @lint ignoreDeprecated(alert)
     */
    __onCopy : function() 
    {
      var             oldName;
      var             newName;
      var             testName;

      // Retrieve the current name of the program
      oldName = this.getName();
      
      // We'll use the old name as the default new name for now
      testName = oldName;

      // ask the user for a new name
      do
      {
        newName = prompt(this.tr("Copy to My Programs as: "), testName);
        if (!newName) 
        {
          return;
        }
        
        // Sanitize the name, for better chance of success at the backend
        testName = newName.replace(/ /g, "-");
        testName = testName.replace(/\.\./g, "DOTDOT");
        testName = testName.replace();
        testName = testName.replace(/\\/g, "/");
        testName = testName.replace(/\/\//g, "/");
        testName = testName.replace(/\//g, "SLASH");
      } while (testName != newName);
      
      // Issue a request to rename the program
      playground.ServerOp.rpc(
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
            alert(this.tr("Could not copy file. ") +
                  this.tr("Maybe the name you requested already exists?"));
          }
        }.bind(this),

        // failure handler
        function(ex, id)
        {
          // Ignore the failure. Should not ever occur.
          console.log("FAILED to copy file " + oldName +
                      " to " + newName + ": " + ex);
        }.bind(this),

        // function to call
        "copyProgram",
        
        // arguments
        [
          oldName,
          this.getCurrentSample().getCategory(),
          this.getCurrentSample().getUser(),
          newName
        ]
      );
    },


    /**
     * Helper to update the directory, e.g., when showing versions changes
     */
    __onUpdateDirectory : function(e) 
    {
      // Issue a request for the user's directory listing.
      playground.ServerOp.rpc(
        // success handler
        function(result, id)
        {
          this._displayDirectoryListing(result);
        }.bind(this),

        // failure handler
        function(ex, id)
        {
          // Ignore the failure. Should not ever occur.
          console.log("FAILED to get directory listing: " + ex);
        }.bind(this),

        // function to call
        "getDirectoryListing",
        
        // arguments
        [ e.getData() ]         // filename for versions, or null
      );
    },


    /**
     * Helper to toggle the editors split pane which means togglinge the
     * visibility of the editor and the samples pane.
     */
    _onToggleMaximize : function() {
      this.__maximized = !this.__maximized;
      if (this.__maximized) {
        this.__editorsplit.exclude();
      } else {
        this.__editorsplit.show();
      }
    },


    // ***************************************************
    // TOOLBAR HANDLER
    // ***************************************************
    /**
     * Handler for sample changes of the toolbar.
     * @param e {qx.event.type.Data} Data event containing the boolean
     * weather the examples should be shown.
     */
    __onSampleChange : function(e) {
      qx.bom.Cookie.set("playgroundShowExamples", e.getData(), 100);
      if (e.getData()) {
        this.__samplesPane.show();
      } else {
        this.__samplesPane.exclude();
      }
    },


    /**
     * Handler for the changeHighlight event of the toolbar.
     * @param e {qx.event.type.Data} Data event containing the boolean to change
     *   the highlighted code view.
     */
    __onHighlightChange : function(e) {
      qx.bom.Cookie.set("playgroundHighlight", e.getData(), 100);
      this.editor.useHighlight(e.getData());
    },


    /**
     * Handler for showing the log of the toolbar.
     * @param e {qx.event.type.Data} Data event containing if the log should
     *   be shown.
     */
    __onLogChange : function(e) {
      e.getData() ? this.__log.show() : this.__log.exclude();
    },


    /**
     * Handler for the url shortening service.
     */
    __onUrlShorten : function() {
      window.open(
        "http://tinyurl.com/create.php?url=" + encodeURIComponent(location.href),
        "tinyurl",
        "width=800,height=600,resizable=yes,scrollbars=yes"
      );
    },


    /**
     * Handler for opening the api viewer.
     */
    __onApiOpen : function() {
      window.open(
        "http://demo.qooxdoo.org/" +
        qx.core.Environment.get("qx.version") +
        "/apiviewer/"
      );
    },


    /**
     * Handler for opening the manual.
     */
    __onManualOpen : function() {
      window.open(
        "http://manual.qooxdoo.org/" + qx.core.Environment.get("qx.version")
      );
    },


    /**
     * Handler for opening the demo browser.
     */
    __onDemoBrowser : function() {
      window.open(
        "http://demo.qooxdoo.org/" +
        qx.core.Environment.get("qx.version") +
        "/demobrowser/"
      );
    },

    // ***************************************************
    // HISTORY SUPPORT
    // ***************************************************
    /**
     * Back button and bookmark support
     */
    __initBookmarkSupport : function()
    {
      this.__history = qx.bom.History.getInstance();
/* djl...
      this.__history.addListener("changeState", this.__onHistoryChanged, this);

      // Handle bookmarks
      var state = this.__history.getState();
      var name = state.replace(/_/g, " ");

      var code = "";

      // checks if the state corresponds to a sample. If yes, the application
      // will be initialized with the selected sample
      if (state && this.__samples.isAvailable(state))
      {
        var sample = this.__samples.get(state);
        this.setCurrentSample(sample);
        return;

      // check if a mode is given
      } else if (state.indexOf("mode=") == 0) {
        var mode = state.substring(5, state.length);
        if (mode == "mobile") {
          // try to set the mobile mode but if its not supported, take ria
          try {
            this.setMode("mobile");
          } catch (e) {
            this.setMode("ria");
          }
        } else {
          this.setMode("ria");
        }
        var sample = this.__samples.getFirstSample(this.__mode);
        this.setCurrentSample(sample);
        return;

      // if there is a state given
      } else if (state && state.charAt(0) == "{") {
        var name = this.tr("Custom Code");
        code = this.__parseURLCode(state);
        // need to get the code from the editor in case he changes something
        // in the code
        this.editor.setCode(code);
        this.setOriginCode(this.editor.getCode());

        // try to select a custom sample
        this.__samplesPane.selectByCode(code);

        this.setName(name);
        this.run();

      // if no state is given
      } else {
        var sample = this.__samples.getFirstSample(this.__mode);
        this.setCurrentSample(sample);
        return;
      }
*/
    },


    /**
     * Handler for changes of the history.
     * @param e {qx.event.type.Data} Data event containing the history changes.
     */
    __onHistoryChanged : function(e)
    {
      var state = e.getData();

      // is a sample name given
      if (this.__samples.isAvailable(state))
      {
        var sample = this.__samples.get(state);
        if (this.isCodeNotEqual(sample.getCode(), this.editor.getCode())) {
          this.setCurrentSample(sample);
        }

      // is code given
      } else if (state != "") {
        var code = this.__parseURLCode(state);
        if (code != this.editor.getCode()) {
          this.editor.setCode(code);
          this.setName(this.tr("Custom Code"));
          this.run();
        }
      }
    },


    /**
     * Helper method for parsing the given url parameter to a valid code
     * fragment.
     * @param state {String} The given state of the browsers history.
     * @return {String} A valid code snippet.
     */
    __parseURLCode : function(state)
    {
      try {
        var data = qx.lang.Json.parse(state);
        // change the mode in case a different mode is given
        if (data.mode && data.mode != this.__mode) {
          this.setMode(data.mode);
        }
        return decodeURIComponent(data.code).replace(/%0D/g, "");
      } catch (e) {
        var error = this.tr("// Could not handle URL parameter! \n// %1", e);

        if (qx.core.Environment.get("engine.name") == "mshtml") {
          error += this.tr("// Your browser has a length restriction of the " +
                          "URL parameter which could have caused the problem.");
        }
        return error;
      }
    },


    /**
     * Adds the given code to the history.
     * @param code {String} the code to add.
     *
     * @lint ignoreDeprecated(confirm)
     */
    addCodeToHistory : function(code) {
      var codeJson =
        '{"code":' + '"' + encodeURIComponent(code) + '", "mode":"' + this.__mode + '"}';
      if (qx.core.Environment.get("engine.name") == "mshtml" && codeJson.length > 1300) {
        if (!this.__ignoreSaveFaults && confirm(
          this.tr("Cannot append sample code to URL, as it is too long. " +
                  "Disable this warning in the future?"))
        ) {
          this.__ignoreSaveFaults = true;
        };
        return;
      }
      this.__history.addToHistory(codeJson);
    },


    // ***************************************************
    // UPDATE & RUN & COMPARE
    // ***************************************************
    /**
     * Checcks if the code is changed. If that is the case, the user will be
     * prompted to discard the changes.
     *
     * @return {Boolean} <code>true</code> if the code has been modified
     *
     * @lint ignoreDeprecated(confirm)
     */
    __discardChanges : function() {
      var             model;
      
      // Get the current set of files
      model = this.__samplesPane.getModel();

      return false;

/*
      var userCode = this.editor.getCode();
      if (userCode && this.isCodeNotEqual(userCode, this.getOriginCode()))
      {
        if (!confirm(this.tr("Click OK to discard your changes.")))
        {
          return true;
        }
      }
      return false;
*/
    },


    /**
     * Special compare method for IE.
     * @param code1 {String} The first code to compare.
     * @param code2 {String} The second code to compare.
     * @return {Boolean} true, if the code is equal.
     */
    isCodeNotEqual : function(code1, code2)
    {
      if (qx.core.Environment.get("engine.name") == "opera") {
        code1 = code1.replace(/\r?\n/g, "\n");
        code2 = code2.replace(/\r?\n/g, "\n");
        return code1 != code2;
      }

      var compareElem1 = document.getElementById("compare_div1");
      compareElem1.innerHTML = code1;

      var compareElem2 = document.getElementById("compare_div2");
      compareElem2.innerHTML = code2;

      return (compareElem1.innerHTML.length != compareElem2.innerHTML.length ||
        compareElem1.innerHTML != compareElem2.innerHTML);
    },


    /**
     * Update the window title with given sample label
     * @param label {String} sample label
     * @return {String} new window title
     */
    __updateTitle : function(label) {
      var title = document.title.split(":")[0] + ": " + label;
      return title;
    },


    /**
     * Updates the playground.
     */
    __updatePlayground : function()
    {
      if (! this.__playArea) {
        return;
      }

      this.__log.clear();
      this.__playArea.reset(this.__beforeReg, this.__afterReg, this.__oldCode);

      var reg = qx.Class.$$registry;
      delete reg[this.__currentStandalone];

      // build the code to run
      var code = this.editor.getCode();
      // special replacement for unicode "zero width space" [BUG #3635]
      code = code.replace("\u200b", "");
      code = 'this.info("' + this.tr("Starting application").toString() +
        " '" + this.getName() + "'" + ' ...");\n' +
        (code || "") +
        'this.info("' + this.tr("Successfully started").toString() + '.");\n';

      // try to create a function
      try {
        this.__oldCode = code;
        this.fun = new Function(code);
      } catch(ex) {
        var exc = ex;
      }

      // run the code
      try {
        // save the current registry
        qx.ui.core.queue.Manager.flush();
        this.__beforeReg = qx.lang.Object.clone(qx.core.ObjectRegistry.getRegistry());

        // run the application
        this.fun.call(this.__playArea.getApp());
        qx.ui.core.queue.Manager.flush();
        this.__afterReg = qx.lang.Object.clone(qx.core.ObjectRegistry.getRegistry());
      } catch(ex) {
        var exc = ex;
      }

      // store the new standalone app if available
      for(var name in reg)
      {
        if(this.__isAppClass(name))
        {
          this.__currentStandalone = name;
          this.__executeStandaloneApp(name);
          break;
        }
      }

      // error handling
      if (exc) {
        this.error(this.__errorMsg.replace(/\|/g, "\n") + exc);
        this.__toolbar.showLog(true);
        this.__log.show();
        this.__playArea.reset(this.__beforeReg, this.__afterReg, this.__oldCode);
      }

      this.__log.fetch();
    },


    /**
     * Mark an error in the editor
     * @ignore(ace.require)
     */
    showError : function(location, message, type)
    {
      var             r;
      var             annotations;
      var             application = qx.core.Init.getApplication();
      var             editor = this.editor;
      var             Range = ace.require("ace/range").Range;

      // Highlight the region of text near the error
      r = new Range(location.first_line - 1,
                    location.first_column - 4,
                    location.last_line - 1,
                    location.last_column); // extended one position wider
      editor.addMarker(r, "ace_error-marker", "text", false);

      // Add an annotation in the gutter for this error.
      annotations = editor.getAnnotations();
      annotations.push(
        {
          row    : location.first_line - 1,
          column : location.first_column - 1,
          text   : "! " + message,
          type   : type || "warning"
        });
      editor.setAnnotations(annotations);

      // Be sure that the first error line is visible
      if (this.__bFirstError)
      {
        editor.scrollToLine(location.first_line);
      }
      
      // If this is a run-time error (i.e., not a syntax error, as would be
      // indicated by the "type" parameter being defined) and so requested,
      // show the memory view automatically. Don't issue a status report for
      // it, though, prevented by memoryViewButtonInternalSet
      if (! type && application.getUserData("openOnError").getValue())
      {
        // Since the normal status message won't be sent, create our own,
        // special one to show that we're automatically opening the memory
        // view.
        if (! application.getUserData("memoryViewButton").getValue())
        {
          playground.ServerOp.statusReport(
            {
              type             : "show_memory_view",
              show_memory_view : "automatic via error"
            });
        }
        
        // Automatically display the memory view now, without sending the
        // normal status report.
        application.setUserData("memoryViewButtonInternalSet", true);
        application.getUserData("memoryViewButton").setValue(true);
        application.setUserData("memoryViewButtonInternalSet", false);
      }

      // The next encountered error is not the first one
      this.__bFirstError = false;
    },

    clearErrors : function()
    {
      var             editor = this.editor;

      // Clear the gutter annotations
      editor.setAnnotations([]);
      
      // Clear the error highlights
      editor.removeAllMarkers(false);
      
      // Clear the indicator that we've scrolled to the first error
      this.__bFirstError = true;
    },

    /**
     * Runs the current set sample and checks if it need to be saved to the url.
     *
     * @param e {qx.event.type.Event} A possible events (unused)
     *
     * @ignore(require)
     */
    run : function(e)
    {
      // turn off versions
      this.__samplesPane._versions.setValue(false);

      var code = this.editor.getCode();
      if (code && this.isCodeNotEqual(code, this.getOriginCode())) {
        this.addCodeToHistory(code);
/* djl...
        if (!this.__modified) {
          this.setName(this.tr("%1 (modified)", this.getName()));
        }
*/
        this.__modified = true;
      }

      // Reset and exclude the graphics terminal each time the program is
      // run. If it's needed, it'll get re-included by the #include that
      // requires it
      var terminal = qx.core.Init.getApplication().getUserData("terminal");
      terminal.resetGraphicsCanvas();
      terminal.getGraphicsCanvas().exclude();
      
      playground.c.Main.output("", true);
      this.clearErrors();

      // We need an initial attempt at requiring ansic.js, which fails much
      // of the time. The next require of the same file will then succeed.
      try
      {
        require(
          ["resource/playground/script/ansic.js"],
          function(ansi)
          {
          });
      }
      catch (e2)
      {
        console.log("Pre-load of ansic.js: " + e);
      }

      function handleError(e)
      {
        var             line;
        var             hint;
        var             message;
        var             button;
        var             developer = false;

        if (e instanceof playground.c.lib.RuntimeError)
        {
          line = e.node.line;
          hint = e.message;
          message =
            "Error near line " + line + ": " + hint + "\n";
        }
        else
        {
          // currentNode may not yet exist (e.g., preprocessor)
          try
          {
            line = playground.c.lib.Node._currentNode.line;
          }
          catch(e2)
          {
            // Ignore preprocessor errors, other than logging them
            console.log("Ignoring error without line number: " + e);
            return;
          }
          hint = e + "\n" + e.stack;
          message =
            "[1]Internal error near line " +
            playground.c.lib.Node._currentNode.line +
            ": " + hint + "\n";
          
          // Send internal errors to the developer
          developer = true;
        }

        // Send the error message as a status report
        playground.c.Main._statusReport(
          {
            type       : "exit_crash",
            exit_crash : message,
            developer  : developer
          });

        // Show the error in the editor
        try
        {
          qx.core.Init.getApplication().showError(
            {
              first_line   : line,
              first_column : 0,
              last_line    : line,
              last_column  : 9999
            },
            message);
        }
        catch(e2)
        {
          // fails in non-gui environment
        }

        playground.c.Main.output(e);

        // Set the program state
        this.setProgramState("crashed");
      }

      try
      {
        playground.c.lib.Preprocessor.preprocess(
          code,
          function(preprocessedCode)
          {
            require(
              ["resource/playground/script/ansic.js"],
              function(ansic)
              {
                try
                {
                  playground.c.Main.main(ansic);
                  ansic.parse(preprocessedCode);
                }
                catch (e2)
                {
                  console.log("Ignoring (irrelevant?) error: " + e2);
//                  handleError(e2);
                }
              });
          }.bind(this));
      }
      catch(e2)
      {
        console.log("Preprocess attempt to load ansic.js: " + e2);
        handleError(e2);
      }
    },


    /**
     * Handler for global errors.
     * 
     * @param e {Event} The global error event
     */
    __onGlobalError : function(e) {
      this.error(e);
    },

    // ***************************************************
    // STANDALONE SUPPORT
    // ***************************************************

    /**
     * Determines whether the class (given by name) exists in the object
     * registry and is a qooxdoo application class.
     *
     * @param name {String} Name of the class to examine
     * @return {Boolean} Whether it is a registered application class
     */
    __isAppClass : function(name)
    {
      if (name === "playground.Application") {
        return false;
      }
      var clazz = qx.Class.$$registry[name];
      // ria mode supports standalone applications
      if (this.__mode == "ria") {
        return (
          clazz && clazz.superclass &&
          clazz.superclass.classname === "qx.application.Standalone"
        )
      // mobile mode supports mobild applications
      } else if (this.__mode == "mobile") {
        return (
          clazz && clazz.superclass &&
          clazz.superclass.classname === "qx.application.Mobile"
        )
      }
      return false;
    },


    /**
     * Execute the class (given by name) as a standalone app
     *
     * @param name {String} Name of the application class to execute
     */
    __executeStandaloneApp : function(name)
    {
      var self = this;
      qx.application.Standalone.prototype._createRootWidget = function() {
        return self.__playArea.getApp().getRoot();
      };

      var app = new qx.Class.$$registry[name];

      try {
        app.main();
        qx.ui.core.queue.Manager.flush();
      } catch(ex) {
        var exc = ex;
        this.error(this.__errorMsg.replace(/\|/g, "\n") + exc);
      }
    }
  },


  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
   */

  destruct : function()
  {
    this.__history = this.__beforeReg = this.__afterReg = null;
    this._disposeObjects(
      "__currentStandalone", "__samples", "__toolbar", "editor",
      "__playArea", "__log"
    );
  }
});
