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
 * Container for the source code editor.
 * 
 * @asset(playground/*)
 */
qx.Class.define("playground.view.Editor",
{
  extend : qx.ui.container.Composite,
  include : qx.ui.core.MBlocker,

  statics : {
    loadAce : function(clb, ctx) {
      if (false) { // no longer necessary...
        var resource = [
          "playground/editor/ace.js",
          "playground/editor/theme-eclipse.js",
          "playground/editor/mode-c_cpp.js"
//djl        "playground/editor/mode-javascript.js"
        ];
        var load = function(list) {
          if (list.length == 0) {
            clb.call(ctx);
            return;
          }
          var res = list.shift();
          var uri = qx.util.ResourceManager.getInstance().toUri(res);
          var loader = new qx.bom.request.Script();
          loader.onload = function() {
            load(list);
          };
          loader.open("GET", uri);
          loader.send();
        };
        load(resource);
      }
      else
      {
        // Call the callback immediately
        clb.call(ctx);
      }
    }
  },


  construct : function()
  {
    this.base(arguments);
  },


  events :
  {
    /**
     * Event for signaling that the highlighting could not be done by the editor.
     */
    "disableHighlighting" : "qx.event.type.Event"
  },


  members :
  {
    __textarea : null,
    __highlighted : null,
    __editor : null,
    __ace : null,
    __errorLabel : null,

    /**
     * The constructor was spit up to make the included mixin available during
     * the init process.
     */
    init: function()
    {
      this.setBackgroundColor("white");

      this.addListenerOnce("appear", function() {
        // If widgets are added to the container, the zIndex of the editor
        // blocker is set to 100. This makes possible to resize the splitpanes
        this.addListener("addChildWidget", function() {
          this.getBlocker().getBlockerElement().setStyles({ "zIndex" : 100 });
        }, this);
      }, this);

      // layout stuff
      var layout = new qx.ui.layout.VBox();
      this.setLayout(layout);
      this.setDecorator("main");

      // caption
      var dec = new qx.ui.decoration.Decorator().set({
          widthBottom : 1,
          colorBottom : "border-separator"
        });
      var caption = new qx.ui.container.Composite().set({
        padding    : 5,
        allowGrowX : true,
        allowGrowY : true,
        backgroundColor: "white",
        decorator  : dec
      });
      this.add(caption);
      // configure caption
      caption.setLayout(new qx.ui.layout.HBox(10));
/*
      caption.add(new qx.ui.basic.Label(this.tr("Source Code")).set({font: "bold"}));
*/
      this.__errorLabel = new qx.ui.basic.Label().set({textColor: "red"});
      caption.add(this.__errorLabel);

      // plain text area
      this.__textarea = new qx.ui.form.TextArea().set({
        wrap      : false,
        font      : qx.bom.Font.fromString("14px monospace"),
        backgroundColor: "white",
        padding   : [0,0,0,5],
        decorator : null
      });
      this.add(this.__textarea, { flex : 1 });

      this.__editor = new qx.ui.core.Widget();
      var highlightDisabled = false;
      var badIE = qx.core.Environment.get("engine.name") == "mshtml";
      if (badIE) {
        badIE = parseFloat(qx.core.Environment.get("browser.version")) <= 8 ||
          qx.core.Environment.get("browser.documentmode") <= 8;
      }

      var opera = qx.core.Environment.get("engine.name") == "opera";

      // FF2 does not have that...
      if (!document.createElement("div").getBoundingClientRect || badIE || opera) {
        this.fireEvent("disableHighlighting");
        highlightDisabled = true;
      } else {
        this.__editor.addListenerOnce("appear", function() {
          this.__onEditorAppear();
        }, this);
      }
      this.__editor.setVisibility("excluded");
      this.add(this.__editor, { flex : 1 });

      // override the focus border CSS of the editor
      qx.bom.Stylesheet.createElement(
        ".ace_editor {border: 0px solid #9F9F9F !important;}"
      );
      
      // Provide a style for the breakpoint indicator
      qx.bom.Stylesheet.createElement(
        ".ace_gutter-cell.ace_breakpoint{" +
          "background-image:" +
          " url('resource/playground/images/breakpoint.png');" +
          "background-position: 4px center;"
      );

      // Provide a style for an error indicator.
      // NOTE: This one is marked as !important so that it overrides breakpoint
      qx.bom.Stylesheet.createElement(
        ".ace_gutter-cell.ace_error{" +
          "background-image:" +
          " url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAABOFBMVEX/////////QRswFAb/Ui4wFAYwFAYwFAaWGAfDRymzOSH/PxswFAb/SiUwFAYwFAbUPRvjQiDllog5HhHdRybsTi3/Tyv9Tir+Syj/UC3////XurebMBIwFAb/RSHbPx/gUzfdwL3kzMivKBAwFAbbvbnhPx66NhowFAYwFAaZJg8wFAaxKBDZurf/RB6mMxb/SCMwFAYwFAbxQB3+RB4wFAb/Qhy4Oh+4QifbNRcwFAYwFAYwFAb/QRzdNhgwFAYwFAbav7v/Uy7oaE68MBK5LxLewr/r2NXewLswFAaxJw4wFAbkPRy2PyYwFAaxKhLm1tMwFAazPiQwFAaUGAb/QBrfOx3bvrv/VC/maE4wFAbRPBq6MRO8Qynew8Dp2tjfwb0wFAbx6eju5+by6uns4uH9/f36+vr/GkHjAAAAYnRSTlMAGt+64rnWu/bo8eAA4InH3+DwoN7j4eLi4xP99Nfg4+b+/u9B/eDs1MD1mO7+4PHg2MXa347g7vDizMLN4eG+Pv7i5evs/v79yu7S3/DV7/498Yv24eH+4ufQ3Ozu/v7+y13sRqwAAADLSURBVHjaZc/XDsFgGIBhtDrshlitmk2IrbHFqL2pvXf/+78DPokj7+Fz9qpU/9UXJIlhmPaTaQ6QPaz0mm+5gwkgovcV6GZzd5JtCQwgsxoHOvJO15kleRLAnMgHFIESUEPmawB9ngmelTtipwwfASilxOLyiV5UVUyVAfbG0cCPHig+GBkzAENHS0AstVF6bacZIOzgLmxsHbt2OecNgJC83JERmePUYq8ARGkJx6XtFsdddBQgZE2nPR6CICZhawjA4Fb/chv+399kfR+MMMDGOQAAAABJRU5ErkJggg==') !important;" +
          "background-position: 4px center;"
      );

      // Similarly, provide a style for a warning indicator.
      // NOTE: This one is marked as !important so that it overrides breakpoint
      qx.bom.Stylesheet.createElement(
        ".ace_gutter-cell.ace_warning{" +
          "background-image:" +
          " url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAmVBMVEX///8AAAD///8AAAAAAABPSzb/5sAAAAB/blH/73z/ulkAAAAAAAD85pkAAAAAAAACAgP/vGz/rkDerGbGrV7/pkQICAf////e0IsAAAD/oED/qTvhrnUAAAD/yHD/njcAAADuv2r/nz//oTj/p064oGf/zHAAAAA9Nir/tFIAAAD/tlTiuWf/tkIAAACynXEAAAAAAAAtIRW7zBpBAAAAM3RSTlMAABR1m7RXO8Ln31Z36zT+neXe5OzooRDfn+TZ4p3h2hTf4t3k3ucyrN1K5+Xaks52Sfs9CXgrAAAAjklEQVR42o3PbQ+CIBQFYEwboPhSYgoYunIqqLn6/z8uYdH8Vmdnu9vz4WwXgN/xTPRD2+sgOcZjsge/whXZgUaYYvT8QnuJaUrjrHUQreGczuEafQCO/SJTufTbroWsPgsllVhq3wJEk2jUSzX3CUEDJC84707djRc5MTAQxoLgupWRwW6UB5fS++NV8AbOZgnsC7BpEAAAAABJRU5ErkJggg==') !important;" +
          "background-position: 4px center;"
      );

      // Provide a style for the current line when stopped at a breakpoint
      qx.bom.Stylesheet.createElement(
        ".ace_gutter-cell.current-line{" +
          "border-radius: 0px 20px 20px 0px;" +
          "box-shadow: 0px 0px 1px 1px red inset;}"
      );

      // chech the initial highlight state
      var shouldHighligth = qx.bom.Cookie.get("playgroundHighlight") !== "false";
      // djl...
      shouldHighligth = true;
      
      this.useHighlight(!highlightDisabled && shouldHighligth);
    },


    /**
     * This code part uses the ajax.org code editor library to add a
     * syntax-highlighting editor as an textarea replacement
     *
     * @ignore(ace.edit, require)
     */
    __onEditorAppear : function() {
      // timout needed for chrome to not get the ACE layout wrong and show the
      // text on top of the gutter
      qx.event.Timer.once(
        function() {
          var container = this.__editor.getContentElement().getDomElement();

          // create the editor
          var editor = this.__ace = ace.edit(container);

          // configure the editor
          var session = editor.getSession();
          session.setUseSoftTabs(true);
          session.setTabSize(4);

          // Use \n as the line ending in the editor
          session.setNewLineMode("unix");

          // set C mode
          session.setMode("ace/mode/c_cpp");

          // Set the theme
          editor.setTheme("ace/theme/eclipse");

          // Enable special behaviors, e.g., auto-paring of characters
          editor.setBehavioursEnabled(true);
          editor.setDisplayIndentGuides(true);
          editor.setHighlightActiveLine(false);

          // When the Run button is disabled (meaning the program is running),
          // set the editor to read-only. When the Run button is re-enabled,
          // set the editor back to read-write.
          var butRun = qx.core.Init.getApplication().getUserData("runButton");
          
          var setShowReadOnly = function(bReadOnly)
          {
            editor.setReadOnly(bReadOnly);
            this.setBackgroundColor(bReadOnly ? "#ffdddd" : "white");
          }.bind(this);

          butRun.addListener(
            "changeEnabled", 
            function(e)
            {
              setShowReadOnly(! e.getData());
            });
          
          // The program may already be running. Set read-only accordingly
          setShowReadOnly(! butRun.getEnabled());

          // djl: Keep breakpoints with their line even when other lines are
          // inserted or deleted.
          // This is based on code from:
          // https://github.com/MikeRatcliffe/Acebug/
          //    blob/master/chrome/content/ace++/startup.js#L66-104
          var updateDataOnDocChange = function(e) 
          {
            var             delta = e.data;
            var             range = delta.range;
            var             len;
            var             firstRow;
            var             args;
            var             rem;
            var             oldBP;
            var             i;
            
            if (range.end.row == range.start.row) {
              return;
            }

            if (delta.action == "insertText") {
              len = range.end.row - range.start.row;
              firstRow = 
                range.start.column == 0 ? range.start.row: range.start.row + 1;
            } else if (delta.action == "insertLines") {
              len = range.end.row - range.start.row;
              firstRow = range.start.row;
            } else if (delta.action == "removeText") {
              len = range.start.row - range.end.row;
              firstRow = range.start.row;
            } else if (delta.action == "removeLines") {
              len = range.start.row - range.end.row;
              firstRow = range.start.row;
            }

            // Retrieve the breakpoint list. This is session's INTERNAL list,
            // so we can modify it and simply emit the changeBreakpoint event
            // to have it fully updated.
            var breakpoints = session.getBreakpoints();

            if (len > 0) {
              args = Array(len);
              args.unshift(firstRow, 0);
              breakpoints.splice.apply(breakpoints, args);
            } else if (len < 0) {
              rem = breakpoints.splice(firstRow + 1, -len);

              if(! breakpoints[firstRow]) {
                for (i = 0; i < rem.length; i++) {
                  oldBP = rem[i];
                  if (oldBP) {
                    breakpoints[firstRow] = oldBP;
                    break;
                  }
                }
              }
            }

            session._emit("changeBreakpoint", {});
          };

          session.doc.on("change", updateDataOnDocChange);

          // track changes in the editor
          editor.on(
            "change",
            function(e)
            {
/*
              // Generate a status report showing text changes in the editor.
              playground.ServerOp.statusReport(
                {
                  type          : "editor_change",
                  change_action : e.data.action,
                  change_start  : 
                    [
                      e.data.range.start.row + 1,
                      e.data.range.start.column + 1
                    ],
                  change_end    :
                    [
                      e.data.range.end.row + 1,
                      e.data.range.end.column + 1
                    ],
                  change_text   : e.data.text,
                  snapshot      : qx.core.Init.getApplication().editor.getCode()
                });
*/
            });

          // enable/disable breakpoints by click in gutter
          editor.on(
            "guttermousedown", 
            function(e)
            {
              var target = e.domEvent.target;
              if (target.className.indexOf("ace_gutter-cell") == -1)
              {
                return;
              }
              if (!editor.isFocused())
              {
                return;
              }
              if (e.clientX > 25 + target.getBoundingClientRect().left)
              {
                return;
              }

              // 'session' is in e.editor.session, but we have it already

              var row = e.getDocumentPosition().row;
              var value;
              
              // Is there already a breakpoint on this line?
              if (! session.getBreakpoints()[row])
              {
                // Nope. Set one.
                session.setBreakpoint(row);
                value = "on";
              }
              else
              {
                // There is already a breakpoint here. Clear it.
                session.clearBreakpoint(row);
                value = "off";
              }
              
              // Generate a status report showing breakpoint change
              playground.ServerOp.statusReport(
                {
                  type             : "breakpoint_change",
                  breakpoint_row   : row + 1, // make 1-relative
                  breakpoint_value : value,

                  // map non-null to row #, then filter out formerly null values
                  breakpoints      : session.getBreakpoints().map(
                    function(elem, index)
                    {
                      return !!elem ? index + 1 : 0;
                    }).filter(
                      function(elem)
                      {
                        return elem !== 0;
                      })
                });
              
              e.stop();
            });

          // copy the inital value
          session.setValue(this.__textarea.getValue() || "");

          var self = this;
          // append resize listener
          this.__editor.addListener("resize", function() {
            // use a timeout to let the layout queue apply its changes to
            // the dom
            window.setTimeout(function() {
              self.__ace.resize();
            }, 0);
          });
      }, this, 500);
    },


    /**
     * Add a gutter decoration
     */
    addGutterDecoration : function(row, className)
    {
      if (this.__ace)
      {
        this.__ace.getSession().addGutterDecoration(row, className);
      }
    },
    
    /**
     * Remove a gutter decoration
     */
    removeGutterDecoration : function(row, className)
    {
      if (this.__ace)
      {
        this.__ace.getSession().removeGutterDecoration(row, className);
      }
    },

    /**
     * Add a marker (typically for showing the location of an error)
     */
    addMarker : function(range, clazz, type, bInFront)
    {
      if (this.__ace)
      {
        return this.__ace.getSession().addMarker(range, clazz, type, bInFront);
      }
      
      return null;
    },

    /**
     * Set the annotation list
     */
    setAnnotations : function(annotations)
    {
      if (this.__ace)
      {
        this.__ace.getSession().setAnnotations(annotations);
      }
    },

    /**
     * Remove a marker
     */
    removeMarker : function(markerId)
    {
      if (this.__ace)
      {
        this.__ace.getSession().removeMarker(markerId);
      }
    },

    /**
     * Remove all markers
     */
    removeAllMarkers : function(bInFront)
    {
      var             markers;
      var             session = this.__ace.getSession();

      if (this.__ace)
      {
        markers = session.getMarkers(bInFront);
        Object.keys(markers).forEach(
          function(marker)
          {
            session.removeMarker(markers[marker].id);
          });
      }
    },

    /**
     * Returns the current set of breakpoints
     * 
     * @return {Array}
     *   An array containing a truthy value in each element corresponding to a
     *   line that has a breakpoint set.
     */
    getBreakpoints : function() {
      if (this.__ace)
      {
        return this.__ace.getSession().getBreakpoints();
      }
      
      return [];
    },

    /**
     * Set a breakpoint
     * 
     * @param line {Number}
     *   Line number of breakpoint to set
     */
    setBreakpoint : function(line)
    {
      this.__ace.getSession().setBreakpoint(line);
    },

    /**
     * Clear a breakpoint
     * 
     * @param line {Number}
     *   Line number of breakpoint to clear
     */
    clearBreakpoint : function(line)
    {
      this.__ace.getSession().clearBreakpoint(line);
    },

    /**
     * Clear all breakpoints
     */
    clearBreakpoints : function()
    {
      this.__ace.getSession().clearBreakpoints();
    },

    /**
     * Scroll to a specified line
     * 
     * @param line {Number}
     *   The line to scroll to
     */
    scrollToLine : function(line) {
      this.__ace.scrollToLine(
        line,
        true,
        true,
        function()
        {
          // animation has completed. do nothing, though.
        });
    },

    /**
     * Returns the current set code of the editor.
     * @return {String} The current set text.
     */
    getCode : function() {
      if (this.__highlighted && this.__ace) {
        return this.__ace.getSession().getValue();
      } else {
        return this.__textarea.getValue();
      }
    },


    /**
     * Sets the given code to the editor.
     * @param code {String} The new code.
     */
    setCode : function(code) {
      if (this.__ace) {
        this.__ace.getSession().setValue(code);

        // move cursor to start to prevent scrolling to the bottom
        this.__ace.renderer.scrollToX(0);
        this.__ace.renderer.scrollToY(0);
        this.__ace.selection.moveCursorFileStart();
      }
      this.__textarea.setValue(code);
    },


    /**
     * Displays the given error in the caption bar.
     * @param ex {Exception} The exception to display.
     */
    setError : function(ex) {
      this.__errorLabel.setValue(ex ? ex.toString() : "");
    },


    /**
     * Switches between the ajax code editor editor and a plain textarea.
     * @param value {Boolean} True, if the code editor should be used.
     */
    useHighlight : function(value) {
      this.__highlighted = value;

      if (value) {
        // change the visibility
        this.__editor.setVisibility("visible");
        this.__textarea.setVisibility("excluded");

        // copy the value, if the editor already availabe
        if (this.__ace) {
          this.__ace.getSession().setValue(this.__textarea.getValue());
        }
      } else {
        // change the visibility
        this.__editor.setVisibility("excluded");
        this.__textarea.setVisibility("visible");

        // copy the value, if the editor already availabe
        if (this.__ace) {
          this.__textarea.setValue(this.__ace.getSession().getValue());
        }
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
    this._disposeObjects("__textarea");
    this.__ace = null;
  }
});
