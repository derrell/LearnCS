//
// Create a new user
// 
//   Example usage:
//     nodejs newuser.js derrell password "Derrell Lipman"
//

var             db;
var             dbName = "../learncs.db";
var             thisFile;
var             username;
var             password;
var             passwordHash;
var             fullname;
var             crypto = require('crypto');
var             shasum = crypto.createHash('sha1');
var             sqlite3 = require("sqlite3");


// Arguments to be received:
//  0 : the node command, e.g., "nodejs"
//  1 : path to this file
//  2 : user name to create (typically user's email address)
//  3 : user's password, which will be hashed
thisFile = process.argv[1].split("/");

if (process.argv.length != 5)
{
  console.log("Usage: " + 
              process.argv[0] + " " + 
              thisFile[thisFile.length - 1] + " " +
              "<email_address> <password> <full_name>");
  process.exit(1);
}

// Retrieve the fields to be added to the database
username = process.argv[2];
password = process.argv[3];
fullname = process.argv[4];

process.argv.forEach(
  function(val, index, array)
  {
    switch(index)
    {
    case 2 :
      username = val;
      break;
      
    case 3 :
      password = val;
      shasum.update(password);
      passwordHash = shasum.digest('hex');
      break;
      
    case 4 :
      fullname = val;
      break;
      
    default :
      break;
    }
  });

// Open the database
db = new sqlite3.Database(
  dbName,
  function(err)
  {
    if (err) 
    {
      console.log("Attempting to open database " + dbName + ": " + err);
      process.exit(1);
    }

    db.run(
      [ 
        "INSERT INTO authLocal ",
        "    (username, passwordHash, displayName)",
        "  VALUES ",
        "    (?1, ?2, ?3);"
      ].join(" "),
      [
        username,
        passwordHash,
        fullname
      ],
      function(err)
      {
        if (err)
        {
          console.log("Could not add user: " + err);
          return;
        }

        // Success
        console.log("User " + username + " has been added.");
      });
  });
