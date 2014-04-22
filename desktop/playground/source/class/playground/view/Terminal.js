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
    var             hBox;
    var             legend; 
    var             graphics;
    var             terminalVBox;

    // Call the superclass constructor
    this.base(arguments);
    this._setLayout(new qx.ui.layout.HBox(8));
    
    terminalVBox = new qx.ui.container.Composite(new qx.ui.layout.VBox(2));
    this.add(terminalVBox, { flex : 2 });
    
    // Create the graphics canvas.
    this.resetGraphicsCanvas();
    
    // Create a horizontal box for the legend and EOF button
    hBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());

    // Add a legend
    legend = new qx.ui.basic.Label("Terminal");
    legend.setFont("bold");
    hBox.add(legend);
    
    // Add a spacer to right-justify the EOF button
    hBox.add(new qx.ui.core.Spacer(), { flex : 1 });

    // Add a button for generating end-of-file
    this._butEof = new qx.ui.form.ToggleButton("EOF");
    this._butEof.setHeight(20);
    this._butEof.addListener("execute", this._onEof, this);
    hBox.add(this._butEof);

    // Add the horizontal box with the legend and the EOF button
    terminalVBox.add(hBox);

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
        wrap       : true
      });
    terminalVBox.add(this._textArea, { flex : 1 });
    
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
    
    _graphicsCanvas : null,

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
      this._textArea.setValue(null);
      
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
      textArea.setValue((textArea.getValue() || "") + text);
      textArea.getContentElement().scrollToY(100000);
    },

    /**
     * Turn on/off the EOF button
     * 
     * @param bEof {Boolean}
     *   Whether the EOF button should be on or off
     */
    setEof : function(bEof)
    {
      this._butEof.setValue(!! bEof);
      this._textArea.setEnabled(! bEof); // re-enable text area on ! bEof
    },

    /**
     * Retrieve the current value of the EOF flag
     */
    getEof : function()
    {
      return this._butEof.getValue();
    },

    /** Event listener for EOF button */
    _onEof : function(e)
    {
      var             data;

      // When the button is pressed, ensure it remains forever on
      this._butEof.setValue(true);

      // Get the data string
      data = this._linebuf.join("");

      // Clear the line buffer. There's no more data available for reading.
      this._linebuf = [];

      // Fire an event with this line data
      this.fireDataEvent("textline", data);

      // After EOF, no input is allowable
      this._textArea.setEnabled(false);
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
    },
    
    /** Reset (or create, initially) the graphics canvas) */
    resetGraphicsCanvas : function()
    {
      try
      {
        if (this._graphicsCanvas)
        {
          this.remove(this._graphicsCanvas);
        }
      }
      catch(e)
      {
      }

      this._graphicsCanvas = 
        new qx.ui.container.Composite(new qx.ui.layout.Canvas());
      this._graphicsCanvas.setBackgroundColor("white");
      this.add(this._graphicsCanvas, { flex : 1 });

      // Exclude the graphics canvas, by default
      // (Also excluded in Application.js run() each time)
      this._graphicsCanvas.exclude();
    },

    /** Retrieve the graphics canvas */
    getGraphicsCanvas : function()
    {
      return this._graphicsCanvas;
    }
  }
});
