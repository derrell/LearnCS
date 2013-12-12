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
     *   0 upon success
     */
    saveProgram : function(programName, detail, code)
    {
      var             user;
      var             ret;
      var             runtime;
      var             process;
      var             reader;
      var             writer;
      var             line;
      var             cmd;
      var             hash;
      var             baseName;
      var             userCodeDir = "USERCODE";
      var             userCodeDirFile;
      var             Runtime = java.lang.Runtime;
      var             File = java.io.File;
      var             BufferedReader = java.io.BufferedReader;
      var             InputStreamReader = java.io.InputStreamReader;
      var             PrintWriter = java.io.PrintWriter;
      
      // Retrieve the current user id
      user = playground.dbif.MDbifCommon.getCurrentUserId();
      
      // Be sure the user's directory has been created
      runtime = Runtime.getRuntime();
      process = runtime.exec("mkdir -p " + userCodeDir + "/" + user);
      process.waitFor();

      // Prepend the directory path to the program name
      baseName = programName;
      programName = user + "/" + programName.replace("..", "DOTDOT");

      // Write the code to a file with the given name
      try
      {
        writer = new PrintWriter(userCodeDir + "/" + programName, "UTF-8");
        writer.print(code);
        writer.close();
      }
      catch (e)
      {
        console.log("\n\nFailed to create user code at " + programName + 
                    ": " + e + "\n\n");
      }

      // Get a File reference for the user code directory
      userCodeDirFile = new File(userCodeDir);



      cmd = [ "git", "add", programName ];
      console.log("exec: [" + cmd.join(",") + "]");
      process = runtime.exec(cmd, null, userCodeDirFile);
      process.waitFor();
      console.log("exit code: " + process.exitValue());

      console.log("STDERR:");
      reader =
        new BufferedReader(new InputStreamReader(process.getErrorStream()));
      while ((line = reader.readLine()) != null) 
      {
        console.log(line);
      }

      console.log("STDOUT:");
      reader =
        new BufferedReader(new InputStreamReader(process.getInputStream()));
      while ((line = reader.readLine()) != null) 
      {
        console.log(line);
      }
      
      console.log("\n\n");



      cmd =
        [
          "git",
          "commit",
          "-m",
          detail,
          "--",
          programName
        ];
      console.log("exec: [" + cmd.join(",") + "]");
      process = runtime.exec(cmd, null, userCodeDirFile);
      process.waitFor();
      console.log("exit code: " + process.exitValue());

      console.log("STDERR:");
      reader =
        new BufferedReader(new InputStreamReader(process.getErrorStream()));
      
      while ((line = reader.readLine()) != null) 
      {
        console.log(line);
      }

      console.log("STDOUT:");
      reader =
        new BufferedReader(new InputStreamReader(process.getInputStream()));

      // Did the commit succeed?
      if (process.exitValue() == 0)
      {
        // Yup. Retrieve the abbreviated commit hash. It's on the first line,
        // which looks like this:
        // [master 83cd8db] save button: 1/prog1.c
        line = reader.readLine();
        console.log("Got hash line: " + line);
        hash = String(line).split("]")[0].split(" ")[1];
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
