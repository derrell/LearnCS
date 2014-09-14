/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Class.define("login.ServerOp",
{
  type   : "static",
  
  statics :
  {
    /** Handle to our remote procedure call processor */
    __rpc : null,               // initialized in defer
    
    /**
     * Issue a remote procedure call request. 
     * 
     * Note: This is a simplified version of playground.ServerOp.rpc
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
      login.ServerOp.flushQueue();

      // If there were no arguments provided, create an empty argument list;
      // otherwise clone the argument list.
      args = args ? args.slice(0) : [];

      // Prepend to the arguments, the name of the function to be called
      args.unshift(name);
      
      // Prepend to the arguments, the callback function
      args.unshift(
        function(result, ex, id) 
        {
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
            
            // If we received no data (e.g. the server shut down), or we get
            // back a Permission Denied error, which means our session has
            // timed out...
            if (ex.code == qx.io.remote.Rpc.localError.nodata ||
                ex.code == qx.io.remote.RpcError.v2.error.PermissionDenied)
            {
              // ... then reload so they'll be asked to sign in again without
              // losing much data.
              location.reload(true);
              
              // not reached
              return;
            }

            cbFailure && cbFailure(ex, id);
          }
        });
      
      // Issue the RPC
      id = login.ServerOp.__rpc.callAsync.apply(
        login.ServerOp.__rpc, args);
      
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
      login.ServerOp.__rpc.abort(id);
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
