/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MFiles",
{
  construct : function()
  {
    //
    // Register the remote procedure call services available in this mixin
    //
    
    // Get a directory listing
    this.registerService("learncs.getDirectoryListing",
                         this.getDirectoryListing,
                         [ "versionsOfFilename" ]);

    // Get a program
    this.registerService("learncs.getProgram",
                         this.getProgram,
                         [
                           "programName", 
                           "category",
                           "userId" 
                         ]);

    // Rename a program
    this.registerService("learncs.renameProgram",
                         this.renameProgram,
                         [
                           "oldName",
                           "newName",
                           "code"
                         ]);

    // Remove a program
    this.registerService("learncs.removeProgram",
                         this.removeProgram,
                         [
                           "name"
                         ]);

    // Copy a program
    this.registerService("learncs.copyProgram",
                         this.copyProgram,
                         [
                           "fromName",
                           "fromCategory",
                           "fromUserId",
                           "toName"
                         ]);
  },

  statics :
  {
    /** The top-level directory on the server which contains users' code */
    UserFilesDir       : "../USERCODE",
    
    /** Default user directory: DataDir and TemplateDir available to all */
    DefaultUser        : "DEFAULT_USER",

    /** Subdirectory where data files are stored */
    DataDir            : "DATA",
    
    /** Subdirectory where program files are stored */
    ProgDir            : "PROGRAMS",
    
    /** Subdirectory where template programs are stored */
    TemplateDir        : "TEMPLATES"
  },

  members :
  {
    /**
     * Save a program via git.
     *
     * @param programName {String}
     *   The name of the program being saved
     *
     * @param detail {String}
     *   Detail information saved with this version of the file
     *
     * @param code {String}
     *   The program's code to be saved
     * 
     * @param notes {String?}
     *   If provided, the message to add as git notes for this commit
     *
     * @return {Number}
     *   Zero upon success; non-zero otherwise
     */
    _saveProgram : function(programName, detail, code, notes)
    {
      var             user;
      var             ret;
      var             process;
      var             exitValue;
      var             reader;
      var             writer;
      var             line;
      var             cmd;
      var             hash;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             gitDir;
      var             System = liberated.dbif.System;
      

      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Sanitize the name
      programName = this.__sanitizeFilename(programName);

      // Create the git directory name
      gitDir = 
        userFilesDir + "/" + user + "/" + progDir + "/" + programName + ".git";

      // Be sure the file's git directory has been created
      System.system( [ "mkdir", "-p", gitDir ], { showStdout : true } );

      // Write the code to a file with the given name
      try
      {
        System.writeFile(gitDir + "/" + programName, 
                         code,
                         {
                           encoding : "utf8"
                         });
      }
      catch (e)
      {
        console.log("\n\nFailed to create user code at " + 
                    gitDir + "/" + programName + 
                    ": " + e + "\n\n");
      }

      // Create the git repository
      System.system( [ "git", "init" ], 
                     {
                       cwd        : gitDir,
                       showStdout : true
                     } );
      
      // Add the file to this git repository
      System.system( [ "git", "add", programName ],
                     {
                       cwd        : gitDir,
                       showStdout : true
                     } );

      if (typeof detail == "object")
      {
        detail = qx.lang.Json.stringify(detail);
      }

      // Commit the file
      process = System.system(
        [
          "git",
          "commit",
          "-m",
          detail,
          "--",
          programName
        ],
        { 
          cwd        : gitDir,
          showStdout : true
        } );

      // Did the commit succeed?
      if (process.exitCode == 0)
      {
        // Yup. Were notes specified?
        if (notes)
        {
          // Yup. Add a Notes entry to show that it was copied
          System.system(
            [ 
              "git",
              "notes",
              "append",
              "-m", 
              notes
            ],
            { 
              cwd        : gitDir,
              showStdout : true
            } );
        }
      }
      else
      {
        console.log(process.stderr);
        
        // Check out the most recent version
        System.system(
          [
            "git",
            "checkout",
            programName
          ],
          { 
            cwd        : gitDir,
            showStdout : true
          });
      }
      
      console.log("\n");
      return 0;
    },

    /**
     * Sanitize a file name by replacing ".." with "DOTDOT", backslash with
     * slash, multiple adjacent slashes with a single slash, and any remaining
     * slash with "SLASH".
     * 
     * @param name {String}
     *   The file name to be sanitized
     * 
     * @return {String}
     *   The sanitized file name
     */
    __sanitizeFilename : function(name)
    {
      // Remove dangerous ..
      name = name.replace(/\.\./g, "DOTDOT");
      
      // Replace backslashes with forward slashes
      name = name.replace(/\\/g, "/");

      // Strip any double slashes; replace with single slashes
      name = name.replace(/\/+/g, "/");

      // Replace dangerous slashes
      name = name.replace(/\//g, "SLASH");

      return name;
    },

    /**
     * Obtain a directory listing.
     *
     * @param versionsOfFilename {String?}
     *   The name of the file, in My Programs, for which versions are requested
     *
     * @return {Map}
     *   A map containing the elements programs, userFiles, and optionally,
     *   templates and instructorFiles. Each is an array of files in the
     *   specified category.
     */
    getDirectoryListing : function(versionsOfFilename)
    {
      var             dirList = [];
      var             user;
      var             userData;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             dataDir = playground.dbif.MFiles.DataDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             templateDir = playground.dbif.MFiles.TemplateDir;
      var             defaultUser = playground.dbif.MFiles.DefaultUser;
      var             System = liberated.dbif.System;

      // Assume no files are available, initially.
      var defaultDirList =
        [
          {
            name     : "",
            category : "No files available"
          }
        ];


      var addFiles = function(dirData)
      {
        var             i;
        var             files;
        var             name;
        var             gitDir;
        var             process;
        var             reader;
        var             line;
        var             lines;
        var             hash;
        var             versionDate;
        var             versionNum;

        // Obtain its files (if any).
        files = System.readdir(dirData.name);

        // Was it a directory?
        if (files != null)
        {
          // Yup. Enumerate any files within.
          for (i = 0; i < files.length; i++)
          {
            // Retrieve the file name
            name = files[i];

            // If we're in the program directory, the name ends with ".git",
            // and we must strip that off.
            if (dirData.category == "My Programs")
            {
              // Exclude any "removed" files (they end with .git.<timestamp>)
              if (name.match(/\.git\.[0-9]+$/))
              {
                continue;
              }

              // Strip off the git suffix, for display
              name = name.replace(/\.git$/, "");
            }

            // Are we getting versions of this file?
            if (dirData.category == "My Programs" && name == versionsOfFilename)
            {
              // Yup. Build the full path for the git directory name
              gitDir = dirData.name + "/" + name + ".git";

              // Retrieve the timestamp and subject of every version. 
              process = System.system(
                [ 
                  "git",
                  "log",
                  "--format=format:%h/%cr (%s)"
                ],
                { 
                  cwd        : gitDir,
                  showStdout : true
                } );

              // Split lines into an array
              lines = process.stdout.split("\n");

              // Read each line, and add an entry to the directory list
              for (versionNum = 0; versionNum < lines.length; ++versionNum)
              {
                // Extract the hash and version date portions
                line = lines[versionNum].split("/");
                hash = line[0];
                versionDate = line[1];

                dirList.push(
                  {
                    name       : (versionNum == 0 
                                  ? name
                                  : (name + " -" + versionNum +
                                     ", " + versionDate)),
                    origName   : name,
                    hash       : (versionNum == 0 ? null : hash),
                    versionNum : versionNum,
                    category   : dirData.category,
                    user       : dirData.user
                  });
              }
            }
            else
            {
              // Add this file's name to the map to be returned
              dirList.push(
                {
                  name       : name,
                  origName   : name,
                  hash       : null,
                  versionNum : 0,
                  category   : dirData.category,
                  user       : dirData.user
                });
            }
          }
        }
      }.bind(this);

      // Retrieve the current user id
      user = this.getWhoAmI().userId;
      
      // Add the user's own programs and files, and standard templates
      [
        {
          category : "My Programs",
          name     : userFilesDir + "/" + user + "/" + progDir,
          user     : user
        },
        {
          category : "My Files",
          name     : userFilesDir + "/" + user + "/" + dataDir,
          user     : user
        },
        {
          category : "Templates: {generic}",
          name     : userFilesDir + "/" + defaultUser + "/" + templateDir,
          user     : defaultUser
        }
      ].forEach(addFiles);
      
      // Get this user's object data, to get the template users
      userData = liberated.dbif.Entity.query(
        "playground.dbif.ObjUser",
        {
          type  : "element",
          field : "id",
          value : user
        })[0];
      
      // If there's no templates array...
      if (! userData.templatesFrom)
      {
        // ... then use an array containing only ourself
        userData.templatesFrom = [ user ];
      }
      
      // Now add templates from any registered template users.
      userData.templatesFrom.forEach(
        function(userId)
        {
          var             templateUserData;

          // Get the template user name
          templateUserData = liberated.dbif.Entity.query(
            "playground.dbif.ObjUser",
            {
              type  : "element",
              field : "id",
              value : userId
            });
          
          // If the user no longer exists...
          if (! templateUserData || templateUserData.length === 0)
          {
            // ... then we have nothing to do.
            return;
          }

          // Add this user's templates to the list
          addFiles(
            {
              category : "Templates: " + templateUserData[0].displayName,
              name     : userFilesDir + "/" + userId + "/" + templateDir,
              user     : userId
            });
        });

      // If we haven't added anything to the directory listing...
      if (dirList.length === 0)
      {
        // ... then use the default directory list
        dirList = defaultDirList;
      }

      // Sort the directory listing by name category then name
      dirList.sort(
        function(a, b)
        {
          if (a.category != b.category)
          {
            return (a.category < b.category 
                    ? -1 
                    : (a.category > b.category
                       ? 1
                       : 0));
          }
          
          return (a.name < b.name
                  ? -1
                  : (a.name > b.name
                     ? 1
                     : 0));
        });

      return dirList;
    },

    /**
     * Retrieve the current version of a program
     * 
     * @param programName {String}
     *   The name of the program being saved
     *
     * @param category {String}
     *   The category in which this program is contained. If "My Programs"
     *   then we find the program in its git directory; otherwise, not.
     *
     * @param hash {String|null}
     *   The hash of a version of the program, or null to request most recent
     *
     * @param user {Integer}
     *   The user id of the file's owner.
     *
     * @return {Map}
     *   The map contains the following members:
     *     name    - the file name
     *     code    - the entire source code of the program
     *     dirList - a new directory listing, a la getDirectoryListing()
     */
    getProgram : function(programName,
                          hash,
                          category,
                          userId,
                          bRefreshDirectoryListing,
                          oldProgramName,
                          oldCode)
    {
      var             ret;
      var             user;
      var             userData;
      var             line;
      var             code;
      var             dir;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             templatesDir = playground.dbif.MFiles.TemplateDir;
      var             defaultUser = playground.dbif.MFiles.DefaultUser;
      
      try
      {
        //
        // First, if provided, save the code being replaced in the editor
        //
        
        // If an old program name and old code are provided...
        if (oldProgramName && oldCode)
        {
          // ... then save that code by the specified name.
          this._saveProgram(oldProgramName,
                            "autosave",
                            oldCode,
                            ("loaded new file: " + 
                             "name: " + programName + ", " +
                             "user: " + userId + ", " +
                             "category: " + category)
                           );
        }

        //
        // Now retrieve the new code
        //

        // Sanitize the name
        programName = this.__sanitizeFilename(programName);

        // Retrieve the current user id
        user = this.getWhoAmI().userId;
      
        // Get this user's object data, to get the template users
        userData = liberated.dbif.Entity.query(
          "playground.dbif.ObjUser",
          {
            type  : "element",
            field : "id",
            value : user
          })[0];

        // If there's no templates array...
        if (! userData.templatesFrom)
        {
          // ... then use an array containing only ourself
          userData.templatesFrom = [ user ];
        }

        // Ensure that there's no funny business going on here. The file's
        // user id must either be this user's own id, or one in his
        // templatesFrom list.
        if (userId != defaultUser &&
            userId != user &&
            userData.templatesFrom.indexOf(userId) == -1)
        {
          userData.templatesFrom.unshift(user);
          throw new Error("File user id " + userId +
                          " is not an allowable id: " +
                          qx.lang.Json.stringify(userData.templatesFrom));
        }

        // Generate the directory name
        if (userId === user)
        {
          if (category == "My Programs")
          {
            dir = 
              userFilesDir + "/" + 
              userId + "/" + 
              progDir + "/" +
              programName + ".git";

            // Are they requesting an old (non-HEAD) version?
            if (hash)
            {
              // Yup. Extract that version.
              System.system(
                [ 
                  "git",
                  "checkout",
                  "-f",
                  hash
                ],
                { 
                  cwd        : dir,
                  showStdout : true
                } );
            }
          }
          else
          {
            dir = 
              userFilesDir + "/" + 
              userId + "/" + 
              templatesDir;
          }
        }
        else
        {
          dir = 
            userFilesDir + "/" + 
            userId + "/" + 
            templatesDir;
        }

        // Read the file
        code = System.readFile(dir + "/" + programName);

        // Do we need to revert to HEAD?
        if (userId === user && category == "My Programs" && hash)
        {
          // Yup. Revert to HEAD
          System.system(
            [ 
              "git",
              "checkout",
              "-f",
              "master"
            ],
            { 
              cwd        : dir,
              showStdout : true
            } );
        }

        ret =
          {
            name : programName,
            code : code
          };
        
        // Only add the directory listing if specifically requested to
        if (bRefreshDirectoryListing)
        {
          ret.dirList = this.getDirectoryListing();
        }
        
        return ret;
      }
      catch (e)
      {
        var             exception;

        console.log(
          "\ngetProgram() exception: ");

        if (e.stack != null)
        {
          console.log(e.stack);
        }
        else
        {
          console.log("(No stack trace available)");
        }

        return (
          {
            name : programName,
            code : "// Could not retrieve program " + programName,
            dirList : this.getDirectoryListing()
          });
      }
    },
    
    /**
     * Rename a program
     * 
     * @param oldName {String}
     *   The original name of the program being renamed
     * 
     * @param newName {String}
     *   The new name of the program being renamed
     *
     * @param code {String}
     *   The current version of the code, to be saved
     * 
     * @return {Map}
     *   status  - 0 = success
     *            -1 = wrong backend
     *             1 = rename failed
     *   name    - upon success only, the new file name
     *   dirList - upon success only, a new directory listing
     */
    renameProgram : function(oldName, newName, code)
    {
      var             dir;
      var             user;
      var             fileOld;
      var             fileNew;
      var             File = java.io.File;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             System = liberated.dbif.System;
      
      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Build the directory path to the user's program directory
      dir = userFilesDir + "/" + user + "/" + progDir;


      // Protect from malicious use of the old and new file names
      oldName = this.__sanitizeFilename(oldName);
      newName = this.__sanitizeFilename(newName);

      // Rename the file
      if (! System.rename(oldName, newName))
      {
        return { status : 1 };
      }

      // Move the source file
      System.system(
        [ 
          "git",
          "mv",
          oldName,
          newName
        ],
        {
          cwd        : dir + "/" + newName + ".git",
          showStdout : true
        });

      // Save the program
      this._saveProgram(
        newName,
        "autosave",
        code,
        "renamed from " + oldName + " to " + newName
      );
      
      // Give 'em a new directory listing
      return (
        {
          status  : 0,
          name    : newName,
          dirList : this.getDirectoryListing()
        });
    },
    
    /**
     * Remove a program
     * 
     * @param name {String}
     *   The name of the program being removed
     * 
     * @return {Map}
     *   status  - 0 = success
     *            -1 = wrong backend
     *             1 = failed to find a timestamped name to move the git dir to
     *             2 = failed to rename the git dir
     *   dirList - upon success only, a new directory listing
     */
    removeProgram : function(name)
    {
      var             dir;
      var             user;
      var             newName;
      var             attempt;
      var             bRenamed;
      var             maxAttempts = 10;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             System = liberated.dbif.System;
      
      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Build the directory path to the user's program directory
      dir = userFilesDir + "/" + user + "/" + progDir;


      // Protect from malicious use of the file name
      name = this.__sanitizeFilename(name);

      do
      {
        // Track the number of attempts
        ++attempt;
        
        // Have we reached the maximum number of attempts?
        if (attempt >= maxAttempts)
        {
          console.log(
            "Could not find a timestamped name to delete file " + name);
          return { status : 1 };
        }

        // Append the current timestamp to the git directory name
        newName = name + ".git." + (new Date()).getTime();
        
        // Attempt to rename the file
        bRenamed = System.rename(dir + "/" + name + ".git", newName);
      } while (! bRenamed);

      // Give 'em a new directory listing
      return (
        {
          status  : 0,
          dirList : this.getDirectoryListing()
        });
    },
    
    /**
     * Copy a program to a new name
     * 
     * @param fromName {String}
     *   The name of the program being copied
     * 
     * @param toName {String}
     *   The name of the new copy of the program
     * 
     * @return {Map}
     *   status  - 0 = success
     *            -1 = wrong backend
     *             1 = failed to copy the git dir to the new name
     *   name    - the new program name
     *   dirList - upon success only, a new directory listing
     */
    copyProgram : function(fromName, fromCategory, fromUserId, toName)
    {
      var             user;
      var             ret;
      var             exitValue;
      var             code;
      var             cmd;
      var             hash;
      var             toDir;
      var             fromDir;
      var             isGit;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             templatesDir = playground.dbif.MFiles.TemplateDir;
      var             System = liberated.dbif.System;
      
      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Protect from malicious use of the file names
      fromName = this.__sanitizeFilename(fromName);
      toName = this.__sanitizeFilename(toName);

      // Create the destination git directory name
      toDir = 
        userFilesDir + "/" + user + "/" + progDir + "/" + toName + ".git";

      // Check for an existing directory of the new name
      if (System.exists(toDir))
      {
        console.log("Directory " + toDir + " already exists.");
        return { status : 1 };
      }

      // Create the source directory name, and determine if we're copying from
      // a git directory (My Programs) or not (some Template).
      if (fromUserId === user)
      {
        if (fromCategory == "My Programs")
        {
          fromDir = 
            userFilesDir + "/" + 
            fromUserId + "/" + 
            progDir + "/" +
            fromName + ".git";
          isGit = true;
        }
        else
        {
          fromDir = 
            userFilesDir + "/" + 
            fromUserId + "/" + 
            templatesDir;
          isGit = false;
        }
      }
      else
      {
        fromDir = 
          userFilesDir + "/" + 
          fromUserId + "/" + 
          templatesDir;
        isGit = false;
      }

      // Is the source already a git repository?
      if (! isGit)
      {
        // No. Read the existing file and treat it as a brand new file for
        // this user.
        try
        {
          // ... then read the source file
          code = System.readFile(fromDir + "/" + fromName);
          
          // Now we can treat this as a brand new file with no git history
          this._saveProgram(toName, "copied", code);
        }
        catch (e)
        {
          console.log("\n\nFailed to copy user's code " + ": " + e + "\n\n");
        }
      }
      else
      {
        // We're copying an existing git directory to a new one.
        // Clone the original git directory to the new one.
        System.system(
          [ 
            "git",
            "clone",
            fromDir,
            toDir
          ],
          {
            showStdout : true
          });
      }

      // Add a Notes entry to show that it was copied
      System.system(
        [ 
          "git",
          "notes",
          "append",
          "-m", 
          ("copied from file: " + 
           "name: " + fromName + ", " +
           "user: " + fromUserId + ", " +
           "category: " + fromCategory)
        ],
        {
          cwd        : toDir,
          showStdout : true
        });

      return (
        {
          status  : 0,
          name    : toName,
          dirList : this.getDirectoryListing()
        });
    }
  }
});
