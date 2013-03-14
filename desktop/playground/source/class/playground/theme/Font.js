/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
   * Sebastian Werner (wpbasti)
   * Andreas Ecker (ecker)

************************************************************************* */

/**
 * The custom font theme for the playground.
 */
qx.Theme.define("playground.theme.Font",
{
  extend : qx.theme.indigo.Font,

  fonts :
  {
    "default" :
    {
      size : 12,
      family : ["Lucida Grande", "DejaVu Sans", "Verdana", "sans-serif"],
      color: "font"
    },

    "bold" :
    {
      size : 12,
      family : ["Lucida Grande", "DejaVu Sans", "Verdana", "sans-serif"],
      bold : true,
      color: "font"
    },

    "headline" :
    {
      size : 22,
      family : ["serif"],
      sources:
      [
        {
          family : "JosefinSlab",
          source: [
            "qx/decoration/Indigo/font/JosefinSlab-SemiBold.woff",
            "qx/decoration/Indigo/font/JosefinSlab-SemiBold.ttf"
          ]
        }
      ]
    },

    "small" :
    {
      size : 11,
      family : ["Lucida Grande", "DejaVu Sans", "Verdana", "sans-serif"],
      color: "font",
      lineHeight: 1.8
    },

    "monospace" :
    {
      size : 11,
      family : [ "DejaVu Sans Mono", "Courier New", "monospace" ],
      color: "font"
    },

    "header" :
    {
      size : (qx.core.Environment.get("os.name") == "win" &&
        (qx.core.Environment.get("os.version") == "7" ||
        qx.core.Environment.get("os.version") == "vista")) ? 16 : 15,
      lineHeight : 1.4,
      family : qx.core.Environment.get("os.name") == "osx" ?
        [ "Lucida Grande" ] :
        ((qx.core.Environment.get("os.name") == "win" &&
          (qx.core.Environment.get("os.version") == "7" ||
          qx.core.Environment.get("os.version") == "vista"))) ?
        [ "Segoe UI", "Candara" ] :
        [ "Tahoma", "Liberation Sans", "Arial", "sans-serif" ]
    },


    "jsFiddle" :
    {
      size : 40,
      family : ["serif"],
      sources:
      [
        {
          family : "JosefinSlab",
          source: [
            "qx/decoration/Indigo/font/JosefinSlab-SemiBold.woff",
            "qx/decoration/Indigo/font/JosefinSlab-SemiBold.ttf"
          ]
        }
      ]
    }
  }
});
