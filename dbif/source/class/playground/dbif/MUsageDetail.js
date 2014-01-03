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
     * @param dataList {Array}
     *   Array of usage detail maps. Fields are as in "User-provided" section of
     *   ObjUsageDetail
     * 
     * @return {Map|null}
     *   If any element of the dataList contains a snapshot, then a directory
     *   listing is returned; otherwise null.
     */
    usageDetail : function(dataList, error)
    {
      var             _this = this;
      var             bNeedDirectoryListing = false;

      return liberated.dbif.Entity.asTransaction(
        function()
        {
          dataList.forEach(
            function(data)
            {
              var             snapshot;
              var             detailObj;
              var             detailData;
              var             messageData;

              // Store any snapshot data, and then delete it from the
              // object. It's saved in git, not in the database.
              snapshot = data.snapshot;
              delete data.snapshot;

              // Keep track of any snapshots we found
              bNeedDirectoryListing = bNeedDirectoryListing || !! snapshot;

              // Create the usage detail object
              detailObj = new playground.dbif.ObjUsageDetail();

              // Get the object's data
              detailData = detailObj.getData();

              // Merge the provided members into the new object's data
              qx.lang.Object.mergeWith(detailData, data, true);

              // Re-add (or overwrite, if the user was nasty), the user name
              detailData.user = playground.dbif.MDbifCommon.getCurrentUserId();

              // Copy non-null fields into a new map
              messageData = {};
              Object.keys(detailData).forEach(
                function(key)
                {
                  if (detailData[key] !== null)
                  {
                    messageData[key] = detailData[key];
                  }
                });

              // Is there a snapshot to be saved?
              if (snapshot)
              {
                // Yup. Save it.
                _this.saveProgram(
                  messageData.filename || "HARDCODED.c", 
                  qx.lang.Json.stringify(messageData, null, "  "),
                  snapshot);
              }
              
              // Write the usage detail to the database
              detailObj.put();
            });

          // If there was any snapshot data, return a new directory listing
          return bNeedDirectoryListing ? this.getDirectoryListing() : null;

        }.bind(this));
    }
  }
});
