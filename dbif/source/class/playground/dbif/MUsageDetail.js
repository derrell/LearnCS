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
     * @param data {Map}
     *   Usage detail map. Fields are as in "User-provided" section of
     *   ObjUsageDetail
     */
    usageDetail : function(data, error)
    {
      var             detailObj;
      var             detailData;

      // Create the usage detail object
      detailObj = new playground.dbif.ObjUsageDetail();

      // Get the object's data
      detailData = detailObj.getData();

      // Merge the provided members into the new object's data
      qx.lang.Object.mergeWith(detailData, data, true);

      // Write it to the database
      detailObj.put();

      return 0;
    }
  }
});
