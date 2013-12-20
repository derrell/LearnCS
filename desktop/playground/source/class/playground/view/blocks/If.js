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
@ignore(Blockly)
*/

qx.Class.define("playground.view.blocks.If",
{
  extend : Object,

  statics :
  {
    /**
     * @ignore(Blockly.*)
     */
    "if" :
    {
      // If/elseif/else condition.
      helpUrl: "http://www.example.com",
      init: function ()
      {
        this.setColour(120);
        this.appendValueInput("if0", "Expression")
          .setCheck(Boolean)
          .appendTitle("if");
        this.appendDummyInput("if-text0")
          .appendTitle("is true (non-zero)");
        this.appendStatementInput("do0", "Statement")
          .appendTitle("then do");
        this.setInputsInline(true);
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setMutator(new Blockly.Mutator(
                          [
                            'if_elseif',
                            'if_else'
                          ]));
        
        this.setTooltip(
          function()
          {
            if (! this.elseifCount_ && ! this.elseCount_)
            {
              return Blockly.LANG_CONTROLS_IF_TOOLTIP_1;
            }
            else if (! this.elseifCount_ && this.elseCount_)
            {
              return Blockly.LANG_CONTROLS_IF_TOOLTIP_2;
            }
            else if (this.elseifCount_ && ! this.elseCount_)
            {
              return Blockly.LANG_CONTROLS_IF_TOOLTIP_3;
            }
            else if (this.elseifCount_ && this.elseCount_)
            {
              return Blockly.LANG_CONTROLS_IF_TOOLTIP_4;
            }
            return '';
          }.bind(this));

        this.elseifCount_ = 0;
        this.elseCount_ = 0;
      },

/*
      mutationToDom: function ()
      {
        var             container;

        if (! this.elseifCount_ && ! this.elseCount_)
        {
          return null;
        }

        container = document.createElement('mutation');

        if (this.elseifCount_)
        {
          container.setAttribute('elseif', this.elseifCount_);
        }

        if (this.elseCount_)
        {
          container.setAttribute('else', 1);
        }

        return container;
      },

      domToMutation: function (xmlElement)
      {
        var             x;

        this.elseifCount_ = parseInt(xmlElement.getAttribute('elseif'), 10);
        this.elseCount_ = parseInt(xmlElement.getAttribute('else'), 10);
        for (x = 1; x <= this.elseifCount_; x++)
        {
          this.appendValueInput('if' + x)
            .setCheck(Boolean)
            .appendTitle(Blockly.LANG_CONTROLS_IF_MSG_ELSEIF);
          this.appendStatementInput('do' + x)
            .appendTitle(Blockly.LANG_CONTROLS_IF_MSG_THEN);
        }
        
        if (this.elseCount_)
        {
          this.appendStatementInput('else')
            .appendTitle('otherwise');
        }
      },
*/

      decompose: function (workspace)
      {
        var             x;
        var             containerBlock;
        var             connection;
        var             elseifBlock;
        var             elseBlock;

        containerBlock = new Blockly.Block(workspace, 'if_if');
        containerBlock.initSvg();
        connection = containerBlock.getInput('statements').connection;

        for (x = 1; x <= this.elseifCount_; x++)
        {
          elseifBlock = new Blockly.Block(workspace, 'if_elseif');
          elseifBlock.initSvg();
          connection.connect(elseifBlock.previousConnection);
          connection = elseifBlock.nextConnection;
        }
        if (this.elseCount_)
        {
          elseBlock = new Blockly.Block(workspace, 'if_else');
          elseBlock.initSvg();
          connection.connect(elseBlock.previousConnection);
        }
        return containerBlock;
      },

      compose: function (containerBlock)
      {
        var             x;
        var             clauseBlock;
        var             ifInput;
        var             doInput;
        var             elseInput;

        // Disconnect the else input blocks and remove the inputs.
        if (this.elseCount_)
        {
          this.removeInput('else');
        }
        this.elseCount_ = 0;
        // Disconnect all the elseif input blocks and remove the inputs.
        for (x = this.elseifCount_; x > 0; x--)
        {
          this.removeInput('if' + x);
          this.removeInput('if-text' + x);
          this.removeInput('do' + x);
        }
        this.elseifCount_ = 0;
        // Rebuild the block's optional inputs.
        clauseBlock = containerBlock.getInputTargetBlock('statements');
        while (clauseBlock)
        {
          switch (clauseBlock.type)
          {
          case 'if_elseif':
            this.elseifCount_++;
            ifInput = this.appendValueInput("if" + this.elseifCount_, 
                                            "Expression")
              .setCheck(Boolean)
              .appendTitle("otherwise if");
            this.appendDummyInput('if-text' + this.elseifCount_)
              .appendTitle("is true (non-zero)");
            doInput = this.appendStatementInput("do" + this.elseifCount_,
                                                "Statement");
            doInput.appendTitle("then do");
            // Reconnect any child blocks.
            if (clauseBlock.valueConnection_)
            {
              ifInput.connection.connect(clauseBlock.valueConnection_);
            }
            if (clauseBlock.statementConnection_)
            {
              doInput.connection.connect(clauseBlock.statementConnection_);
            }
            break;

          case 'if_else':
            this.elseCount_++;
            elseInput = this.appendStatementInput("else", "Statement");
            elseInput.appendTitle("in all other cases do");
            // Reconnect any child blocks.
            if (clauseBlock.statementConnection_)
            {
              elseInput.connection.connect(clauseBlock.statementConnection_);
            }
            break;

          default:
            throw 'Unknown block type.';
          }

          clauseBlock = clauseBlock.nextConnection &&
            clauseBlock.nextConnection.targetBlock();
        }
      },

      saveConnections: function (containerBlock)
      {
        var             x;
        var             inputDo;
        var             inputIf;
        var             clauseBlock;

        // Store a pointer to any connected child blocks.
        clauseBlock = containerBlock.getInputTargetBlock('statements');
        x = 1;
        while (clauseBlock)
        {
          switch (clauseBlock.type)
          {
          case 'if_elseif':
            inputIf = this.getInput('if' + x);
            inputDo = this.getInput('do' + x);
            clauseBlock.valueConnection_ =
              inputIf && inputIf.connection.targetConnection;
            clauseBlock.statementConnection_ =
              inputDo && inputDo.connection.targetConnection;
            x++;
            break;

          case 'if_else':
            inputDo = this.getInput('otherwise');
            clauseBlock.statementConnection_ =
              inputDo && inputDo.connection.targetConnection;
            break;

          default:
            throw 'Unknown block type.';
          }
          clauseBlock = clauseBlock.nextConnection &&
            clauseBlock.nextConnection.targetBlock();
        }
      }
    },

    // used in "if" mutator
    /**
     * @ignore(Blockly.*)
     */
    "if_if" :
    {
      // If condition.
      init: function ()
      {
        this.setColour(120);
        this.appendDummyInput()
          .appendTitle("if");
        this.appendStatementInput('statements');
        this.setTooltip(Blockly.LANG_CONTROLS_IF_IF_TOOLTIP);
        this.contextMenu = false;
      }
    },

    // used in "if" mutator
    /**
     * @ignore(Blockly.*)
     */
    "if_elseif" :
    {
      // Else-If condition.
      init: function ()
      {
        this.setColour(120);
        this.appendDummyInput()
          .appendTitle("otherwise if");
        this.setPreviousStatement(true);
        this.setNextStatement(true);
        this.setTooltip(Blockly.LANG_CONTROLS_IF_ELSEIF_TOOLTIP);
        this.contextMenu = false;
      }
    },

    // used in "if" mutator
    /**
     * @ignore(Blockly.*)
     */
    "if_else" :
    {
      // Else condition.
      init: function ()
      {
        this.setColour(120);
        this.appendDummyInput()
          .appendTitle("in all other cases do");
        this.setPreviousStatement(true);
        this.setTooltip(Blockly.LANG_CONTROLS_IF_ELSE_TOOLTIP);
        this.contextMenu = false;
      }
    }
  },
  
  defer : function(statics)
  {
    playground.view.Blockly.registerBlocks(statics);
  }
});
