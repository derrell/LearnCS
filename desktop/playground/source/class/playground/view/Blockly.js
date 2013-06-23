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

      /*
       * Add an input field if it doesn't exist and should;
       * Remove it if it exists but shouldn't.
       * 
       * @param inputName {String}
       */
      function addRemoveInput(inputName, bExists, fAppendInput, insertBefore)
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
            if (input.connection.targetConnection)
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
      }

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
 
          Blockly.Language["globals"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(24);
              this.appendDummyInput()
                .appendTitle("global variables and type definitions");
              this.appendStatementInput("declarations")
                .setCheck("Declaration");
              this.setTooltip('');
            }
          };

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
              this.appendValueInput("type", "Type");
              this.setPreviousStatement(true, "Declaration");
              this.setNextStatement(true, "Declaration");
              this.setInputsInline(true);
              this.setTooltip('');
            }
          };

          Blockly.Language["type"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(32);
              this.appendDummyInput()
                .appendTitle("type");
              this.appendDummyInput()
                .appendTitle("", "declarators");
              this.appendDummyInput()
                .appendTitle("", "static");
              this.appendDummyInput()
                .appendTitle("", "const");
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
                             "type");
              this.setOutput(true, "Type");
              this.setInputsInline(true);
              this.setTooltip('');
              this.setMutator(new Blockly.Mutator(["pointer_to", "array_of"]));
            },
            
            decompose : function(workspace) {
              var bStatic;
              var bConst;
              var declarators;
              var ctype;
              var typeBlock = new Blockly.Block(workspace, 'type_editor');
              var block;
              var target;

              typeBlock.initSvg();

              // Retrieve the values from this block
              declarators = this.getTitleValue("declarators");
              bStatic = this.getTitleValue("static") == "static";
              bConst = this.getTitleValue("const") == "const";
              ctype = this.getTitleValue("type");
              
              // For adding declarators, maintain a target to which each
              // declarator block will be connected.
              target = typeBlock.getInput("declarators").connection;

              // Parse the declarators by replacing spaces with underscores at
              // known places, then splitting at spaces
              declarators =
                declarators.replace(/array(s?) of +([0-9]+)/g, "array_of=$2");
              declarators =
                declarators.replace(/pointer(s?) to/g, "pointer_to");
              declarators = declarators.split(" ");
              declarators.forEach(
                function(declarator)
                {
                  if (declarator.match(/array(s?)_of/))
                  {
                    block = new Blockly.Block(workspace, "array_of");
                  }
                  else if (declarator.match(/pointer(s?)_to/))
                  {
                    block = new Blockly.Block(workspace, "pointer_to");
                  }
                  else
                  {
                    // Ignore other entries in the list (e.g. count for arrays)
                    return;
                  }

                  block.initSvg();
                  target.connect(block.previousConnection);
                  target = block.nextConnection;
                });
              
              // Set those values in the block editor
              typeBlock.setTitleValue(bStatic ? "TRUE" : "FALSE", "static");
              typeBlock.setTitleValue(bConst ? "TRUE" : "FALSE", "const");
              typeBlock.setTitleValue(ctype, "type");

              return typeBlock;
            },
            
            compose : function(typeBlock) {
              var bStatic;
              var bConst;
              var declarators;
              var declaratorList;
              var ctype;
              var bPlural = false;
              
              // Retrieve the values from this block
              bStatic = typeBlock.getTitleValue("static") !== "FALSE";
              bConst = typeBlock.getTitleValue("const") !== "FALSE";
              declarators = typeBlock.getInput("declarators");
              
              // Create a single string corresponding to all of the declarators
              declaratorList = [];
              declarators.connection.sourceBlock_.childBlocks_.forEach(
                function(child)
                {
                  switch(child.type)
                  {
                  case "pointer_to" :
                    declaratorList.push(bPlural ? "pointers to" : "pointer to");
                    break;
                    
                  case "array_of" :
                    declaratorList.push(bPlural ? "arrays of " : "array of ");
                    declaratorList.push(child.getTitleValue("count"));
                    bPlural = true;
                    break;
                    
                  default:
                    throw new Error("Unexpected declarator type: " + 
                                    child.type);
                  }
                  
                  // Follow child list, recursively
                  child.childBlocks_.forEach(arguments.callee);
                });
              
              // Remove empty declarator list entries
              while (declaratorList.indexOf("") != -1)
              {
                delete declaratorList[declaratorList.indexOf("")];
              }

              ctype = typeBlock.getTitleValue("type");
              
              // Set those values in the block editor
              this.setTitleValue(bStatic ? "static" : "", "static");
              this.setTitleValue(bConst ? "const" : "", "const");
              this.setTitleValue(declaratorList.join(" "), "declarators");
              this.setTitleValue(ctype, "type");
            }
          };

          // Used in mutator for "type" block
          Blockly.Language["type_editor"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(32);
              this.appendStatementInput("declarators")
                  .appendTitle("type");
              this.appendDummyInput()
                  .appendTitle("static", null)
                  .appendTitle(new Blockly.FieldCheckbox("FALSE"), "static");
              this.appendDummyInput("const")
                .appendTitle("const", null)
                .appendTitle(new Blockly.FieldCheckbox("FALSE"), "const");
              this.appendDummyInput("spacer")
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
                             "type");
              this.setInputsInline(true);
              this.setTooltip('');
            }
          };

          // Used in mutator for "type" block
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

          // Used in mutator for "type" block
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

          Blockly.Language["function"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(290);
              this.appendDummyInput()
                  .appendTitle("function")
                  .appendTitle(new Blockly.FieldTextInput("NAME"), "name");
              this.appendValueInput("result_type")
                  .appendTitle("produces result type")
                  .setCheck("Type");
              this.appendStatementInput("inputs")
                  .appendTitle("inputs")
                  .setCheck("Declaration");
              this.appendStatementInput("declarations")
                  .appendTitle("local variables", "local_vars")
                  .setCheck("Declaration");
              this.appendStatementInput("body")
                .appendTitle("do")
                .setCheck([
                            "Statement", 
                            "Return with result",
                            "Return without result" 
                          ]);
              this.setTooltip('');
              this.setInputsInline(true);
              this.setMutator(new Blockly.Mutator([]));
            },
            
            decompose : function(workspace) {
              var functionBlock = new Blockly.Block(workspace,
                                                    'function_editor');

              functionBlock.initSvg();
              
              // Set editor values based on the current function settings
              functionBlock.setTitleValue(
                this.getInput("inputs") !== null ? "TRUE" : "FALSE", 
                "has_inputs");
              functionBlock.setTitleValue(
                this.getInput("result_type") !== null ? "TRUE" : "FALSE", 
                "has_result");
              functionBlock.setTitleValue(
                this.getInput("declarations") !== null ? "TRUE" : "FALSE", 
                "has_local_vars");

              return functionBlock;
            },
            
            compose : function(functionBlock) {
              var bHasResult =
                functionBlock.getTitleValue("has_result") == "TRUE";
              var bHasInputs =
                functionBlock.getTitleValue("has_inputs") == "TRUE";
              var bHasLocalVars =
                functionBlock.getTitleValue("has_local_vars") == "TRUE";
              
              // add or remove result_type
              addRemoveInput.call(
                this,
                "result_type", 
                bHasResult,
                function() {
                  this.appendValueInput("result_type")
                    .appendTitle("produces result type")
                    .setCheck("Type");
                },
                [ "inputs", "declarations", "body" ]);
              
              // add or remove inputs
              addRemoveInput.call(
                this,
                "inputs", 
                bHasInputs,
                function() {
                  this.appendStatementInput("inputs")
                    .appendTitle("inputs")
                    .setCheck("Declaration");
                },
                [ "declarations", "body" ]);

              // add or remove local variables (declarations)
              addRemoveInput.call(
                this,
                "declarations", 
                bHasLocalVars,
                function() {
                  this.appendStatementInput("declarations")
                    .appendTitle("local variables")
                    .setCheck("Declaration");
                },
                [ "body" ]);
            }
          };

          Blockly.Language["function_editor"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(290);
              this.appendDummyInput()
                .appendTitle("function");
              this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("produces a result?")
                .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                             "has_result");
              this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("receives inputs?")
                .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                             "has_inputs");
              this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("has local variables?")
                .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                             "has_local_vars");
              this.setTooltip('');
            }
          };

          Blockly.Language["return_with_result"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(290);
              this.appendDummyInput()
                .appendTitle("leave function producing result");
              this.appendValueInput("retval");
              this.setPreviousStatement(true, "Return with result");
              this.setTooltip('');
            }
          };

          Blockly.Language["return_no_result"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(290);
              this.appendDummyInput()
                .appendTitle("leave function without result");
              this.setPreviousStatement(true, "Return without result");
              this.setTooltip('');
            }
          };

          Blockly.Language["for_loop"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(120);
              this.appendDummyInput()
                 .appendTitle("loop");
              this.appendValueInput("condition")
                .appendTitle("while true:")
                .setCheck("Expression");
              this.appendStatementInput("body")
                .appendTitle("do")
                .setCheck("Statement");
              this.setInputsInline(true);
              this.setPreviousStatement(true, "Statement");
              this.setNextStatement(true, "Statement");
              this.setTooltip('');
              this.setMutator(new Blockly.Mutator([]));
            },
            
            decompose : function(workspace) {
              var loopBlock = new Blockly.Block(workspace, 'for_loop_editor');

              loopBlock.initSvg();
              
              // Set editor values based on the current function settings
              loopBlock.setTitleValue(
                this.getInput("initialize") !== null ? "TRUE" : "FALSE", 
                "has_initialize");
              loopBlock.setTitleValue(
                this.getInput("condition") !== null ? "TRUE" : "FALSE", 
                "has_condition");
              loopBlock.setTitleValue(
                this.getInput("after_each") !== null ? "TRUE" : "FALSE", 
                "has_after_each");

              return loopBlock;
            },
            
            compose : function(loopBlock) {
              var bHasInitialize =
                loopBlock.getTitleValue("has_initialize") == "TRUE";
              var bHasCondition =
                loopBlock.getTitleValue("has_condition") == "TRUE";
              var bHasAfterEach =
                loopBlock.getTitleValue("has_after_each") == "TRUE";
              
              // add or remove initialization
              addRemoveInput.call(
                this,
                "initialize", 
                bHasInitialize,
                function() {
                  this.appendStatementInput("initialize")
                    .appendTitle("initialize")
                    .setCheck("Statement");
                },
                [ "condition", "body" ]);
              
              // add or remove the condition
              addRemoveInput.call(
                this,
                "condition", 
                bHasCondition,
                function() {
                  this.appendValueInput("condition")
                    .appendTitle("while true:")
                    .setCheck("Expression");
                },
                [ "body" ]);
              
              // add or remove after-each-iteration
              addRemoveInput.call(
                this,
                "after_each", 
                bHasAfterEach,
                function() {
                  this.appendStatementInput("after_each")
                    .appendTitle("after each iteration")
                    .setCheck("Statement");
                },
                null);
            }
          };

          Blockly.Language["for_loop_editor"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(120);
              this.appendDummyInput()
                .appendTitle("loop");
              this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("requires initialization?")
                .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                             "has_initialize");
              this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("loop terminates on a condition?")
                .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                             "has_condition");
              this.appendDummyInput()
                .setAlign(Blockly.ALIGN_RIGHT)
                .appendTitle("requires post-iteration code?")
                .appendTitle(new Blockly.FieldCheckbox("FALSE"),
                             "has_after_each");
              this.setTooltip('');
            }
          };

          Blockly.Language["do_while_loop"] = {
            helpUrl: 'http://www.example.com/',
            init: function() {
              this.setColour(120);
              this.appendDummyInput()
                .appendTitle("loop at least once");
              this.appendStatementInput("body")
                .appendTitle("do");
              this.appendValueInput("condition")
                .appendTitle("while true:");
              this.setInputsInline(true);
              this.setPreviousStatement(true, "Statement");
              this.setNextStatement(true, "Statement");
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


          /*
           * Redefine Blockly's checkType_ function to prevent promiscuous
           * blocks (those which do not specify a type) from connecting when
           * the other connection requires a specific type.
           *
           * We also, here, allow a function to be provided (instead of just a
           * string), for more sophisticated checks.
           */
          Blockly.Connection.prototype.checkType_ = function(otherConnection) {
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
                  "  <category name='Controls'>" +
                  "    <block type='controls_if'></block>" +
                  "    <block type='controls_repeat'></block>" +
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
