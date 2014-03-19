/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MUser",
{
  construct : function()
  {
    //
    // Register the remote procedure call services available in this mixin
    //
    
    // Initialize a user
    this.registerService("learncs.userInit",
                         this.userInit,
                         [ ]);
  },

  members :
  {
    /**
     * Initialize a user
     *
     * @return {Map}
     *   Map containing the following members:
     *
     *     whoAmI : {Map}
     *       user : {String}
     *         user name
     *
     *       isAdmin : {Boolean}
     *         true if the user is an administrator; false otherwise
     *
     *     logoutUrl : {String}
     *       The URL to access, to log out
     */
    userInit : function(error)
    {
      var             userId;
      var             userObj;
      var             userData;
      var             ret;
      var             whoAmI = this.getWhoAmI();
      
      // Initialize our return value
      ret =
        {
          whoAmI    : 
          {
            user    : whoAmI.user,
            isAdmin : whoAmI.isAdmin
          },
          logoutUrl : this.getLogoutUrl(),
          courseList     : [],
          enrolledCourse : null,
          bResearchOk    : true
        };

      // Ensure that this user has an ObjUser object in the datastore
      liberated.dbif.Entity.asTransaction(
        function()
        {
          var             otherUsers;
          var             instructors;
          var             labInstructors;

          function getOtherUserName(otherUserId)
          {
            var             otherUserData;

            otherUserData = liberated.dbif.Entity.query(
              "playground.dbif.ObjUser",
              {
                type  : "element",
                field : "id",
                value : otherUserId
              });

            // Sanity check. Ensure he's found.
            if (otherUserData.length < 1)
            {
              console.log("Could not find instructor: " + otherUserId);
              return;
            }
            
            // Get the one and only result
            otherUserData = otherUserData[0];

            otherUsers.push(otherUserData.displayName);
          };
          


          // See if this user is already registered
          userData = liberated.dbif.Entity.query(
            "playground.dbif.ObjUser",
            {
              type  : "element",
              field : "user",
              value : ret.whoAmI.user
            });
          
          // If not...
          if (userData.length === 0)
          {
            // ... then create the user object
            userObj = new playground.dbif.ObjUser();

            // Get the object's data
            userData = userObj.getData();
            
            // Assign the user name
            userData.user = ret.whoAmI.user;
            
            // Write it back to the database
            userObj.put();

            // Retrieve the ID of the just-written entity
            userData = liberated.dbif.Entity.query(
              "playground.dbif.ObjUser",
              {
                type  : "element",
                field : "user",
                value : ret.whoAmI.user
              })[0];
            
            // Save this user id as the default for templatesFrom
            userData.templatesFrom = "[" + ret.whoAmI.user + "]";
          }
          else
          {
            // User is already registered. Get the one and only query result.
            userData = userData[0];
          }
          
          // Get the complete course list
          ret.courseList = 
            liberated.dbif.Entity.query(
              "playground.dbif.ObjCourse",
              {
                type  : "element",
                field : "isEnrollmentOpen",
                value : 1
              });

          ret.courseList.forEach(
            function(courseData)
            {
              // Determine the instructor names
              otherUsers = [];
              courseData.instructors.forEach(getOtherUserName);
              instructors = otherUsers;

              // Determine the lab instructor names
              otherUsers = [];
              courseData.labInstructors.forEach(getOtherUserName);
              labInstructors = otherUsers;

              // Generate the fully-qualified course name
              courseData.name = 
                courseData.institution +
                ", " + courseData.courseName +
                ", Prof. " + instructors.join(", ");
              if (labInstructors.length > 0)
              {
                courseData.name += 
                  ", lab on " + courseData.labDay +
                  " at " + courseData.labStartTime +
                  " with " + labInstructors.join(", ");
              }
            });

          // Give 'em the course that this user is enrolled in
          // FIXME: For now, we only support being enrolled in one course
          ret.enrolledCourse = userData.enrolledIn[0];
          
          // Give 'em the flag indicating whether research is allowed
          ret.bResearchOk = !! userData.researchOk;
        }.bind(this));

      // This is also the beginning of a new session. Note that.
      this.usageDetail(
        [
          {
            type : "new session"
          }
        ],
        error);

      return ret;
    }
  }
});
