/**
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

qx.Mixin.define("playground.dbif.MGit",
{
  construct : function()
  {
    //
    // Register the remote procedure call services available in this mixin
    //
    
    // Initialize a user
    this.registerService("learncs.saveProgram",
                         this.saveProgram,
                         [ ]);
  },

  members :
  {
    /**
     * Save a program via git.
     *
     * @return {Integer}
     *   0 upon success; 1 if not in the correct backend environment
     */
    saveProgram : function(programName, detail, code)
    {
      // This functionality is only supported under jetty at present. It is
      // highly dependent upon java.
      if (liberated.dbif.Entity.getCurrentDatabaseProvider() != "jettysqlite")
      {
        console.log("saveProgram: not in jetty backend environment; ignoring.");
        return 1;
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
      var             userCodeDir = "USERCODE";
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
      gitDir = userCodeDir + "/" + user + "/" + programName + ".git";

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
    }
  }
});
