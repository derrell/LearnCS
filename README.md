<span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
**LearnCS!**</span>
is a pedagogical programming environment designed specifically for use by
first-year computer science students. It eliminates, at the course outset, the
need for students to worry about text editors or IDEs, Linux commands, and
compiling.
<span style="font-family: 'trebuchet ms', arial, helvetica,
sans-serif !important;'">
**LearnCS!**</span>
instead provides a web-based environment, immediately accessible, for them to
write, run, and debug programs, using an already-familiar browser-based
interface.

<span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
**LearnCS!**</span>
has an embedded C interpreter (that runs in the browser), which allows the
student to simply click the Run button and obtain immediate results. Many
common syntactical errors yield hints to the student of the likely cause of
their problem. When students use
<span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
**LearnCS!**</span>,
the code editor allows setting breakpoints, and the student may then step
through the program. A depiction of memory is provided to the students, where
they can see, in detail, the state of their program as they step through
it. When they call functions, students learn how arguments and return
locations are pushed onto the stack and memory for automatic local variables
is reserved. They see a visualization that assists them in building a mental
model of the underlying notional machine.

In addition to its direct benefits for students,
<span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
**LearnCS!**</span>
is designed as a research platform for studying how novices learn to
program. Snapshots of student progress are automatically saved on the
<span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
**LearnCS!**</span>
server. Student activity, such as running the program, operations of the
debugger (setting or clearing a breakpoint, stepping through the program,
etc.), and opening or closing the memory depiction are also stored. 

# Installation

The following steps will install a working version of
<span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
**LearnCS!**</span>
on a fresh installation of Kubuntu 14.04.

1. Ensure that required packages are installed

    `apt-get install git sqlite3 nodejs`

1. Obtain
   <span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
   **LearnCS!**</span>

    `git clone https://github.com/derrell/LearnCS.git LearnCS.git`

1. <span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
   **LearnCS!**</span>
   uses some libraries that have their own git repositories. These are called
   "submodules." Retrieve the code for the submodules. This will take a few
   minutes.

    `cd LearnCS.git; git submodule init; git submodule update`

1. Build the C interpreter. 

    `cd desktop/compilers/ansic; make`

1. There are a number of programs and tests that are used to verify that the
   interpreter is working properly. Run those tests.

    `cd canning; ./dotests.sh`

1. The graphical user interface and backend server are built via a single
   command, from the backend directory. Change into that directory.
   
    `cd ../../../../backend-nodesqlite`
    
1. Build the frontend GUI and the backend server.

    `./generate.py build`

1. Add a few template programs that will be available to all users.

    `tar -xvzf USERCODE-initial.tgz`
    
1. Create the <span style="font-family: 'trebuchet ms', arial, helvetica,
sans-serif !important;'"> **LearnCS!**</span> configuration file. This file
is in a directory called _private_.

    `mkdir private; cp learncs-config-TEMPLATE.json private/learncs-config.json`

1. Edit your private configuration file, as required for your site.
  * _url_: The URL which your users will use to access <span style="font-family:
  'trebuchet ms', arial, helvetica, sans-serif !important;'">**LearnCS!**
  </span>. This URL will be used in the link emailed to registering users.
  * _notifyRecipients_: a comma-separated list of email addresses to whom
  notifications will be sent to notify them of user registrations. (Notice that
  in the template configuration file, there is a leading _X_, changing the
  configuration key from _notifyRecipients_ to _XnotifyRecipients_. The
  leading _X_ comments out this entry, so notifications are not sent to
  anyone. If you wish to have notifications sent, remove the leading _X_.)
  * _email_: The entries inside of the braces provide the information
  necessary for contacting your outbound SMTP mail server. This is how <span
  style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'
  "> **LearnCS!**</span> will send registration links to registering users.

1. Change into the deploy directory, from which
   <span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
   **LearnCS!**</span>
   is run.
   
    `cd deploy`
    
1. Start the
   <span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
   **LearnCS!**</span>
   server. Note that HTTPS is disabled (by setting its port to 0) because
   these installation steps do not cover how to create (self-signed or
   otherwise) HTTPS keys/certificates.

    `nodejs ./backend.js http.port=8080 https.port=0 &`

1. Create your primary (initial) user account. (Additional accounts are
created via the _Create a new account_ button in the user interface. Be sure
to test that, later, to ensure that your email configuration is correct.)

    `nodejs newuser.js <your_email_address> <password>, "<full_name>"`

1. Connect to
   <span style="font-family: 'trebuchet ms', arial, helvetica, sans-serif !important;'">
   **LearnCS!**</span>
   using the **Chrome** browser, at
   http://YOUR_SERVER\_NAME\_OR\_IP:8080/

1. Click the botton at the bottom of the page, to create a new account. Follow
   the instructions.

1. Create your course. (This currently requires a bit of SQL entry in
   the database. Contact me for assistance.) 

1. Enjoy!
