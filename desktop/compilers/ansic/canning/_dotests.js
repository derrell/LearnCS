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
    },
    
    {
      name  : "p202-string-copy.c",
      args  : "hello"
    },
    
    {
      name  : "p203-malloc-array-of-structs.c"
    },

    {
      name  : "p205-malloc-struct-array-print-reverse.c"
    },

    {
      name  : "p206-push-pop.c"
    },

    {
      name  : "p207-rpn-calculator.c",
      stdin : "1 2 + p 1 2 s + p 3 5 - p 2 2 * 3 3 * * p 2 3 + 4 s * p 2 + a q"
    },

    {
      name  : "t001-global-pointer-initialized.c"
    },
    {
      name  : "t002-decl-after-stmt.c"
    },
    {
      name  : "t003-forward-decl.c"
    },
    {
      name  : "t004-forward-decl-missing.c"
    },
    {
      name  : "t005-forward-decl-only.c"
    },
    {
      name  : "t006-struct-decl-and-access.c"
    },
    {
      name  : "t007-struct-pointer-deref.c"
    },
    {
      name  : "t008-struct-redeclaration.c"
    },
    {
      name  : "t009-union-simple.c"
    },
    
    // t010: Add simple enum test here

    {
      name  : "t011-undef-enum-param.c"
    },
    {
      name   : "t012-preproc-correct-lines-if.c",
      extras : [ "--preproc" ]
    },
    {
      name   : "t013-preproc-correct-lines-else.c",
      extras : [ "--preproc" ]
    },
    {
      name   : "t014-switch-break.c"
    },
    {
      name   : "t015-switch-no-break.c"
    },
    {
      name   : "t016-switch-default.c"
    },
    {
      name   : "t017-macro-good.c",
      extras : [ "--preproc" ]
    },
    {
      name   : "t018-macro-bad.c",
      extras : [ "--preproc" ]
    },
    {
      name   : "t019-fscanf-null-handle.c"
    },
    {
      name   : "t020-fscanf-bad-handle.c"
    },
    {
      name   : "t021-preproc-leading-blank-lines.c",
      extras : [ "--preproc" ]
    },
    {
      name   : "t022-array-initialize.c"
    },
    {
      name   : "t023-array-initialize-bad-1.c"
    },
    {
      name   : "t024-call-int-as-func.c"
    },
    {
      name   : "t025-call-function-via-pointer.c"
    },
    {
      name   : "t026-struct-initialize.c"
    },
    {
      name   : "t027-union-initialize.c"
    },
    {
      name   : "t028-global-struct-decl.c"
    },
    {
      name   : "t029-include-missing-right-angle.c"
    },
    {
      name   : "t030-include-missing-left-angle.c"
    },
    {
      name   : "t031-include-missing-both-angles.c"
    },
    {
      name   : "t032-include-with-quotes.c"
    },
    {
      name   : "t033-include-missing-right-quote.c"
    },
    {
      name   : "t034-include-missing-left-quote.c"
    },
    {
      name   : "t035-ctype.c"
    },
    {
      name   : "t036-assignment-error-1.c"
    },
    {
      name   : "t037-assignment-error-2.c"
    },
    {
      name   : "t038-assignment-error-3.c"
    },
    {
      name   : "t039-multiple-case.c"
    },
    {
      name   : "t040-case-enum.c"
    },
    {
      name   : "t041-case-const.c"
    },
    {
      name   : "t042-non-special-escape.c"
    },
    {
      name   : "t043-for-loop-comma-list.c"
    },
    {
      name   : "t044-enum-value-lvalue.c"
    },
    {
      name   : "t045-math.c"
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
       "../dcc",
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

   // Add any extra arguments
   Array.prototype.push.apply(cmd, test.extras || []);

   console.log("% " + cmd.join(" ") +
               (test.stdin ? "\n" + test.stdin.toString() : ""));
   exec(cmd.join(" "), putsAndNextTest);

 //exec("ls -la > /tmp/xxx", puts);

 })(tests.shift());

