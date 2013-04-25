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

"#include"              { this.begin('inc'); }

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
"struct"		{ return(parser.symbols_.STRUCT); }
"switch"		{ return(parser.symbols_.SWITCH); }
"typedef"		{ return(parser.symbols_.TYPEDEF); }
"union"			{ return(parser.symbols_.UNION); }
"unsigned"		{ return(parser.symbols_.UNSIGNED); }
"void"			{ return(parser.symbols_.VOID); }
"volatile"		{ return(parser.symbols_.VOLATILE); }
"while"			{ return(parser.symbols_.WHILE); }

{L}({L}|{D})*		{
                          var             sym;

                          sym = playground.c.lib.Symtab.getCurrent().get(
                              yytext, false);
                          return (sym && sym.getIsType()
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

[ \t\v\n\f]		{ }
.			{ /* ignore bad characters */ }


<inc>\"(\\.|[^\\"])*\"  {       playground.c.lib.Node.getError().parseError(
        "Local file includes (with quotes) " +
        "are not yet supported (" + yytext + ")\n" +
        "If it's a system include file, you should use angle brackets: " +
        " <" + yytext.substr(1, yytext.length - 2) + ">",
        { line : yylineno });
}

<inc>\<(\\.|[^\\>])*\>  {
                          var             f;
                          var             name;
                          var             error;

                          name = yytext.substr(1, yytext.length - 2);
                          switch(name)
                          {
                          case "stdio.h" :
                            f = function()
                            {
                              return (
                                playground.c.stdio.Stdio.include(name,
                                                                 yylineno));
                            };
                            break;

                          case "stdlib.h" :
                            f = function()
                            {
                              return (
                                playground.c.builtin.Stdlib.include(name,
                                                                    yylineno));
                            };
                            break;

                          default :
                            playground.c.lib.Node.getError().parseError(
                              "Include file not found (" + yytext + ")",
                              { line : yylineno }); 
                            return;
                          }

                          // Add this function to list of include initializers
                          // so it'll be re-included after parsing
                          playground.c.Main.includes.push(f);

                          // Include it now, for continued parsing
                          error = f();
                          if (error)
                          {
                            playground.c.lib.Node.getError().parseError(
                                error.message,
                                { line : error.node.line });
                            return;
                          }
                        }

<inc>[ \t\v\f]  	{ }

<inc>{NL}               { this.begin('INITIAL'); }

%%
