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
    UserFilesDir       : "USERCODE",
    
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
      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        java.lang.System.out.println("saveProgram: not in jetty backend environment; ignoring.");
        return -1;
      }

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
      var             File = java.io.File;
      var             BufferedReader = java.io.BufferedReader;
      var             InputStreamReader = java.io.InputStreamReader;
      var             PrintWriter = java.io.PrintWriter;
      

      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Sanitize the name
      programName = this.__sanitizeFilename(programName);

      // Create the git directory name
      gitDir = 
        userFilesDir + "/" + user + "/" + progDir + "/" + programName + ".git";

      // Be sure the file's git directory has been created
      this.__exec( [ "mkdir", "-p", gitDir ] );

      // Write the code to a file with the given name
      try
      {
        writer = new PrintWriter(gitDir + "/" + programName, "UTF-8");
        writer.print(code);
        writer.close();
      }
      catch (e)
      {
        java.lang.System.out.println("\n\nFailed to create user code at " + 
                    gitDir + "/" + programName + 
                    ": " + e + "\n\n");
      }

      // Create the git repository
      this.__exec( [ "git", "init" ], gitDir);
      
      // Add the file to this git repository
      this.__exec( [ "git", "add", programName ], gitDir);

      if (typeof detail == "object")
      {
        detail = qx.lang.Json.stringify(detail);
      }

      // Commit the file
      process = this.__exec(
        [
          "git",
          "commit",
          "-m",
          detail,
          "--",
          programName
        ],
        gitDir);

      // Did the commit succeed?
      if (process.exitValue() == 0)
      {
        // Yup. Were notes specified?
        if (notes)
        {
          // Yup. Add a Notes entry to show that it was copied
          this.__exec(
            [ 
              "git",
              "notes",
              "append",
              "-m", 
              notes
            ],
            gitDir);
        }
      }
      else
      {
        // Get a handle to STDERR
        reader =
          new BufferedReader(new InputStreamReader(process.getErrorStream()));

        // The commit failed. Show the output.
        while ((line = reader.readLine()) != null) 
        {
          java.lang.System.out.println(line);
        }
        
        // Check out the most recent version
        process = this.__exec(
          [
            "git",
            "checkout",
            programName
          ],
          gitDir);
      }
      
      java.lang.System.out.println("\n");
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
     * Execute an external process
     * 
     * @param cmd {Array}
     *   The command arguments, one per array element. The first is the
     *   command name.
     * 
     * @param directory {String?}
     *   The directory in which the command should be executed
     * 
     * @return {Process}
     *   The process object for the just-executed command
     */
    __exec : function(cmd, directory)
    {
      var             line;
      var             reader;
      var             dirFile;
      var             process;
      var             runtime;
      var             stderrHeader = "STDERR:\n";
      var             stdoutHeader = "STDOUT:\n";
      var             File = java.io.File;
      var             BufferedReader = java.io.BufferedReader;
      var             InputStreamReader = java.io.InputStreamReader;
      var             Runtime = java.lang.Runtime;

      // Prepare to exec processes
      runtime = Runtime.getRuntime();

      // Get a handle to the specified directory
      if (directory)
      {
        dirFile = new File(directory);
      }
      else
      {
        dirFile = null;
      }

      java.lang.System.out.println("exec: [" + cmd.join(",") + "]");
      process = runtime.exec(cmd, null, dirFile);
      process.waitFor();
      java.lang.System.out.println("exit code: " + process.exitValue());

      reader =
        new BufferedReader(new InputStreamReader(process.getErrorStream()));
      while ((line = reader.readLine()) != null) 
      {
        java.lang.System.out.println(stderrHeader + line);
        stderrHeader = "";
      }

      if (stderrHeader == "" || stdoutHeader == "")
      {
        java.lang.System.out.println("\n\n");
      }

      // In case the caller needs to get the exit code or 
      return process;
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
      // Assume no files are available, initially.
      var defaultDirList =
        [
          {
            name     : "",
            category : "No files available"
          }
        ];

      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        java.lang.System.out.println(
          "getDirectoryListing: not in jetty backend environment; ignoring.");
        return defaultDirList;
      }

      var             dirList = [];
      var             dir;
      var             user;
      var             userData;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             dataDir = playground.dbif.MFiles.DataDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             templateDir = playground.dbif.MFiles.TemplateDir;
      var             defaultUser = playground.dbif.MFiles.DefaultUser;
      var             File = java.io.File;
      var             BufferedReader = java.io.BufferedReader;
      var             InputStreamReader = java.io.InputStreamReader;

      var addFiles = function(dirData)
      {
        var             i;
        var             files;
        var             name;
        var             gitDir;
        var             process;
        var             reader;
        var             line;
        var             hash;
        var             versionDate;
        var             versionNum;

        // Open the directory
        dir = new File(dirData.name);

        // Obtain its files (if any).
        files = dir.listFiles();

        // Was it a directory?
        if (files != null)
        {
          // Yup. Enumerate any files within.
          for (i = 0; i < files.length; i++)
          {
            // Retrieve the file name
            name = String(files[i].getName());

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
              process = this.__exec(
                [ 
                  "git",
                  "log",
                  "--format=format:%h/%cr (%s)"
                ],
                gitDir);

              // Get access to the program output
              reader =
                new BufferedReader(
                  new InputStreamReader(process.getInputStream()));

              // Read each line, and add an entry to the directory list
              for (versionNum = 0;
                   (line = reader.readLine()) != null;
                   ++versionNum)
              {
                // Extract the hash and version date portions
                line = String(line).split("/");
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
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
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
        // ... then use an empty array
        userData.templatesFrom = [];
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
      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        java.lang.System.out.println("getProgram: not in jetty backend environment; ignoring.");
        return { name : programName, code : "" };
      }

      var             ret;
      var             user;
      var             userData;
      var             line;
      var             reader;
      var             encoded;
      var             decoded;
      var             dir;
      var             ascii;
      var             stringBuilder;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             templatesDir = playground.dbif.MFiles.TemplateDir;
      var             defaultUser = playground.dbif.MFiles.DefaultUser;
      var             FileReader = java.io.FileReader;
      var             BufferedReader = java.io.BufferedReader;
      var             StringBuilder = java.lang.StringBuilder;
      
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
        user = playground.dbif.MDbifCommon.getCurrentUserId();
      
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
          // ... then use an empty array
          userData.templatesFrom = [];
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
              this.__exec(
                [ 
                  "git",
                  "checkout",
                  "-f",
                  hash
                ],
                dir);
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

        // Prepare to read the file
        reader = new BufferedReader(new FileReader(dir + "/" + programName));
        stringBuilder = new StringBuilder();
        
        // Read the first line
        if ((line = reader.readLine()) != null)
        {
          stringBuilder.append(line);
        }
        
        // Read subsequent lines, prepending a newline to each
        while ((line = reader.readLine()) != null)
        {
          stringBuilder.append("\n");
          stringBuilder.append(line);
        }

        // Do we need to revert to HEAD?
        if (userId === user && category == "My Programs" && hash)
        {
          // Yup. Revert to HEAD
          this.__exec(
            [ 
              "git",
              "checkout",
              "-f",
              "master"
            ],
            dir);
        }

        ret =
          {
            name : programName,
            code : String(stringBuilder.toString())
          };
        
        // ONly add the directory listing if specifically requested to
        if (bRefreshDirectoryListing)
        {
          ret.dirList = this.getDirectoryListing();
        }
        
        return ret;
      }
      catch (e)
      {
        var             exception;

        java.lang.System.out.println("\ngetProgram() exception: ");

        if (e.rhinoException != null)
        {
          e.rhinoException.printStackTrace();
        }
        else if (e.javaException != null)
        {
          e.javaException.printStackTrace();
        }
        else
        {
          java.lang.System.out.println("Can't display stack trace");
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
     *             1 = new name already exists
     *             2 = rename failed
     *   name    - upon success only, the new file name
     *   dirList - upon success only, a new directory listing
     */
    renameProgram : function(oldName, newName, code)
    {
      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        java.lang.System.out.println("renameProgram: " +
                    "not in jetty backend environment; ignoring.");
        return { status : -1 };
      }
      
      var             dir;
      var             user;
      var             fileOld;
      var             fileNew;
      var             File = java.io.File;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      
      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Build the directory path to the user's program directory
      dir = userFilesDir + "/" + user + "/" + progDir;


      // Protect from malicious use of the old and new file names
      oldName = this.__sanitizeFilename(oldName);
      newName = this.__sanitizeFilename(newName);

      // Check for an existing file of the new name
      fileNew = new File(dir + "/" + newName + ".git");
      if (fileNew.exists())
      {
        java.lang.System.out.println("File " + 
                    dir + "/" + newName + ".git already exists.");
        return { status : 1 };
      }

      // Get a reference to the existing file
      fileOld = new File(dir + "/" + oldName + ".git");
      if (! fileOld.renameTo(fileNew))
      {
        // Couldn't rename it for some reason.
        java.lang.System.out.println("Could not rename file " + 
                    dir + "/" + oldName + ".git" + " to " +
                    dir + "/" + newName + ".git");
        return { status : 2 };
      }

      // Move the source file
      this.__exec(
        [ 
          "git",
          "mv",
          oldName,
          newName
        ],
        dir + "/" + newName + ".git");

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
      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        java.lang.System.out.println("removeProgram: " +
                    "not in jetty backend environment; ignoring.");
        return { status : -1 };
      }
      
      var             dir;
      var             user;
      var             newName;
      var             fileOld;
      var             fileNew;
      var             attempt;
      var             maxAttempts = 10;
      var             File = java.io.File;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      
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
          java.lang.System.out.println("Could not find a timestamped name to delete file " +
                      name);
          return { status : 1 };
        }

        // Append the current timestamp to the git directory name
        newName = name + ".git." + (new Date()).getTime();

        // Check for an existing file of the new name
        fileNew = new File(dir + "/" + newName);
      } while (fileNew.exists());

      // Get a reference to the existing file's git directory
      fileOld = new File(dir + "/" + name + ".git");
      if (! fileOld.renameTo(fileNew))
      {
        // Couldn't rename it for some reason.
        java.lang.System.out.println("Could not rename file " + 
                    dir + "/" + name + ".git" + " to " +
                    dir + "/" + newName);
        return { status : 2 };
      }

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
      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        java.lang.System.out.println("copyProgram: not in jetty backend environment; ignoring.");
        return -1;
      }

      var             user;
      var             ret;
      var             exitValue;
      var             reader;
      var             writer;
      var             line;
      var             cmd;
      var             hash;
      var             toDir;
      var             fromDir;
      var             isGit;
      var             fileNew;
      var             stringBuilder;
      var             userFilesDir = playground.dbif.MFiles.UserFilesDir;
      var             progDir = playground.dbif.MFiles.ProgDir;
      var             templatesDir = playground.dbif.MFiles.TemplateDir;
      var             Runtime = java.lang.Runtime;
      var             File = java.io.File;
      var             BufferedReader = java.io.BufferedReader;
      var             InputStreamReader = java.io.InputStreamReader;
      var             PrintWriter = java.io.PrintWriter;
      var             FileReader = java.io.FileReader;
      var             StringBuilder = java.lang.StringBuilder;
      
      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Protect from malicious use of the file names
      fromName = this.__sanitizeFilename(fromName);
      toName = this.__sanitizeFilename(toName);

      // Create the destination git directory name
      toDir = 
        userFilesDir + "/" + user + "/" + progDir + "/" + toName + ".git";

      // Check for an existing directory of the new name
      fileNew = new File(toDir);
      if (fileNew.exists())
      {
        java.lang.System.out.println("Directory " + toDir + " already exists.");
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

      // Is the source is already a git repository
      if (! isGit)
      {
        // No. Read the existing file and treat it as a brand new file for
        // this user.
        try
        {
          // ... then read the source file
          reader = new BufferedReader(new FileReader(fromDir + "/" + fromName));
          stringBuilder = new StringBuilder();

          // Read the first line
          if ((line = reader.readLine()) != null)
          {
            stringBuilder.append(line);
          }

          // Read subsequent lines, prepending a newline to each
          while ((line = reader.readLine()) != null)
          {
            stringBuilder.append("\n");
            stringBuilder.append(line);
          }
          
          // Now we can treat this as a brand new file with no git history
          this._saveProgram(
            toName,
            "copied",
            String(stringBuilder.toString()));
        }
        catch (e)
        {
          java.lang.System.out.println("\n\nFailed to copy user's code " +
                      ": " + e + "\n\n");
        }
      }
      else
      {
        // We're copying an existing git directory to a new one.
        // Clone the original git directory to the new one.
        this.__exec(
          [ 
            "git",
            "clone",
            fromDir,
            toDir
          ]);
      }

      // Add a Notes entry to show that it was copied
      this.__exec(
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
        toDir);

      return (
        {
          status  : 0,
          name    : toName,
          dirList : this.getDirectoryListing()
        });
    }
  }
});
