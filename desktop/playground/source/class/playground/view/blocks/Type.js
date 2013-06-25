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
#asset(playground/*)
#ignore(require)
#ignore(Blockly)
*/

qx.Class.define("playground.view.blocks.Type",
{
  extend : Object,

  statics :
  {
    "declare" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
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
    },
    
    "type" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
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

      decompose : function(workspace) 
      {
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

      compose : function(typeBlock) 
      {
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
    },

          // Used in mutator for "type" block
    "type_editor" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
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
    },
    
    // Used in mutator for "type" block
    "pointer_to" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
        this.setColour(40);
        this.appendDummyInput()
          .appendTitle("pointer to");
        this.setPreviousStatement(true); // 2nd arg: ["string", "list"]
        this.setNextStatement(true);     // ditto
        this.setTooltip('');
      }
    },

    // Used in mutator for "type" block
    "array_of" :
    {
      helpUrl: 'http://www.example.com/',

      init: function() 
      {
        this.setColour(40);
        this.appendDummyInput()
          .appendTitle("array of")
          .appendTitle(new Blockly.FieldTextInput("3"), "count");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip('');
      }
    }
  },
  
  defer : function(statics)
  {
    playground.view.Blockly.registerBlocks(statics);
  }
});
