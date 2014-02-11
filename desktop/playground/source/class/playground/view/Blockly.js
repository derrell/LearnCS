/*
 * LearnCS!
 *
 * Copyright:
 *   2013 Derrell Lipman
 *
 * License:
 *   LGPL: http://www.gnu.org/licenses/lgpl.html
 *
 * Authors:
 *   Derrell Lipman
 */

/*
@asset(playground/*)
@ignore(require)
@ignore(Blockly.*)
@ignore(Blockly.Css.CONTENT)
@ignore(Blockly.Css.CONTENT.map)
@ignore(Blockly.Connection.prototype.checkType_)
*/



/**
 * Container for the Blockly code editor.
 *
 * @ignore(Blockly.*)
 */
qx.Class.define("playground.view.Blockly",
{
  extend : qx.ui.container.Composite,
  include : [ qx.ui.core.MBlocker ],

  statics : 
  {
    loadBlockly : function(callback, context) 
    {
      var             resources;
      var             load;
      
      resources = 
        [
          "playground/blockly/blockly_compressed.js",
          "playground/blockly/language/en/_messages.js",
          "playground/blockly/language/common/colour.js",
          "playground/blockly/language/common/control.js",
          "playground/blockly/language/common/lists.js",
          "playground/blockly/language/common/logic.js",
          "playground/blockly/language/common/math.js",
          "playground/blockly/language/common/procedures.js",
          "playground/blockly/language/common/text.js",
          "playground/blockly/language/common/variables.js"
        ];

      load = function(list) 
      {
        var             res;
        var             uri;
        var             loader;

        if (list.length == 0) 
        {
          callback.call(context);
          return;
        }

        res = list.shift();
        uri = qx.util.ResourceManager.getInstance().toUri(res);

        loader = new qx.bom.request.Script();
        loader.onload = function() 
        {
          load(list);
        };
        loader.open("GET", uri);
        loader.send();
      };
      
      load(resources);
    },
    
    /*
     * Add an input field if it doesn't exist and should;
     * Remove it if it exists but shouldn't.
     * 
     * @param inputName {String}
     */
    addRemoveInput : function(inputName, bExists, fAppendInput, insertBefore)
    {
      var             i;
      var             input;

      // See if the input field exists
      input = this.getInput(inputName);
      if (! bExists)
      {
        // If it currently does...
        if (input)
        {
          // ... then remove any child blocks, ...
          if (input.connection && input.connection.targetConnection)
          {
            input.connection.targetConnection.sourceBlock_.unplug(
              false, true);
          }

          // ... and then remove the input
          this.removeInput(inputName);
        }
      }
      else
      {
        // The function must include this input. If it currently doesn't..
        if (! input)
        {
          // ... then add it
          fAppendInput.call(this);

          // If it needs to go someplace other than the very end...
          if (insertBefore)
          {
            // Figure out where to insert it. Put it as low as possible.
            for (i = 0; i < insertBefore.length; i++)
            {
              if (this.getInput(insertBefore[i]))
              {
                this.moveInputBefore(inputName, insertBefore[i]);
                break;
              }
            }
          }
        }
      }
    },
    
    /**
     * List of registered blocks, ready to be insert into Blockly.Language
     */
    _registeredBlocks : [],

    /**
     * Register blocks which are to be added when the Blockly editor appears
     * 
     * @param blocks {Map}
     *   Map containing one entry for each block to be registered. The entries
     *   are complete block definitions, ready for insertion into
     *   Blockly.Language.
     */
    registerBlocks: function(blocks)
    {
      var             blockName;
      
      // For each block in the map...
      for (blockName in blocks)
      {
        // ... skip names always in a class' statics
        if ([
              "$$type", "$$original", 
              "classname", "basename",
              "toString", "superclass", "constructor"
            ].indexOf(blockName) != -1)
        {
          continue;
        }

        // Add other blocks to the array of registered blocks,
        // both as map entries and in the array
        playground.view.Blockly._registeredBlocks.push(
          playground.view.Blockly._registeredBlocks[blockName] = 
            {
              name   : blockName,
              config : blocks[blockName]
            });
      }
    }
  },

  members :
  {
    __textarea : null,
    __editor : null,
    __blockly : null,
    __errorLabel : null,

    /**
     * The constructor was split up to make the included mixin available
     * during the init process.
     *
     * @ignore(require)
     * @ignore(Blockly)
     * @ignore(Blockly.Css.CONTENT)
     * @ignore(Blockly.Css.CONTENT.map)
     * @ignore(Blockly.Connection.prototype.checkType_)
     */
    init: function()
    {
      var             layout;
      var             caption;
      var             forceLoad;

      // Force loading of blocks (by mentioning its name)
      forceLoad = playground.view.blocks.Blocks;

      this.setBackgroundColor("white");

      // If widgets are added to the container, the zIndex of the editor blocker
      // is set to 100. This makes possible to resize the splitpanes
      this.addListener(
        "addChildWidget", function() 
        {
          this.getBlocker().getBlockerElement().setStyles(
            {
              "zIndex" : 100 
            });
          this.getBlocker().getBlockerElement().setStyles({ "zIndex" : 100 });
        }, 
        this);

      // layout stuff
      layout = new qx.ui.layout.VBox();
      this.setLayout(layout);
      this.setDecorator("main");

      // caption
      caption = new qx.ui.container.Composite();
      caption.set(
        {
          padding    : 5,
          allowGrowX : true,
          allowGrowY : true,
          backgroundColor: "white"
        });
      this.add(caption);

      // configure caption
      caption.setLayout(new qx.ui.layout.HBox(10));
/*
      caption.add(new qx.ui.basic.Label(this.tr("Blocks")).set(
                    {
                      font: "bold"
                    }));
*/
      this.__errorLabel = new qx.ui.basic.Label().set({textColor: "red"});
      caption.add(this.__errorLabel);

      this.__editor = new qx.ui.core.Widget();
      this.__editor.setDecorator("separator-vertical");

      this.__editor.addListenerOnce(
        "appear",
        function() 
        {
          this.__onEditorAppear();
        },
        this);

      this.add(this.__editor, { flex : 1 });

      // Add a style so blockly resizes
      qx.bom.Stylesheet.createElement(
        ".blocklySvg {height: 100%; width: 100%;}"
      );
    },


    /**
     * Inject Blockly into the editor container
     *
     * @ignore(require)
     * @ignore(Blockly.*)
     */
    __onEditorAppear : function() 
    {
      // Allow time for DOM elements to be created
      qx.event.Timer.once(
        function() 
        {
          var container = this.__editor.getContentElement().getDomElement();

          // Reduce sizes of blocks
/*
          Blockly.BlockSvg.MIN_BLOCK_Y = 15;
          Blockly.BlockSvg.SEP_SPACE_X = 4;
          Blockly.BlockSvg.SEP_SPACE_Y = 4;
          Blockly.BlockSvg.TAB_HEIGHT = 10;
          Blockly.BlockSvg.TAB_WIDTH = 6;
          Blockly.BlockSvg.NOTCH_WIDTH = 20;
          Blockly.BlockSvg.CORNER_READIUS = 6;
          Blockly.BlockSvg.TITLE_HEIGHT = 12;
 */
 
          // Add each of the registered blocks
          playground.view.Blockly._registeredBlocks.forEach(
            function(blockInfo)
            {
              Blockly.Language[blockInfo.name] = blockInfo.config;
            });

          /*
          Blockly.JavaScript.function = function() 
          {
            var statements_local_variables = 
              Blockly.JavaScript.statementToCode(this, 'local variables');
            var statements_statements = 
              Blockly.JavaScript.statementToCode(this, 'statements');
            var function_name = this.getTitleValue('function_name');
            // TODO: Assemble JavaScript into code variable.
            var code = '...';
            // TODO: Change ORDER_NONE to the correct strength.
            return [code, Blockly.JavaScript.ORDER_NONE];
          };
          */


          /*
           * Redefine Blockly's checkType_ function to prevent promiscuous
           * blocks (those which do not specify a type) from connecting when
           * the other connection requires a specific type.
           *
           * We also, here, allow a function to be provided (instead of just a
           * string), for more sophisticated checks.
           */
          Blockly.Connection.prototype.checkType_ = function(otherConnection) 
          {
            if (false) {        // original code
              if (!this.check_ || !otherConnection.check_) {
                // One or both sides are promiscuous enough that anything will
                // fit.
                return true;
              }
            } else {            // djl code
              // allow connection if both blocks are promiscuous
              if (!this.check_ && !otherConnection.check_) {
                return true;
              }
              
              // disallow connection if only one block is promiscuous
              if ((!this.check_ && otherConnection.check_) ||
                  (this.check_ && !otherConnection.check_)) {
                return false;
              }
            }
            // Find any intersection in the check lists.
            for (var x = 0; x < this.check_.length; x++) {
              if (this.check_[x] instanceof Function) {
                if (this.check_[x].call(this, otherConnection)) {
                  return true;
                }
              } else {
                if (otherConnection.check_.indexOf(this.check_[x]) != -1) {
                  return true;
                }
              }
            }
            // No intersection.
            return false;
          };

          // Reduce default font sizes
          Blockly.Css.CONTENT =
            Blockly.Css.CONTENT.map(
              function(o)
              {
                if (o.indexOf("font-size") != -1)
                {
                  // All font sizes measured in points change to a fixed size
                  o = o.replace(/font-size *:.*pt/g, "font-size: 10pt");
                  
                  // All font sizes measured in pixels, except those of less
                  // than a desired pixel size, are reduced to that size
                  o = o.replace(
                    /font-size *:(.*)px/g, 
                    function(str, px)
                    {
                      var             desiredSize = 13;

                      // If already no larger than the desired size...
                      if (px <= desiredSize)
                      {
                        // ... then leave it as it is.
                        return str;
                      }
                      
                      // Reduce it to the desired size
                      return "font-size: " + desiredSize + "px";
                    });
                }
                
                return o;
              });

          // create the editor
          this.__blockly = 
            Blockly.inject(
              container, 
              {
                path    : "resource/playground/blockly/",
                toolbox : (
                  "<xml>" +
                  this._addRegisteredBlocks() + "</category>" +
                  "  <category name='Controls'>" +
                  "    <block type='if'></block>" +
                  "    <block type='controls_if'></block>" +
                  "    <block type='globals'></block>" +
                  "    <block type='declare'> " +
                  "      <value name='type'>" +
                  "        <block type='type'></block>" +
                  "      </value>" +
                  "    </block>" +
                  "    <block type='type'></block>" +
                  "    <block type='function'></block>" +
                  "    <block type='return_with_result'></block>" +
                  "    <block type='return_no_result'></block>" +
                  "    <block type='for_loop'></block>" +
                  "    <block type='do_while_loop'></block>" +
                  "  </category>" +
                  "  <category name='Others'>" +
                  "    <block type='logic_compare'></block>" +
                  "    <block type='math_number'></block>" +
                  "    <block type='math_arithmetic'></block>" +
                  "    <block type='text'></block>" +
                  "    <block type='text_print'></block>" +
                  "    <block type='procedures_defreturn' inline='false'>" +
                  "      <mutation>" +
                  "        <arg name='x'></arg>" +
                  "        <arg name='y'></arg>" +
                  "      </mutation>" +
                  "      <title name='NAME'>add</title>" +
                  "      <value name='RETURN'>" +
                  "        <block type='math_arithmetic' inline='true'>" +
                  "          <title name='OP'>ADD</title>" +
                  "          <value name='A'>" +
                  "            <block type='variables_get'>" +
                  "              <title name='VAR'>x</title>" +
                  "            </block>" +
                  "          </value>" +
                  "          <value name='B'>" +
                  "            <block type='variables_get'>" +
                  "              <title name='VAR'>y</title>" +
                  "            </block>" +
                  "          </value>" +
                  "        </block>" +
                  "      </value>" +
                  "    </block>" +
                  "  </category>"
                ),
                trashcan : true
              });

          // append resize listener
          this.__editor.addListener(
            "resize", function() 
            {
              // use a timeout to let the layout queue apply its changes to
              // the dom
              window.setTimeout(
                function() 
                {
                  Blockly.svgResize();
                }, 
                0);
            });
        }, 
        this,
        500);
    },


    /**
     * Add registered blocks by converting them to XML for inclusion
     * in the Blockly container.
     */
    _addRegisteredBlocks : function()
    {
      var             category = null;
      var             blockList;
      var             xml = [];

      // Sort the registered blocks by category
      blockList = 
        playground.view.Blockly._registeredBlocks.sort(
          function(a, b)
          {
            var             aCat = a.config.category || "a";
            var             bCat = b.config.category || "a";

            return aCat < bCat ? -1 : aCat > bCat ? 1 : 0;
          });

      blockList.forEach(
        function(blockInfo)
        {
          var             cat;

          // Get the category name
          cat = blockInfo.config.category;
          
          // If there's no category, don't add the block
          if (! cat)
          {
            return;
          }

          // If this is a new category...
          if (cat != category)
          {
            // If we were in a category already...
            if (category !== null)
            {
              // then end it
              xml.push("</category>");
            }

            // then assign this as the category
            category = cat;

            // Begin the new category
            xml.push("<category name='" + category + "'>");
          }

          // Add this block
          xml.push("<block type='" + blockInfo.name + "'>");
          if (blockInfo.config.embed)
          {
            xml.push("<value name='type'>");
            arguments.callee(
              playground.view.Blockly._registeredBlocks[blockInfo.config.embed]);
            xml.push("</value>");
          }
          xml.push("</block>");
        });

      return xml.join("\n");
    },


    /**
     * Converts the current blocks to code
     *
     * @param language {String}
     *   The language to which the blocks are to be converted, e.g.,
     *   "XML", "JavaScript" or "C"
     *
     * @return {String} 
     *   The current set text.
     *
     * @ignore(Blockly)
     * @ignore(Blockly.Xml)
     * @ignore(Blockly.Xml.domToText)
     * @ignore(Blockly.Xml.workspaceToDom)
     * @ignore(Blockly.Generator)
     * @ignore(Blockly.Generator.workspaceToCode)
     */
    getCode : function(language) 
    {
      if (this.__blockly)
      {
        // XML is handled specially.
        if (language == "XML")
        {
          return Blockly.Xml.domToText(
            Blockly.Xml.workspaceToDom(Blockly.mainWorkspace));
        }
        
        // It's a normal language. Generate the code.
        return Blockly.Generator.workspaceToCode(language);
      }
      else
      {
        return "";
      }
    },


    /**
     * Adds the given (XML-formatted) code to the editor.
     *
     * @param code {String} 
     *   XML text representing the blocks to be displayed
     *
     * @ignore(Blockly)
     * @ignore(Blockly.Xml)
     * @ignore(Blockly.Xml.domToWorkspace)
     * @ignore(Blockly.Xml.textToDom)
     */
    setCode : function(code) 
    {
      if (this.__blockly)
      {
        Blockly.Xml.domToWorkspace(Blockly.mainWorkspace,
                                   Blockly.Xml.textToDom(code));
      }
    },


    /**
     * Displays the given error in the caption bar.
     *
     * @param ex {Exception} 
     *   The exception to display.
     */
    setError : function(ex) 
    {
      this.__errorLabel.setValue(ex ? ex.toString() : "");
    }
  },


  destruct : function()
  {
    this._disposeObjects("__textarea");
    this.__blockly = null;
  }
});
