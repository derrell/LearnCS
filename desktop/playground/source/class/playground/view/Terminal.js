/**
 * Terminal window
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.view.Terminal",
{
  extend : qx.ui.container.Composite,
  
  construct : function()
  {
    var             legend; 

    // Call the superclass constructor
    this.base(arguments);
    this._setLayout(new qx.ui.layout.VBox(2));
    
    // Add a legend
    legend = new qx.ui.basic.Label("Terminal");
    legend.setFont("bold");
    this.add(legend);

    // Create the embedded text field, which is the actual point of user
    // interaction
    this._textArea = new qx.ui.form.TextArea();

    // The terminal must use a fixed-width font, and we want events on every
    // key input
    this._textArea.set(
      {
        font       : "monospace",
        decorator  : null,
        liveUpdate : true,
        value      : "",
        wrap       : false
      });
    this.add(this._textArea, { flex : 1 });
    
    // Trap keyboard input
    this._textArea.addListener("keypress", this._onKeyPress, this);
    this._textArea.addListener("keyinput", this._onKeyInput, this);
    
    // Prepare to store input characters
    this._linebuf = [];
  },
  
  events :
  {
    // Fired when a line of text has been entered
    "textline" : "qx.event.type.Data"
  },

  members :
  {
    /** Line buffer, contains chars typed on one line. Flushed on Enter. */
    _linebuf : null,

    /**
     * Focus the text area
     */
    focus : function()
    {
      var             pos;

      // On terminal focus, focus the text area
      this._textArea.focus();
      
      // Scroll to the bottom
      this._textArea.getContentElement().scrollToY(10000);
      
      // Set the cursor at the bottom
      pos = this._textArea.getValue().length;
      this._textArea.setTextSelection(pos, pos);
    },

    /**
     * Clear the terminal window and flush all prior input
     */
    clear : function()
    {
      // Clear the terminal window
      this._textArea.setValue("");
      
      // Flush prior input
      this._linebuf = [];
    },

    /**
     * Add text output to the terminal. This is intended for things like
     * printf() to place its output in the terminal window.
     *
     * @param text {String}
     *   Text to be appended ot the terminal window
     */
    addOutput : function(text)
    {
      var             textArea = this._textArea;
      
      // Add the next text to the terminal
      textArea.setValue(textArea.getValue() + text);
      textArea.getContentElement().scrollToY(100000);
    },

    /** Event listener for keypress event */
    _onKeyPress : function(e)
    {
      var             keyId = e.getKeyIdentifier();
      var             textArea = this._textArea;
      var             value;
      var             data;
      
      switch(keyId)
      {
      case "Enter" :
        // Append a newline to the line buffer
        this._linebuf.push("\n");

        // Add a newline to the text area  and scroll to the bottom
        textArea.setValue(textArea.getValue() + "\n");
        textArea.getContentElement().scrollToY(100000);

        // Get the data string
        data = this._linebuf.join("");
        
        // Clear the line buffer. Can't backspace past beginning of line
        this._linebuf = [];

        // Fire an event with this line data
        this.fireDataEvent("textline", data);
        break;
        
      case "Backspace" :
        // Is there anything in the line buffer?
        if (this._linebuf.length > 0)
        {
          // Yup. Remove the final character from the line buffer
          this._linebuf.pop();
          
          // Remove the final character from the text field
          value = textArea.getValue();
          textArea.setValue(value.substr(0, value.length - 1));
          textArea.getContentElement().scrollToY(100000);
        }
        break;
        
      default:
        // Everything else is ignored here, and handled on keyinput event
        break;
      }
      
      // Prevent the character from being echoed
      e.preventDefault();
    },

    /** Event listener for keyinput event */
    _onKeyInput : function(e)
    {
      var             textArea = this._textArea;
      var             inputChar = e.getChar();

      // Add this character to the line buffer
      this._linebuf.push(inputChar);

      // Add this character to the text field
      textArea.setValue(textArea.getValue() + inputChar);
      textArea.getContentElement().scrollToY(100000);
      
      // Prevent the character from being echoed
      e.preventDefault();
    }
  }
});
