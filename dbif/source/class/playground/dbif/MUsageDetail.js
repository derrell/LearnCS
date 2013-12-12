/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MUsageDetail",
{
  construct : function()
  {
    //
    // Register the remote procedure call services available in this mixin
    //
    
    // Initialize a user
    this.registerService("learncs.usageDetail",
                         this.usageDetail,
                         [ "data" ]);
  },

  members :
  {
    /**
     * A usage detail status report
     *
     * @param dataList {Array of Map}
     *   Array of usage detail maps. Fields are as in "User-provided" section of
     *   ObjUsageDetail
     */
    usageDetail : function(dataList, error)
    {
      var             _this = this;

      return liberated.dbif.Entity.asTransaction(
        function()
        {
          dataList.forEach(
            function(data)
            {
              var             hash;
              var             snapshot;
              var             detailObj;
              var             detailData;

              // Store any snapshot data, and then delete it from the
              // object. We'll save it separately.
              snapshot = data.snapshot;
              delete data.snapshot;

              // Create the usage detail object
              detailObj = new playground.dbif.ObjUsageDetail();

              // Get the object's data
              detailData = detailObj.getData();

              // Merge the provided members into the new object's data
              qx.lang.Object.mergeWith(detailData, data, true);

              // Re-add (or overwrite, if the user was nasty), the user name
              detailData.user = playground.dbif.MDbifCommon.getCurrentUserId();

              // Is there a snapshot to be saved?
              if (snapshot)
              {
                // Yup. Save it.
                hash = _this.saveProgram(
                  detailData.filename || "HARDCODED.c", 
                  qx.lang.Json.stringify(detailData, null, "  "),
                  snapshot);
              }
              
              // The hash becomes the snapshot field in the detail object
              data.snapshot = hash;

              // Write it to the database
              detailObj.put();
            });

          return 0;
        }.bind(this));
    }
  }
});
