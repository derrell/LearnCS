/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MSettings",
{
  construct : function()
  {
    //
    // Register the remote procedure call services available in this mixin
    //
    
    // Initialize a user
    this.registerService("learncs.saveSettings", 
                         this.saveSettings,
                         [ "courseId", "bResearchOk" ]);
  },

  members :
  {
    /**
     * Save the user's settings.
     *
     * @param courseId {Any}
     *   The course id (key) of the course the user is registering in
     * 
     * @param bResearchOk {Boolean}
     *   Whether the user allows use of his data for research
     * 
     * @return {Integer}
     *   0 upon success; non-zero upon error
     */
    saveSettings : function(courseId, bResearchOk)
    {

      return liberated.dbif.Entity.asTransaction(
        function()
        {
          var             userId;
          var             userObj;
          var             userData;
          var             courseData;
          var             addOtherUser;

          addOtherUser = function(otherUserId)
          {
            var             otherUserObj;
            var             otherUserData;

            // Get the other user's object
            otherUserObj = new playground.dbif.ObjUser(otherUserId);
            
            // Ensure he exists
            if (otherUserObj.getBrandNew())
            {
              console.log("Nonexisting 'other user' while saving settings: " +
                          otherUserId);
            }

            // Get the other user's data
            otherUserData = otherUserObj.getData();
            
            // If this user isn't already in the other user's course access
            // list...
            if (otherUserData.courseAccess.indexOf(userId) == -1)
            {
              // ... then add it, ...
              otherUserData.courseAccess.push(userId);
              
              // ... and save the other user object
              otherUserObj.put();
            }

            // Add the other user to this user's template list
            userData.templatesFrom.push(otherUserId);
          };



          // Retrieve the current user id
          userId = playground.dbif.MDbifCommon.getCurrentUserId();

          // Get this user's object from the database
          userObj = new playground.dbif.ObjUser(userId);

          // The user had better exist!
          if (userObj.getBrandNew())
          {
            console.log("Request to save settings for nonexistent user id " +
                        userId);
            return 1;
          }

          // Get this user's object data
          userData = userObj.getData();

          // Flush the templates array
          userData.templatesFrom = [];

          // Get the data for the selected course
          courseData = liberated.dbif.Entity.query(
            "playground.dbif.ObjCourse",
            {
              type  : "element",
              field : "id",
              value : courseId
            });
          
          // If we didn't get any data, the user is screwing with us.
          if (courseData.length !== 1)
          {
            return 2;
          }
          
          // Retrieve the one and only returned course
          courseData = courseData[0];

          // If this course isn't already in the user's enrolled list...
          if (userData.enrolledIn.indexOf(courseId) == -1)
          {
            // ... then add it, ...
            userData.enrolledIn.push(courseId);
          }

          // For each course instructor and lab instructor
          courseData.instructors.forEach(addOtherUser);
          courseData.labInstructors.forEach(addOtherUser);
          
          // Save this user
          userObj.put();

          return 0;
        }.bind(this));
    }
  }
});
