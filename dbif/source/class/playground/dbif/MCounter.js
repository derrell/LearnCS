/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MCounter",
{
  construct : function()
  {
    //
    // Register the remote procedure call services available in this mixin
    //
    
    // Increment a counter
    this.registerService("playground.increment",
                         this.increment,
                         [ "counterId", "incrementAmount" ]);

    // Retrieve all counters and their values
    this.registerService("playground.getCounters",
                         this.getCounters,
                         [ ]);
  },

  members :
  {
    /**
     * Increment a counter
     *
     * @param counter {Integer}
     *   The id of the counter which is being incremented
     *
     * @param incrementAmount {Integer?}
     *   The amount by which the counter should be incremented. Default: 1
     *
     * @return {Integer}
     *   The resultant value (after incrementing)
     *
     */
    increment : function(counter, incrementAmount, error)
    {
      var            counterObj;
      var            counterDataObj;

      return liberated.dbif.Entity.asTransaction(
        function()
        {
          // Get the counter object
          counterObj = new playground.dbif.ObjCounter(counter);

          // Get the application data
          counterDataObj = counterObj.getData();

          // If we weren't given any value to increment by...
          if (typeof(incrementAmount) == "undefined")
          {
            // ... then increment by 1.
            incrementAmount = 1;
          }
          else if (! qx.lang.Type.isNumber(incrementAmount) ||
                   ! isFinite(incrementAmount) ||
                   ! (incrementAmount % 1 === 0))
          {
            // The value we were given was not an integer. That's an error.
            error.setCode(1);
            error.setMessage("Increment value must be an integer value");
            return error;
          }
          
          // Increment the count by the specified amount
          counterDataObj.count += incrementAmount;
          
          // Write it back to the database
          counterObj.put();

          // Return number of likes (which may or may not have changed)
          return counterDataObj.count;
        });
    },
    
    /**
     * Get all of the counters and their values
     *
     * @return {Array}
     *   An array of entity data. Each entity contains the counter name and
     *   its current count value.
     */
    getCounters : function()
    {
      return liberated.dbif.Entity.query("playground.dbif.ObjCounter");
    }
  }
});
