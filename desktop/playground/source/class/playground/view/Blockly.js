/*
 * qooxdoo - the new era of web development
 *
 * http://qooxdoo.org
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
#asset(playground/*)
#ignore(require)
#ignore(Blockly)
*/



/**
 * Container for the Blockly code editor.
 */
qx.Class.define("playground.view.Blockly",
{
  extend : qx.ui.container.Composite,
  include : qx.ui.core.MBlocker,

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
    }
  },


  construct : function()
  {
    this.base(arguments);
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
     * @lint ignoreUndefined(require)
     */
    init: function()
    {
      var             layout;
      var             caption;

      this.setBackgroundColor("white");

      // If widgets are added to the container, the zIndex of the editor blocker
      // is set to 100. This makes possible to resize the splitpanes
      this.addListener(
        "addChildWidget", function() 
        {
          this.getBlocker().getContentBlockerElement().setStyles(
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
     * @lint ignoreUndefined(Blockly,require)
     */
    __onEditorAppear : function() {
      // timout needed for chrome to not get the ACE layout wrong and show the
      // text on top of the gutter
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
 
          Blockly.Language["declare"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(32);
              this.appendDummyInput()
                  .appendTitle("declare variable");
              this.appendDummyInput()
                  .appendTitle(new Blockly.FieldTextInput("NAME"), "name");
              this.appendDummyInput()
                  .appendTitle("as");
              this.appendStatementInput("declarators");
              this.appendDummyInput()
                  .appendTitle("static")
                  .appendTitle(new Blockly.FieldCheckbox("FALSE"), "static");
              this.appendDummyInput()
                  .appendTitle("const")
                  .appendTitle(new Blockly.FieldCheckbox("FALSE"), "const");
              this.appendDummyInput()
                  .appendTitle(" ");
              this.appendDummyInput()
                .appendTitle(new Blockly.FieldDropdown(
                               [
                                 ["char", "char"],
                                 ["short", "short"],
                                 ["int", "int"],
                                 ["long", "long"],
                                 ["long long", "long_long"],
                                 ["unsigned char", "unsigned_char"],
                                 ["unsigned short", "unsigned_short"],
                                 ["unsigned long", "unsigned_long"],
                                 ["unsigned long long", "unsigned_long_long"],
                                 ["float", "float"],
                                 ["double", "double"]
                               ]),
                             "ctype");
              this.setPreviousStatement(true);
              this.setNextStatement(true);
              this.setInputsInline(true);
              this.setTooltip('');
            }
          };

          Blockly.Language["pointer_to"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(40);
              this.appendDummyInput()
                  .appendTitle("pointer to");
              this.setPreviousStatement(true); // 2nd arg: ["string", "list"]
              this.setNextStatement(true);     // ditto
              this.setTooltip('');
            }
          };

          Blockly.Language["array_of"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(40);
              this.appendDummyInput()
                  .appendTitle("array of")
                  .appendTitle(new Blockly.FieldTextInput("3"), "count");
              this.setPreviousStatement(true);
              this.setNextStatement(true);
              this.setTooltip('');
            }
          };

          /*
          Blockly.JavaScript.function = function() {
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
                  "  <category name='Controls'>" +
                  "    <block type='controls_if'></block>" +
                  "    <block type='controls_repeat'></block>" +
                  "    <block type='declare'></block>" +
                  "    <block type='pointer_to'></block>" +
                  "    <block type='array_of'></block>" +
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
     * Converts the current blocks to code
     *
     * @param language {String}
     *   The language to which the blocks are to be converted, e.g.,
     *   "XML", "JavaScript" or "C"
     *
     * @return {String} 
     *   The current set text.
     *
     * @lint ignoreUndefined(Blockly)
     * @lint ignoreUndefined(Blockly.Xml)
     * @lint ignoreUndefined(Blockly.Xml.domToText)
     * @lint ignoreUndefined(Blockly.Xml.workspaceToDom)
     * @lint ignoreUndefined(Blockly.Generator)
     * @lint ignoreUndefined(Blockly.Generator.workspaceToCode)
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
     * @lint ignoreUndefined(Blockly)
     * @lint ignoreUndefined(Blockly.Xml)
     * @lint ignoreUndefined(Blockly.Xml.domToWorkspace)
     * @lint ignoreUndefined(Blockly.Xml.textToDom)
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
