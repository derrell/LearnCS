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
            cbFailure && cbFailure(ex, id);
          }
        });
      
      // Issue the RPC
      id = this.__rpc.callAsync.apply(this.__rpc, args);
      
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
      this.__rpc.abort(id);
    },
    
    statusReport : function(data)
    {
      playground.ServerOp.rpc(
        null,                   // success callback
        null,                   // failure callback
        "usageDetail",          // function to be called
        [ data ]);              // arguments to function
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
