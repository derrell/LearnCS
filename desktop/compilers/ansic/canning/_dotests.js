#!/usr/bin/nodejs

var sys = require('sys');
var exec = require('child_process').exec;

var tests =
  [
    {
      name  : "p001-helloworld.c"
    },

    {
      name  : "p002-value6.c"
    },

    {
      name  : "p003-charP.c"
    },

    {
      name  : "p004-scanf.c",
      stdin : "42"
    },

    {
      name  : "p005-sum-of-two-values.c",
      stdin : "23 42"
    },

    {
      name  : "p006-fscanf.c"
    },


    {
      name  : "p007-bigger-than-100.c",
      stdin : "99"
    },
    {
      name  : "p007-bigger-than-100.c",
      stdin : "100"
    },
    {
      name  : "p007-bigger-than-100.c",
      stdin : "101"
    },


    {
      name  : "p008-horizontal-line.c"
    },

    {
      name  : "p009-using-for-loop.c"
    },

    {
      name  : "p010-sum-of-twenty.c"
    },


    {
      name  : "p011-equal-to-zero.c",
      stdin : "-1"
    },
    {
      name  : "p011-equal-to-zero.c",
      stdin : "0"
    },
    {
      name  : "p011-equal-to-zero.c",
      stdin : "1"
    },


    {
      name  : "p012-pos-neg-zero.c",
      stdin : "-1"
    },
    {
      name  : "p012-pos-neg-zero.c",
      stdin : "0"
    },
    {
      name  : "p012-pos-neg-zero.c",
      stdin : "1"
    },


    {
      name  : "p013-abs-function.c",
      stdin : "3"
    },
    {
      name  : "p013-abs-function.c",
      stdin : "-4"
    },


    {
      name  : "p015-sqrt-function.c",
      stdin : "2"
    },

    {
      name  : "p016-sine-atof.c",
      args : "3.1415926"
    },
    {
      name  : "p016-sine-atof.c",
      args  : "1.570796"
    },


    {
      name  : "p017-count-characters.c",
      stdin : "hello world."
    },

    {
      name  : "p018-solidbox.c",
      stdin : "8 5"
    },

    {
      name  : "p019-area-of-rectangle.c",
      stdin : "5 8"
    },
    {
      name  : "p019-area-of-rectangle.c",
      stdin : "2.3 8"
    },

    {
      name  : "p020-area-of-circle.c",
      stdin : "1"
    },
    {
      name  : "p020-area-of-circle.c",
      stdin : "2"
    },


    {
      name  : "p021-argv.c",
      args  : "hello world"
    },

    {
      name  : "p022-reverse-command-line.c",
      args  : "hello world"
    },

    {
      name  : "p023-scanf-returns-what.c"
    },

    {
      name  : "p024-one-dim-array.c"
    },

    {
      name  : "p025-sum-of-bunch.c"
    },

    {
      name  : "p026-fgetc-and-toupper.c"
    },

    {
      name  : "p027-reverse.c",
      stdin : " 2 3 4 5 6 7 8 9 10 11 12 13 "
    },

    {
      name  : "p028-digit-sum.c"
    },

    {
      name  : "p029-average.c"
    },

    {
      name  : "p030-unfilledbox.c",
      stdin : "8 5"
    },

    {
      name  : "p038-blank-removal.c",
      args  : "/canning/p038-input"
    },

    {
      name  : "p054-fibonacci-iterative.c",
      stdin : "5"
    },
    {
      name  : "p054-fibonacci-iterative.c",
      stdin : "8"
    },
    {
      name  : "p054-fibonacci-iterative.c",
      stdin : "12"
    },


    {
      name  : "p055-fibonacci-recursive.c",
      stdin : "5"
    },
    {
      name  : "p055-fibonacci-recursive.c",
      stdin : "8"
    },
    {
      name  : "p055-fibonacci-recursive.c",
      stdin : "12"
    }
  ];

(function runTest(test)
 {
   var             cmd;

   console.error("Running test: " + test.name);

   var putsAndNextTest = function(error, stdout, stderr)
   {
     if (error)
     {
       console.log("ERROR: " + error);
     }

     if (stderr)
     {
       console.log("STDERR: " + stderr);
     }

     console.log("STDOUT: " + stdout);
     
     // If there are more tests...
     if (tests.length > 0)
     {
       // ... then run the next test
       runTest(tests.shift());
     }
   };


   // Create the generic portion of the command
   cmd =
     [
       "nodejs ../ansic.js",
       test.name,
       "--rootdir=/home/derrell/ME"
     ];

   // If there is standard input...
   if (test.stdin)
   {
     // ... then echo it and pipe to standard input
     cmd.unshift("echo '" + test.stdin + "' | ");
   }

   // If there are command line arguments...
   if (test.args)
   {
     // ... then provide them
     cmd.push("--cmdline='" + test.args.toString() + "'");
   }

   console.log("% " + cmd.join(" ") +
               (test.stdin ? "\n" + test.stdin.toString() : ""));
   exec(cmd.join(" "), putsAndNextTest);

 //exec("ls -la > /tmp/xxx", puts);

 })(tests.shift());

