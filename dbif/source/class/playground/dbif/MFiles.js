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
                         [ ]);

    // Save a program
    this.registerService("learncs.saveProgram",
                         this.saveProgram,
                         [ "programName", "detail", "code" ]);

    // Get a program
    this.registerService("learncs.getProgram",
                         this.getProgram,
                         [ "programName", "category", "userId" ]);
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
     * Obtain a directory listing.
     * 
     * @return {Map}
     *   A map containing the elements programs, userFiles, and optionally,
     *   templates and instructorFiles. Each is an array of files in the
     *   specified category.
     */
    getDirectoryListing : function()
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
        console.log("saveProgram: not in jetty backend environment; ignoring.");
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

      function addFiles(dirData)
      {
        var             i;
        var             files;
        var             name;

console.log("Looking for files in [" + dirData.name + "]");
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
console.log("Found file name [" + name + "]");

            // If we're in the program directory, the name ends with ".git",
            // and we must strip that off.
            if (dirData.category == "My Programs")
            {
              name = name.replace(/\.git$/, "");
            }

            // Add this file's name to the map to be returned
            dirList.push(
              {
                name     : name,
                category : dirData.category,
                user     : dirData.user
              });
          }
        }
      }

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
          category : "Standard Templates",
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
          
console.log("Got user " + userId + " data: " + qx.lang.Json.stringify(templateUserData));

          // If the user no longer exists...
          if (! templateUserData || templateUserData.length === 0)
          {
            // ... then we have nothing to do.
            return;
          }

          // Add this user's templates to the list
          addFiles(
            {
              category : "Templates from " + templateUserData[0].displayName,
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

      console.log("getDirectoryListing:\n" +
                  qx.lang.Json.stringify(dirList, null, "  "));
      return dirList;
    },

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
     * @return {String}
     *   The hash of the new file.
     */
    saveProgram : function(programName, detail, code)
    {
      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        console.log("saveProgram: not in jetty backend environment; ignoring.");
        return null;
      }

      var             user;
      var             ret;
      var             runtime;
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
      var             exec;
      var             Runtime = java.lang.Runtime;
      var             File = java.io.File;
      var             BufferedReader = java.io.BufferedReader;
      var             InputStreamReader = java.io.InputStreamReader;
      var             PrintWriter = java.io.PrintWriter;
      
      // Prepare to exec processes
      runtime = Runtime.getRuntime();

      exec = function(cmd, directory)
      {
        var             dirFile;
        var             process;
        var             stderrHeader = "STDERR:\n";
        var             stdoutHeader = "STDOUT:\n";
        
        // Get a handle to the specified directory
        if (directory)
        {
          dirFile = new File(directory);
        }
        else
        {
          dirFile = null;
        }
        
        console.log("exec: [" + cmd.join(",") + "]");
        process = runtime.exec(cmd, null, dirFile);
        process.waitFor();
        console.log("exit code: " + process.exitValue());

        reader =
          new BufferedReader(new InputStreamReader(process.getErrorStream()));
        while ((line = reader.readLine()) != null) 
        {
          console.log(stderrHeader + line);
          stderrHeader = "";
        }

        if (stderrHeader == "" || stdoutHeader == "")
        {
          console.log("\n\n");
        }
        
        // In case the caller needs to get the exit code or 
        return process;
      };

      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Remove dangerous ..
      programName = programName.replace("..", "DOTDOT");
      
      // Replace backslashes with forward slashes
      programName = programName.replace("\\", "/");

      // Strip any double slashes; replace with single slashes
      programName = programName.replace("//", "/");

      // Create the git directory name
      gitDir = 
        userFilesDir + "/" + user + "/" + progDir + "/" + programName + ".git";

      // Be sure the file's git directory has been created
      exec( [ "mkdir", "-p", gitDir ] );

      // Write the code to a file with the given name
      try
      {
        writer = new PrintWriter(gitDir + "/" + programName, "UTF-8");
        writer.print(code);
        writer.close();
      }
      catch (e)
      {
        console.log("\n\nFailed to create user code at " + 
                    gitDir + "/" + programName + 
                    ": " + e + "\n\n");
      }

      // Create the git repository
      exec( [ "git", "init" ], gitDir);
      
      // Add the file to this git repository
      exec( [ "git", "add", programName ], gitDir);

      // Commit the file
      process = exec(
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
        // Yup. Retrieve the abbreviated commit hash. It's on the first line,
        // which looks like this normally:
        // [master 83cd8db] save button: 1/prog1.c
        // and like this on the first commit:
        // [master (root-commit) 83cd8db] save button: 1/prog1.c
        reader =
          new BufferedReader(new InputStreamReader(process.getInputStream()));
        line = reader.readLine();
        console.log("Got hash line: " + line);
        hash = String(line).split("]")[0].split(" ");
        hash = hash[hash.length - 1];
        console.log("hash=" + hash);
      }
      else
      {
        while ((line = reader.readLine()) != null) 
        {
          console.log(line);
        }
      }
      
      console.log("\n");

      return hash;
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
     * @param user {Integer}
     *   The user id of the file's owner.
     *
     * @return {Map}
     *   The map contains the following members:
     *     name - the file name
     *     code - the entire source code of the program
     */
    getProgram : function(programName, category, userId)
    {
      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        console.log("saveProgram: not in jetty backend environment; ignoring.");
        return { name : programName, code : "" };
      }

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
      
      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      try
      {
        // Remove dangerous ..
        programName = programName.replace("..", "DOTDOT");

        // Replace backslashes with forward slashes
        programName = programName.replace("\\", "/");

        // Strip any double slashes; replace with single slashes
        programName = programName.replace("//", "/");

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
        if (userId !=  defaultUser &&
            userId != user &&
            userData.templatesFrom.indexOf(userId) == -1)
        {
          userData.templatesFrom.unshift(user);
          throw new Error("File user id " + userId +
                          " is not an allowable id: " +
                          qx.lang.Json.stringify(userData.templatesFrom));
        }

        // Create the directory name
        if (userId === user)
        {
          if (category == "My Programs")
          {
            dir = 
              userFilesDir + "/" + 
              userId + "/" + 
              progDir + "/" +
              programName + ".git";
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

        console.log("Got file data:\n" + stringBuilder.toString());
        return (
          {
            name : programName,
            code : String(stringBuilder.toString())
          });
      }
      catch (e)
      {
        console.log("\ngetProgram() exception: " + e + "\n");
        return (
          {
            name : programName,
            code : "// Could not retrieve program " + programName
          });
      }
    }
  }
});
