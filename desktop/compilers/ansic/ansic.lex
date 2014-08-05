/**
 * Tokens for ANSI C
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

D			[0-9]
L			[a-zA-Z_]
H			[a-fA-F0-9]
E			[Ee][+-]?{D}+
FS			("f"|"F"|"l"|"L")
IS			("u"|"U"|"l"|"L")*
STAR                    [*]
SLASH                   ("/")
SQ                      ("'")
NL                      [\n]

%s typedef_mode
%x inc

%%
{SLASH}{SLASH}.* { }
{SLASH}{STAR}({SLASH}|(.|{NL})|{STAR}+(.|{NL}))*?{STAR}+{SLASH} { }

"@include"              {
    // The preprocessor converts #include to @include for us.
    
    if (playground.c.lib.Symtab.getCurrent().getName() != "*")
    {
      playground.c.lib.Node.getError().parseError(
        "#include may only be used at the top level (global scope)",
        { line : yylineno, loc : yy.lexer.yylloc, displayError : true });
    }
    else
    {
      this.begin('inc');
    }
}

"auto"			{ return(parser.symbols_.AUTO); }
"break"			{ return(parser.symbols_.BREAK); }
"case"			{ return(parser.symbols_.CASE); }
"char"			{ return(parser.symbols_.CHAR); }
"const"			{ return(parser.symbols_.CONST); }
"continue"		{ return(parser.symbols_.CONTINUE); }
"default"		{ return(parser.symbols_.DEFAULT); }
"do"			{ return(parser.symbols_.DO); }
"double"		{ return(parser.symbols_.DOUBLE); }
"else"			{ return(parser.symbols_.ELSE); }
"enum"			{ return(parser.symbols_.ENUM); }
"extern"		{ return(parser.symbols_.EXTERN); }
"float"			{ return(parser.symbols_.FLOAT); }
"for"			{ return(parser.symbols_.FOR); }
"goto"			{ return(parser.symbols_.GOTO); }
"if"			{ return(parser.symbols_.IF); }
"int"			{ return(parser.symbols_.INT); }
"long"			{ return(parser.symbols_.LONG); }
"register"		{ return(parser.symbols_.REGISTER); }
"return"		{ return(parser.symbols_.RETURN); }
"short"			{ return(parser.symbols_.SHORT); }
"signed"		{ return(parser.symbols_.SIGNED); }
"sizeof"		{ return(parser.symbols_.SIZEOF); }
"static"		{ return(parser.symbols_.STATIC); }
"struct"		{
                          playground.c.lib.Node.bSawStruct = true;
                          return(parser.symbols_.STRUCT);
                        }
"switch"		{ return(parser.symbols_.SWITCH); }
"typedef"		{ return(parser.symbols_.TYPEDEF); }
"union" 		{
                          playground.c.lib.Node.bSawStruct = true;
                          return(parser.symbols_.UNION);
                        }
"unsigned"		{ return(parser.symbols_.UNSIGNED); }
"void"			{ return(parser.symbols_.VOID); }
"volatile"		{ return(parser.symbols_.VOLATILE); }
"while"			{ return(parser.symbols_.WHILE); }

{L}({L}|{D})*		{
                          var             sym;

                          sym = playground.c.lib.Symtab.getCurrent().get(
                              yytext, false);
                          return (sym &&
                                  sym.getIsType() &&
                                  ! playground.c.lib.Node.bSawStruct
                                  ? parser.symbols_.TYPE_NAME
                                  : parser.symbols_.IDENTIFIER);
                        }

{D}+{E}{FS}?		{ return(parser.symbols_.CONSTANT_FLOAT); }
{D}*"."{D}+({E})?{FS}?	{ return(parser.symbols_.CONSTANT_FLOAT); }
{D}+"."{D}*({E})?{FS}?	{ return(parser.symbols_.CONSTANT_FLOAT); }

0[xX]{H}+{IS}?		{ return(parser.symbols_.CONSTANT_HEX); }
0{D}+{IS}?		{ return(parser.symbols_.CONSTANT_OCTAL); }
{D}+{IS}?		{ return(parser.symbols_.CONSTANT_DECIMAL); }
"L"?{SQ}(\\.|[^\\{SQ}])+{SQ}	{ return(parser.symbols_.CONSTANT_CHAR); }

"L"?\"(\\.|[^\\"])*\"	{ return(parser.symbols_.STRING_LITERAL); }

"..."			{ return(parser.symbols_.ELLIPSIS); }
">>="			{ return(parser.symbols_.RIGHT_ASSIGN); }
"<<="			{ return(parser.symbols_.LEFT_ASSIGN); }
"+="			{ return(parser.symbols_.ADD_ASSIGN); }
"-="			{ return(parser.symbols_.SUB_ASSIGN); }
"*="			{ return(parser.symbols_.MUL_ASSIGN); }
"/="			{ return(parser.symbols_.DIV_ASSIGN); }
"%="			{ return(parser.symbols_.MOD_ASSIGN); }
"&="			{ return(parser.symbols_.AND_ASSIGN); }
"^="			{ return(parser.symbols_.XOR_ASSIGN); }
"|="			{ return(parser.symbols_.OR_ASSIGN); }
">>"			{ return(parser.symbols_.RIGHT_OP); }
"<<"			{ return(parser.symbols_.LEFT_OP); }
"++"			{ return(parser.symbols_.INC_OP); }
"--"			{ return(parser.symbols_.DEC_OP); }
"->"			{ return(parser.symbols_.PTR_OP); }
"&&"			{ return(parser.symbols_.AND_OP); }
"||"			{ return(parser.symbols_.OR_OP); }
"<="			{ return(parser.symbols_.LE_OP); }
">="			{ return(parser.symbols_.GE_OP); }
"=="			{ return(parser.symbols_.EQ_OP); }
"!="			{ return(parser.symbols_.NE_OP); }
";"			{ return(';'); }
("{")   		{ return(parser.symbols_.LBRACE); }
("}")           	{ return(parser.symbols_.RBRACE); }
","			{ return(','); }
":"			{ return(':'); }
"="			{ return('='); }
"("			{ return('('); }
")"			{ return(')'); }
("[")   		{ return('['); }
("]")           	{ return(']'); }
"."			{ return('.'); }
"&"			{ return('&'); }
"!"			{ return('!'); }
"~"			{ return('~'); }
"-"			{ return('-'); }
"+"			{ return('+'); }
"*"			{ return('*'); }
"/"			{ return('/'); }
"%"			{ return('%'); }
"<"			{ return('<'); }
">"			{ return('>'); }
"^"			{ return('^'); }
"|"			{ return('|'); }
"?"			{ return('?'); }

[ \t\v\r\n\f]		{ }
.			{
    /* bad character */
    playground.c.lib.Node.getError().parseError(
      "Unexpected character: " + yytext,
      { line : yylineno, loc : yy.lexer.yylloc, displayError : true });
}


<inc>\"(\\.|[^\\"])*\"  {
    //
    // NOTE: This error isn't caught here. See Main.js where the included
    // files are handled.

    // (FIXME: This code is never hit. Find out why.)
    //
    // (It's probably not hit because we now have a preprocessor, so once
    // the preprocessor has run, we never get into the <inc> state. That would
    // apply to all of the code from here onwards in this file, and it can
    // probably all be deleted now. Confirm this hypothesis.)
    //
    playground.c.lib.Node.getError().parseError(
        "#include for local files (with quotes) " +
        "is not yet supported: " + yytext + "\n" +
        "If it's a system include file, you should use angle brackets " +
        "instead: " +
        " <" + yytext.substr(1, yytext.length - 2) + ">",
        { line : yylineno, loc : yy.lexer.yylloc, displayError : true });
}

<inc>\<(\\.|[^\\>])*\>  {
                          var             include;
                          var             finalize;
                          var             name;
                          var             error;

                          name = yytext.substr(1, yytext.length - 2);
                          switch(name)
                          {
                          case "ctype.h" :
                            include = function()
                            {
                              return (
                                playground.c.builtin.Ctype.include(name,
                                                                   yylineno));
                            };
                            break;

                          case "math.h" :
                            include = function()
                            {
                              return (
                                playground.c.builtin.Math.include(name,
                                                                  yylineno));
                            };
                            break;

                          case "stdio.h" :
                            include = function()
                            {
                              return (
                                playground.c.stdio.Stdio.include(name,
                                                                 yylineno));
                            };
                            finalize = function()
                            {
                              playground.c.stdio.Stdio.finalize();
                            };
                            break;

                          case "stdlib.h" :
                            include = function()
                            {
                              return (
                                playground.c.builtin.Stdlib.include(name,
                                                                    yylineno));
                            };
                            finalize = function()
                            {
                              playground.c.builtin.Stdlib.finalize();
                            };
                            break;

                          default :
                            playground.c.lib.Node.getError().parseError(
                              "Include file not found (" + yytext + ")",
                              {
                                line : yylineno,
                                loc : yy.lexer.yylloc,
                                displayError : true
                              }); 
                            return;
                          }

                          // Add this include function to list of initializers
                          // so it'll be re-included after parsing
                          playground.c.Main.includes.push(include);

                          // If there's a finalization function, save it too
                          if (finalize)
                          {
                            playground.c.Main.finalize.push(finalize);
                          }

                          // Include it now, for continued parsing
                          error = include();
                          if (error)
                          {
                            playground.c.lib.Node.getError().parseError(
                                error.message,
                                {
                                  line : error.node.line,
                                  loc : yy.lexer.yylloc,
                                  displayError : true
                                });
                            return;
                          }
                        }

<inc>[ \t\v\f]  	{ }

<inc>{NL}               { this.begin('INITIAL'); }

%%
