/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("playground.ServerOp",
{
  type   : "static",
  
  statics :
  {
    /** Handle to our remote procedure call processor */
    __rpc : null,               // initialized in defer
    
    /** Number of requests currently in progress */
    __inProgress : 0,

    /** Queue of data to be sent to the server */
    __queue : [],

    /** timer handle to send enqueued data */
    __timer : null,

    /**
     * Issue a remote procedure call request.
     * 
     * @param cbSuccess {Function}
     *   Callback function to be called upon successful result from RPC. The
     *   function will be passed two arguments: the RPC result value, and the
     *   id of the request.
     * 
     * @param cbFailure {Function}
     *   Callback function to be called upon exception from RPC. The function
     *   will be passed two arguments: the RPC exception map, and the id of
     *   the request.
     * 
     * @param name {String}
     *   The name of the function to be called, within the namespace
     *   initialized in our defer() function.
     * 
     * @param args {Array}
     *   Arguments to pass to the remote procedure call
     * 
     * @return {Var}
     *   An opaque value which can be passed to the cancel() method, to cancel
     *   this RPC request.
     */
    rpc : function(cbSuccess, cbFailure, name, args)
    {
      var             id;

      // Ensure there are no prior pending requests
      playground.ServerOp.flushQueue();

      // If there were no arguments provided, create an empty argument list;
      // otherwise clone the argument list.
      args = args ? args.slice(0) : [];

      // Prepend to the arguments, the name of the function to be called
      args.unshift(name);
      
      // Prepend to the arguments, the callback function
      args.unshift(
        function(result, ex, id) 
        {
          // We received a result. Decrement the count of requests in progress
          --playground.ServerOp.__inProgress;

          // Was there an exception?
          if (ex == null) 
          {
            // Nope. Call the user's success callback function
            cbSuccess && cbSuccess(result, id);
          } 
          else
          {
            // Something went wrong. Let the user know.
            typeof console != "undefined" && console.log(ex);
            
            // If we received no data...
            if (ex.code == qx.io.remote.Rpc.localError.nodata)
            {
              location.reload(true);
              
              // not reached
              return;
            }

            cbFailure && cbFailure(ex, id);
          }
        });
      
      // Issue the RPC
      id = playground.ServerOp.__rpc.callAsync.apply(
        playground.ServerOp.__rpc, args);
      
      // Increment the count of requests in progress
      ++playground.ServerOp.__inProgress;
      
      // Give 'em the id, so they might have the option to cancel the request
      return id;
    },
    
    /**
     * Cancel a remote procedure call in progress. (If any time has passed,
     * this will likely do nothing.)
     * 
     * @param id {Var}
     *   An opaque request identifier previously returned by request().
     */
    rpcCancel : function(id)
    {
      // Abort the request.
      playground.ServerOp.__rpc.abort(id);
    },
    
    statusReport : function(data)
    {
      var             queue = playground.ServerOp.__queue;

      // Enqueue this new request
      queue.push(data);
      
      // Is there already a timer active?
      if (playground.ServerOp.__timer)
      {
        // Yup. Nothing more to do right now.
        return;
      }
      
      // Start a timer to post the usage detail data
      playground.ServerOp.__timer = qx.util.TimerManager.getInstance().start(
        playground.ServerOp.__sendQueue,
        0,
        this,
        null,
        5000);
    },
    
    flushQueue : function()
    {
      var             queue = playground.ServerOp.__queue;

      // If there is a pending timer, ...
      if (playground.ServerOp.__timer)
      {
        // ... stop it.
        qx.util.TimerManager.getInstance().stop(playground.ServerOp.__timer);
        playground.ServerOp.__timer = null;
      }
      
      // If there's anything on the queue...
      if (queue.length > 0)
      {
        playground.ServerOp.__sendQueue();
      }
    },
    
    __sendQueue : function(userData, timerId)
    {
      var             queue = playground.ServerOp.__queue;
/*
      // Add a snapshot immediately before sending this batch of reports
      queue.push(
        {
          type          : "snapshot",
          snapshot      : qx.core.Init.getApplication().editor.getCode()
        });
*/

      // The queue is being processed. We have a copy of it. Reset it.
      playground.ServerOp.__queue = [];

      // There's no longer a timer running.
      playground.ServerOp.__timer = null;

      playground.ServerOp.rpc(
        function(result, id)              // success callback
        {
          qx.core.Init.getApplication()._displayDirectoryListing(result);
        },
        null,                             // failure callback
        "usageDetail",                    // function to be called
        [ queue ]);                       // arguments to function
    }
  },
  
  defer : function(statics)
  {
    // Prepare to issue remote procedure calls
    statics.__rpc = new qx.io.remote.Rpc();
    statics.__rpc.setProtocol("2.0");
    statics.__rpc.setUrl("/rpc");
    statics.__rpc.setServiceName("learncs");
  }
});
