/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2013-01-23
 * 
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 * 
 * ----------------------------------------------------------------------
 * Derrell Lipman:
 * This is a modified version. It is converted to qooxdoo-style.
 * 
 */

/*global self */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

qx.Class.define("playground.util.FileSaver",
{
  type : "static",
  
  statics :
  {
    // saveAs() function is created in defer()
    saveAs : null
  },
  
  defer : function(statics)
  {
    statics.saveAs = window.saveAs
      || (navigator.msSaveBlob && navigator.msSaveBlob.bind(navigator))
      || (function(view) 
          {
            "use strict";

            var doc = view.document;

            // only get URL when necessary in case BlobBuilder.js hasn't
            // overridden it yet
            var get_URL = function()
            {
                return view.URL || view.webkitURL || view;
            };

            var URL = view.URL || view.webkitURL || view;

            var save_link =
              doc.createElementNS("http://www.w3.org/1999/xhtml", "a");

            var can_use_save_link = "download" in save_link;

            var click = function(node) 
            {
              var event = doc.createEvent("MouseEvents");
              event.initMouseEvent("click", true, false, view, 0, 0, 0, 0, 0,
                                    false, false, false, false, 0, null);
              node.dispatchEvent(event);
            };

            var webkit_req_fs = view.webkitRequestFileSystem;
            var req_fs =
              view.requestFileSystem || 
              webkit_req_fs || 
              view.mozRequestFileSystem;

            var throw_outside = function (ex) 
            {
              (view.setImmediate ||
               view.setTimeout)(
                function() 
                {
                  throw ex;
                },
                0);
            };

            var force_saveable_type = "application/octet-stream";
            var fs_min_size = 0;
            var deletion_queue = [];
            var process_deletion_queue = function() 
            {
              var i = deletion_queue.length;
              while (i--) 
              {
                var file = deletion_queue[i];
                if (typeof file === "string") 
                { // file is an object URL
                  URL.revokeObjectURL(file);
                }
                else
                { // file is a File
                  file.remove();
                }
              }
              deletion_queue.length = 0; // clear queue
            };

            var dispatch = function(filesaver, event_types, event) 
            {
              event_types = [].concat(event_types);
              var i = event_types.length;
              while (i--) 
              {
                var listener = filesaver["on" + event_types[i]];
                if (typeof listener === "function") 
                {
                  try
                  {
                    listener.call(filesaver, event || filesaver);
                  }
                  catch (ex)
                  {
                    throw_outside(ex);
                  }
                }
              }
            };

            var FileSaver = function(blob, name) 
            {
              // First try a.download, then web filesystem, then object URLs
              var filesaver = this;
              var type = blob.type;
              var blob_changed = false;
              var object_url;
              var  target_view;

              var get_object_url = function() 
              {
                var url = get_URL();
                var object_url = url.createObjectURL(blob);
                deletion_queue.push(object_url);
                return object_url;
              };

              var dispatch_all = function() 
              {
                dispatch(filesaver, 
                         "writestart progress write writeend".split(" "));
              };

              // on any filesys errors revert to saving with object URLs
              var fs_error = function() 
              {
                // don't create more object URLs than needed
                if (blob_changed || !object_url) 
                {
                  object_url = get_object_url(blob);
                }
                if (target_view) 
                {
                  target_view.location.href = object_url;
                }
                filesaver.readyState = filesaver.DONE;
                dispatch_all();
              };

              var abortable = function(func) 
              {
                return function() 
                {
                  if (filesaver.readyState !== filesaver.DONE) 
                  {
                    return func.apply(this, arguments);
                  }

                  return undefined;
                };
              };

              var create_if_not_found = {create: true, exclusive: false};
              var  slice;

              filesaver.readyState = filesaver.INIT;
              if (!name) 
              {
                name = "download";
              }

              if (can_use_save_link) 
              {
                object_url = get_object_url(blob);
                save_link.href = object_url;
                save_link.download = name;
                click(save_link);
                filesaver.readyState = filesaver.DONE;
                dispatch_all();
                return;
              }

              // Object and web filesystem URLs have a problem saving in
              // Google Chrome when viewed in a tab, so I force save with
              // application/octet-stream
              // http://code.google.com/p/chromium/issues/detail?id=91158
              if (view.chrome && type && type !== force_saveable_type) 
              {
                slice = blob.slice || blob.webkitSlice;
                blob = slice.call(blob, 0, blob.size, force_saveable_type);
                blob_changed = true;
              }

              // Since I can't be sure that the guessed media type will
              // trigger a download in WebKit, I append .download to the
              // filename. https://bugs.webkit.org/show_bug.cgi?id=65440
              if (webkit_req_fs && name !== "download") 
              {
                name += ".download";
              }

              if (type === force_saveable_type || webkit_req_fs) 
              {
                target_view = view;
              }
              else
              {
                target_view = view.open();
              }

              if (!req_fs) 
              {
                fs_error();
                return;
              }

              fs_min_size += blob.size;
              req_fs(view.TEMPORARY, fs_min_size, abortable(
                       function(fs) 
                       {
                         fs.root.getDirectory(
                           "saved",
                           create_if_not_found, abortable(
                             function(dir) 
                             {
                               var save = function() 
                               {
                                 dir.getFile(
                                   name,
                                   create_if_not_found,
                                   abortable(
                                     function(file) 
                                     {
                                       file.createWriter(
                                         abortable(
                                           function(writer) 
                                           {
                                             writer.onwriteend = 
                                               function(event) 
                                             {
                                               target_view.location.href = 
                                                 file.toURL();
                                               deletion_queue.push(file);
                                               filesaver.readyState = 
                                                 filesaver.DONE;
                                               dispatch(filesaver,
                                                        "writeend",
                                                        event);
                                             };
                                             writer.onerror = function() 
                                             {
                                               var error = writer.error;
                                               if (error.code !== 
                                                   error.ABORT_ERR) 
                                               {
                                                 fs_error();
                                               }
                                             };

                                             [
                                               "writestart",
                                               "progress",
                                               "write",
                                               "abort"
                                             ].forEach(
                                               function(event) 
                                               {
                                                 writer["on" + event] = 
                                                   filesaver["on" + event];
                                               });
                                             writer.write(blob);
                                             filesaver.abort = function() 
                                             {
                                               writer.abort();
                                               filesaver.readyState = 
                                                 filesaver.DONE;
                                             };
                                             filesaver.readyState = 
                                               filesaver.WRITING;
                                           }), fs_error);
                                     }),
                                   fs_error);
                               };
                               dir.getFile(name,
                                           {create: false}, 
                                           abortable(
                                             function(file) 
                                             {
                                               // delete file if it already
                                               // exists
                                               file.remove();
                                               save();
                                             }),
                                           abortable(
                                             function(ex) 
                                             {
                                               if (ex.code === 
                                                   ex.NOT_FOUND_ERR) 
                                               {
                                                 save();
                                               }
                                               else
                                               {
                                                 fs_error();
                                               }
                                             }));
                             }), fs_error);
                       }),
                     fs_error);
            };

            var FS_proto = FileSaver.prototype;
            var saveAs = function(blob, name) 
            {
              return new FileSaver(blob, name);
            };

            FS_proto.abort = function() 
            {
              var filesaver = this;
              filesaver.readyState = filesaver.DONE;
              dispatch(filesaver, "abort");
            };
            FS_proto.readyState = FS_proto.INIT = 0;
            FS_proto.WRITING = 1;
            FS_proto.DONE = 2;

            FS_proto.error = null;
            FS_proto.onwritestart = null;
            FS_proto.onprogress = null;
            FS_proto.onwrite = null;
            FS_proto.onabort = null;
            FS_proto.onerror = null;
            FS_proto.onwriteend = null;

            view.addEventListener("unload", process_deletion_queue, false);
            return saveAs;
    }(self));
    
    console.log("saveAs = " + playground.util.FileSaver.saveAs);
  }
});
