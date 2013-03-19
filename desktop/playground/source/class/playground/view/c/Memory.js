/**
 * A view of C memory
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.view.c.Memory",
{
  extend : qx.ui.list.List,

  construct : function(model)
  {
    var             delegate;

    // Call the superclass constructor
    this.base(arguments, model);

    this.getPane().addLayer(
      new qx.ui.virtual.layer.Row("white", "rgb(238, 243, 255)"));
    this.getPane().addLayer(
      new qx.ui.virtual.layer.GridLines("horizontal"));

    // Each list item will be one of our Word widgets.
    delegate =
      {
        createItem : function()
        {
          return new playground.view.c.MemoryWord();
        },
        
        bindItem : function(controller, item, id)
        {
          controller.bindProperty("", "model", null, item, id);
          controller.bindProperty("addr", "addr", null, item, id);
          controller.bindProperty("name", "name", null, item, id);
          controller.bindProperty("type", "type", null, item, id);
          controller.bindProperty("size", "size", null, item, id);
          controller.bindProperty("pointer", "pointer", null, item, id);
          controller.bindProperty("array", "array", null, item, id);
          controller.bindProperty("param", "param", null, item, id);
          controller.bindProperty("values[0]", "value0", null, item, id);
          controller.bindProperty("values[1]", "value1", null, item, id);
          controller.bindProperty("values[2]", "value2", null, item, id);
          controller.bindProperty("values[3]", "value3", null, item, id);
          controller.bindProperty("bytes[0]", "byte0", null, item, id);
          controller.bindProperty("bytes[1]", "byte1", null, item, id);
          controller.bindProperty("bytes[2]", "byte2", null, item, id);
          controller.bindProperty("bytes[3]", "byte3", null, item, id);
          controller.bindProperty("arStartEnd", "arStartEnd", null, item, id);
        }
      };
    
    // Specify the delegate
    this.setDelegate(delegate);
  },

  members :
  {
    __deferredCall : null,

    // overridden
    _initLayer : function()
    {
      this.base(arguments);

      this._layer.addListener("updated", this._onUpdate, this);
    },

    // overridden
    _onUpdate : function()
    {
      if (this.__deferredCall == null)
      {
        this.__deferredCall = new qx.util.DeferredCall(function() {
          qx.ui.core.queue.Widget.add(this);
        }, this);
      }
      this.__deferredCall.schedule();
    },

    // overridden
    syncWidget : function()
    {
      var firstRow = this._layer.getFirstRow();
      var rowSize = this._layer.getRowSizes().length;

      var rowConfig = this.getPane().getRowConfig();
      var defaultHeight = this.getItemHeight();

      for (var row = firstRow; row < firstRow + rowSize; row++)
      {
        var widget = this._layer.getRenderedCellWidget(row, 0);
        if (widget != null) {
          rowConfig.setItemSize(row, Math.max(defaultHeight, 
                                              widget.getSizeHint().height));
        }
      }
    }
  },

  destruct : function()
  {
    if (!qx.core.ObjectRegistry.inShutDown && this.__deferredCall != null)
    {
      this.__deferredCall.cancel();
      this.__deferredCall.dispose();
    }

    this.__deferredCall = null;
  }
});