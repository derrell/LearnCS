/**
 * Grammar for ANSI C (with some C99 mods)
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

%token IDENTIFIER CONSTANT STRING_LITERAL SIZEOF
%token PTR_OP INC_OP DEC_OP LEFT_OP RIGHT_OP LE_OP GE_OP EQ_OP NE_OP
%token AND_OP OR_OP MUL_ASSIGN DIV_ASSIGN MOD_ASSIGN ADD_ASSIGN
%token SUB_ASSIGN LEFT_ASSIGN RIGHT_ASSIGN AND_ASSIGN
%token XOR_ASSIGN OR_ASSIGN TYPE_NAME

%token TYPEDEF EXTERN STATIC AUTO REGISTER
%token CHAR SHORT INT LONG SIGNED UNSIGNED FLOAT DOUBLE CONST VOLATILE VOID
%token STRUCT UNION ENUM ELLIPSIS

%token CASE DEFAULT IF ELSE SWITCH WHILE DO FOR GOTO CONTINUE BREAK RETURN

%token LBRACE RBRACE

%start start_sym

%%

start_sym
  : translation_unit
  {
    R("start_sym : translation_unit");
    if (error.errorCount == 0)
    {
      var data = {};

      node.display($1);
      symtab.display();

      // Reset the symbol table to a clean state
      symtab.reset();

      // Re-create the root-level symbol table
      symtab.create(null, null, 0);

      // Process the abstract syntax tree.
      node.process($1, data);

      sys.print("\n\nAfter processing...");
      symtab.display();
    }

    sys.print("\nErrors encountered: " + error.errorCount + "\n\n");
  }
  ;

primary_expression
  : identifier
    {
      R("primary_expression : identifier");
      $$ = $1;
    }
  | constant
    {
      R("primary_expression : constant");
      $$ = $1;
    }
  | string_literal
    {
      R("primary_expression : string_literal");
      $$ = $1;
    }
  | '(' expression ')'
    {
      R("primary_expression : '(' expression ')'");
      $$ = $2;
    }
  ;

postfix_expression
  : primary_expression
    {
      R("postfix_expression : primary_expression");
      $$ = node.create("postfix_expression", yytext, yylineno);
      $$.children.push($1);
    }
  | postfix_expression '[' expression ']'
    {
      R("postfix_expression : postfix_expression '[' expression ']'");

      var             array_expression;

      $$ = $1;
      array_expression = node.create("array_expression", yytext, yylineno);
      array_expression.children.push($1);
      array_expression.children.push($3);
      $$.children.push(array_expression);
    }
  | postfix_expression '(' ')'
    {
      R("postfix_expression : postfix_expression '(' ')'");
      $$ = node.create("function_call", yytext, yylineno);
      $$.children.push($1);
      $$.children.push(null);   // no argument_expression_list
    }
  | postfix_expression '(' argument_expression_list ')'
    {
      R("postfix_expression : " +
        "postfix_expression '(' argument_expression_list ')'");
      $$ = node.create("function_call", yytext, yylineno);
      $$.children.push($1);
      $$.children.push($3);
    }
  | postfix_expression '.' identifier
    {
      R("postfix_expression : postfix_expression '.' identifier");

      var             structure_reference;

      $$ = $1;
      structure_reference =
        node.create("structure_reference", yytext, yylineno);
      structure_reference.children.push($3);
      $$.children.push(structure_reference);
    }
  | postfix_expression PTR_OP identifier
    {
      R("postfix_expression : postfix_expression PTR_OP identifier");

      var             pointer_access;

      $$ = $1;
      pointer_access = node.create("pointer_access", yytext, yylineno);
      pointer_access.children.push($3);
      $$.children.push(pointer_access);
    }
  | postfix_expression INC_OP
    {
      R("postfix_expression : postfix_expression INC_OP");
      $$ = node.create("post_increment_op", yytext, yylineno);
      $$.children.push($1);
    }
  | postfix_expression DEC_OP
    {
      R("postfix_expression : postfix_expression DEC_OP");
      $$ = node.create("post_decrement_op", yytext, yylineno);
      $$.children.push($1);
    }
  ;

argument_expression_list
  : assignment_expression
  {
    R("argument_expression_list : assignment_expression");
    $$ = node.create("argument_expression_list", yytext, yylineno);
    $$.children.push($1);
  }
  | argument_expression_list ',' assignment_expression
  {
    R("argument_expression_list : " +
      "argument_expression_list ',' assignment_expression");
    $$ = $1;
    $$.children.push($3);
  }
  ;

unary_expression
  : postfix_expression
  {
    R("unary_expression : postfix_expression");
    $$ = $1;
  }
  | INC_OP unary_expression
  {
    R("unary_expression : INC_OP unary_expression");
    $$ = node.create("pre_increment_op", yytext, yylineno);
    $$.children.push($2);
  }
  | DEC_OP unary_expression
  {
    R("unary_expression : DEC_OP unary_expression");
    $$ = node.create("pre_decrement_op", yytext, yylineno);
    $$.children.push($2);
  }
  | unary_operator cast_expression
  {
    R("unary_expression : unary_operator cast_expression");
    $$ = $1;
    $$.children.push($2);
  }
  | SIZEOF unary_expression
  {
    R("unary_expression : SIZEOF unary_expression");
    $$ = node.create("sizeof", yytext, yylineno);
    $$.children.push($2);
  }
  | SIZEOF '(' type_name ')'
  {
    R("unary_expression : SIZEOF '(' type_name ')'");
    $$ = node.create("sizeof", yytext, yylineno);
    $$.children.push($3);
  }
  ;

unary_operator
  : '&'
  {
    R("unary_operator : '&'");
    $$ = node.create("address_of", yytext, yylineno);
  }
  | '*'
  {
    R("unary_operator : '*'");
    $$ = node.create("dereference", yytext, yylineno);
  }
  | '+'
  {
    R("unary_operator : '+'");
    $$ = node.create("positive", yytext, yylineno);
  }
  | '-'
  {
    R("unary_operator : '-'");
    $$ = node.create("negative", yytext, yylineno);
  }
  | '~'
  {
    R("unary_operator : '~'");
    $$ = node.create("bit_invert", yytext, yylineno);
  }
  | '!'
  {
    R("unary_operator : '!'");
    $$ = node.create("not", yytext, yylineno);
  }
  ;

cast_expression
  : unary_expression
  {
    R("cast_expression : unary_expression");
    $$ = $1;
  }
  | '(' type_name ')' cast_expression
  {
    R("cast_expression : '(' type_name ')' cast_expression");
    $$ = node.create("cast_expression", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($4);
  }
  ;

multiplicative_expression
  : cast_expression
  {
    R("multiplicative_expression : cast_expression");
    $$ = $1;
  }
  | multiplicative_expression '*' cast_expression
  {
    R("multiplicative_expression : " +
      "multiplicative_expression '*' cast_expression");
    $$ = node.create("multiply", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | multiplicative_expression '/' cast_expression
  {
    R("multiplicative_expression : " +
      "multiplicative_expression '/' cast_expression");
    $$ = node.create("divide", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | multiplicative_expression '%' cast_expression
  {
    R("multiplicative_expression : " +
      "multiplicative_expression '%' cast_expression");
    $$ = node.create("mod", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

additive_expression
  : multiplicative_expression
  {
    R("additive_expression : multiplicative_expression");
    $$ = $1;
  }
  | additive_expression '+' multiplicative_expression
  {
    R("additive_expression : " +
      "additive_expression '+' multiplicative_expression");
    $$ = node.create("add", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | additive_expression '-' multiplicative_expression
  {
    R("additive_expression : " +
      "additive_expression '-' multiplicative_expression");
    $$ = node.create("subtract", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

shift_expression
  : additive_expression
  {
    R("shift_expression : additive_expression");
    $$ = $1;
  }
  | shift_expression LEFT_OP additive_expression
  {
    R("shift_expression : shift_expression LEFT_OP additive_expression");
    $$ = node.create("left-shift", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | shift_expression RIGHT_OP additive_expression
  {
    R("shift_expression : shift_expression RIGHT_OP additive_expression");
    $$ = node.create("right-shift", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

relational_expression
  : shift_expression
  {
    R("relational_expression : shift_expression");
    $$ = $1;
  }
  | relational_expression '<' shift_expression
  {
    R("relational_expression : relational_expression '<' shift_expression");
    $$ = node.create("less-than", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | relational_expression '>' shift_expression
  {
    R("relational_expression : relational_expression '>' shift_expression");
    $$ = node.create("greater-than", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | relational_expression LE_OP shift_expression
  {
    R("relational_expression : relational_expression LE_OP shift_expression");
    $$ = node.create("less-equal", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | relational_expression GE_OP shift_expression
  {
    R("relational_expression : relational_expression GE_OP shift_expression");
    $$ = node.create("greater-equal", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

equality_expression
  : relational_expression
  {
    R("equality_expression : relational_expression");
    $$ = $1;
  }
  | equality_expression EQ_OP relational_expression
  {
    R("equality_expression : equality_expression EQ_OP relational_expression");
    $$ = node.create("equal", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | equality_expression NE_OP relational_expression
  {
    R("equality_expression : equality_expression NE_OP relational_expression");
    $$ = node.create("not-equal", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

and_expression
  : equality_expression
  {
    R("and_expression : equality_expression");
    $$ = $1;
  }
  | and_expression '&' equality_expression
  {
    R("and_expression : and_expression '&' equality_expression");
    $$ = node.create("bit-and", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

exclusive_or_expression
  : and_expression
  {
    R("exclusive_or_expression : and_expression");
    $$ = $1;
  }
  | exclusive_or_expression '^' and_expression
  {
    R("exclusive_or_expression : exclusive_or_expression '^' and_expression");
    $$ = node.create("exclusive-or", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

inclusive_or_expression
  : exclusive_or_expression
  {
    R("inclusive_or_expression : exclusive_or_expression");
    $$ = $1;
  }
  | inclusive_or_expression '|' exclusive_or_expression
  {
    R("inclusive_or_expression : " +
      "inclusive_or_expression '|' exclusive_or_expression");
    $$ = node.create("bit-or", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

logical_and_expression
  : inclusive_or_expression
  {
    R("logical_and_expression : inclusive_or_expression");
    $$ = $1;
  }
  | logical_and_expression AND_OP inclusive_or_expression
  {
    R("logical_and_expression : logical_and_expression AND_OP inclusive_or_expression");
    $$ = node.create("and", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

logical_or_expression
  : logical_and_expression
  {
    R("logical_or_expression : logical_and_expression");
    $$ = $1;
  }
  | logical_or_expression OR_OP logical_and_expression
  {
    R("logical_or_expression : " +
      "logical_or_expression OR_OP logical_and_expression");
    $$ = node.create("or", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

conditional_expression
  : logical_or_expression
  {
    R("conditional_expression : logical_or_expression");
    $$ = $1;
  }
  | logical_or_expression '?' expression ':' conditional_expression
  {
    R("conditional_expression : " +
      "logical_or_expression '?' expression ':' conditional_expression");
    $$ = node.create("trinary", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
    $$.children.push($5);
  }
  ;

assignment_expression
  : conditional_expression
  {
    R("assignment_expression : conditional_expression");
    $$ = $1;
  }
  | unary_expression assignment_operator assignment_expression
  {
    R("assignment_expression : unary_expression assignment_operator assignment_expression");
    $$ = $2;
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

assignment_operator
  : '='
  {
    R("assignment_operator : '='");
    $$ = node.create("assign", yytext, yylineno);
  }
  | MUL_ASSIGN
  {
    R("assignment_operator : MUL_ASSIGN");
    $$ = node.create("multiply-assign", yytext, yylineno);
  }
  | DIV_ASSIGN
  {
    R("assignment_operator : DIV_ASSIGN");
    $$ = node.create("divide-assign", yytext, yylineno);
  }
  | MOD_ASSIGN
  {
    R("assignment_operator : MOD_ASSIGN");
    $$ = node.create("mod-assign", yytext, yylineno);
  }
  | ADD_ASSIGN
  {
    R("assignment_operator : ADD_ASSIGN");
    $$ = node.create("add-assign", yytext, yylineno);
  }
  | SUB_ASSIGN
  {
    R("assignment_operator : SUB_ASSIGN");
    $$ = node.create("subtract-assign", yytext, yylineno);
  }
  | LEFT_ASSIGN
  {
    R("assignment_operator : LEFT_ASSIGN");
    $$ = node.create("left-shift-assign", yytext, yylineno);
  }
  | RIGHT_ASSIGN
  {
    R("assignment_operator : RIGHT_ASSIGN");
    $$ = node.create("right-shift-assign", yytext, yylineno);
  }
  | AND_ASSIGN
  {
    R("assignment_operator : AND_ASSIGN");
    $$ = node.create("bit-and-assign", yytext, yylineno);
  }
  | XOR_ASSIGN
  {
    R("assignment_operator : XOR_ASSIGN");
    $$ = node.create("xor-assign", yytext, yylineno);
  }
  | OR_ASSIGN
  {
    R("assignment_operator : OR_ASSIGN");
    $$ = node.create("bit-or-assign", yytext, yylineno);
  }
  ;

expression
  : assignment_expression
  {
    R("expression : assignment_expression");
    $$ = $1;
  }
  | expression ',' assignment_expression
  {
    R("expression : expression ',' assignment_expression");
    $$ = node.create("expression", yytext, yylineno);
    $$.children.push($3);
  }
  ;

constant_expression
  : conditional_expression
  {
    R("constant_expression : conditional_expression");
    $$ = $1;
  }
  ;

declaration
  : declaration_specifiers ';'
  {
    R("declaration : declaration_specifiers ';'");

    var             type;
    var             initDeclaratorList;

    // If we were in the typedef start condition, revert to the initial
    // condition.
    lexer.begin("INITIAL");

    $$ = node.create("declaration", yytext, yylineno);
    $$.children.push($1);
  }
  | declaration_specifiers init_declarator_list ';'
  {
    R("declaration : declaration_specifiers init_declarator_list ';'");

    // If we were in the typedef start condition, revert to the initial
    // condition.
    lexer.begin("INITIAL");

    $$ = node.create("declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
  }
  ;

declaration_specifiers
  : storage_class_specifier
  {
    R("declaration_specifiers : storage_class_specifier");
    $$ = node.create("declaration_specifiers", yytext, yylineno);
    $$.children.unshift($1);
  }
  | storage_class_specifier declaration_specifiers
  {
    R("declaration_specifiers : " +
      "storage_class_specifier declaration_specifiers");
    $$ = $2;
    $$.children.unshift($1);
  }
  | type_specifier
  {
    R("declaration_specifiers : type_specifier");
    $$ = node.create("declaration_specifiers", yytext, yylineno);
    $$.children.unshift($1);
  }
  | type_specifier declaration_specifiers
  {
    R("declaration_specifiers : type_specifier declaration_specifiers");
    $$ = $2;
    $$.children.unshift($1);
  }
  | type_qualifier
  {
    R("declaration_specifiers : type_qualifier");
    $$ = node.create("declaration_specifiers", yytext, yylineno);
    $$.children.unshift($1);
  }
  | type_qualifier declaration_specifiers
  {
    R("declaration_specifiers : type_qualifier declaration_specifiers");
    $$ = $2;
    $$.children.unshift($1);
  }
  ;

init_declarator_list
  : init_declarator
  {
    R("init_declarator_list : init_declarator");
    $$ = node.create("init_declarator_list", yytext, yylineno);
    $$.children.push($1);
  }
  | init_declarator_list ',' init_declarator
  {
    R("init_declarator_list : init_declarator_list ',' init_declarator");
    $$ = $1;
    $$.children.push($3);
  }
  ;

init_declarator
  : declarator
  {
    R("init_declarator : declarator");
    $$ = $1;
  }
  | declarator '=' initializer
  {
    R("init_declarator : declarator '=' initializer");
    $$ = $1;
    $$.children.push($3);
  }
  ;

storage_class_specifier
  : TYPEDEF
  {
    R("storage_class_specifier : TYPEDEF");
    lexer.begin("typedef_mode");
    $$ = node.create("typedef", yytext, yylineno);
  }
  | EXTERN
  {
    R("storage_class_specifier : EXTERN");
    $$ = node.create("extern", yytext, yylineno);
  }
  | STATIC
  {
    R("storage_class_specifier : STATIC");
    $$ = node.create("static", yytext, yylineno);
  }
  | AUTO
  {
    R("storage_class_specifier : AUTO");
    $$ = node.create("auto", yytext, yylineno);
  }
  | REGISTER
  {
    R("storage_class_specifier : REGISTER");
    $$ = node.create("register", yytext, yylineno);
  }
  ;

type_specifier
  : VOID
  {
    R("type_specifier : VOID");
    $$ = node.create("void", yytext, yylineno);
  }
  | CHAR
  {
    R("type_specifier : CHAR");
    $$ = node.create("char", yytext, yylineno);
  }
  | SHORT
  {
    R("type_specifier : SHORT");
    $$ = node.create("short", yytext, yylineno);
  }
  | INT
  {
    R("type_specifier : INT");
    $$ = node.create("int", yytext, yylineno);
  }
  | LONG
  {
    R("type_specifier : LONG");
    $$ = node.create("long", yytext, yylineno);
  }
  | FLOAT
  {
    R("type_specifier : FLOAT");
    $$ = node.create("float", yytext, yylineno);
  }
  | DOUBLE
  {
    R("type_specifier : DOUBLE");
    $$ = node.create("double", yytext, yylineno);
  }
  | SIGNED
  {
    R("type_specifier : SIGNED");
    $$ = node.create("signed", yytext, yylineno);
  }
  | UNSIGNED
  {
    R("type_specifier : UNSIGNED");
    $$ = node.create("unsigned", yytext, yylineno);
  }
  | struct_or_union_specifier
  {
    R("type_specifier : struct_or_union_specifier");
    $$ = $1;
  }
  | enum_specifier
  {
    R("type_specifier : enum_specifier");
    $$ = $1;
  }
  | type_name_token
  {
    R("type_specifier : type_name_token");
    $$ = $1;
  }
  ;

struct_or_union_specifier
  : struct_or_union identifier lbrace struct_declaration_list rbrace
  {
    R("struct_or_union_specifier : " +
      "struct_or_union identifier lbrace struct_declaration_list rbrace");
    $$ = $1;
    $$.children.push($4);

    // Munge the name of the struct
    $2.value = "struct#" + $2.value;

    $$.children.push($2);

    // Add a symbol table entry for this struct (a type)
    symtab.add(null, $2.value, yylineno, true);
  }
  | struct_or_union lbrace struct_declaration_list rbrace
  {
    R("struct_or_union_specifier : " +
      "struct_or_union lbrace struct_declaration_list rbrace");
    $$ = $1;
    $$.children.push($3);
    $$.children.push(null);     // no identifier

    // Add a symbol table entry for this struct (a type)
    symtab.add(null, "struct#" + symtab.getUniqueId(), yylineno, true);
  }
  | struct_or_union identifier
  {
    R("struct_or_union_specifier : struct_or_union identifier");
    $$ = $1;
    $$.children.push(null);     // no declaration list

    // Munge the name of the struct
    $2.value = "struct#" + $2.value;

    $$.children.push($2);

    // Add a symbol table entry for this struct (a type)
    symtab.add(null, $2.value, yylineno, true);
  }
  ;

struct_or_union
  : STRUCT
  {
    R("struct_or_union : STRUCT");
    $$ = node.create("struct", yytext, yylineno);
  }
  | UNION
  {
    R("struct_or_union : UNION");
    $$ = node.create("union", yytext, yylineno);
  }
  ;

struct_declaration_list
  : struct_declaration
  {
    R("struct_declaration_list : struct_declaration");
    $$ = node.create("struct_declaration_list", yytext, yylineno);
    $$.children.push($1);
  }
  | struct_declaration_list struct_declaration
  {
    R("struct_declaration_list : struct_declaration_list struct_declaration");
    $$ = $1;
    $$.children.push($2);
  }
  ;

struct_declaration
  : specifier_qualifier_list struct_declarator_list ';'
  {
    R("struct_declaration : " +
      "specifier_qualifier_list struct_declarator_list ';'");
    $$ = node.create("struct_declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
  }
  ;

specifier_qualifier_list
  : type_specifier specifier_qualifier_list
  {
    R("specifier_qualifier_list : type_specifier specifier_qualifier_list");
    $$ = $2;
    $$.children.unshift($1);
  }
  | type_specifier
  {
    R("specifier_qualifier_list : type_specifier");
    $$ = node.create("specifier_qualifier_list", yytext, yylineno);
    $$.children.unshift($1);
  }
  | type_qualifier specifier_qualifier_list
  {
    R("specifier_qualifier_list : type_qualifier specifier_qualifier_list");
    $$ = $2;
    $$.children.unshift($1);
  }
  | type_qualifier
  {
    R("specifier_qualifier_list : type_qualifier");
    $$ = node.create("specifier_qualifier_list", yytext, yylineno);
    $$.children.unshift($1);
  }
  ;

struct_declarator_list
  : struct_declarator
  {
    R("struct_declarator_list : struct_declarator");
    $$ = node.create("struct_declarator_list", yytext, yylineno);
    $$.children.push($1);
  }
  | struct_declarator_list ',' struct_declarator
  {
    R("struct_declarator_list : struct_declarator_list ',' struct_declarator");
    $$ = $1;
    $$.children.push($3);
  }
  ;

struct_declarator
  : declarator
  {
    R("struct_declarator : declarator");
    $$ = node.create("struct_declarator", yytext, yylineno);
    $$.children.push($1);
  }
  | ':' constant_expression
  {
    R("struct_declarator : ':' constant_expression");
    $$ = node.create("struct_declarator", yytext, yylineno);
    $$.children.push(null);     // no declarator
    $$.children.push($2);
  }
  | declarator ':' constant_expression
  {
    R("struct_declarator : declarator ':' constant_expression");
    $$ = node.create("struct_declarator", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

enum_specifier
  : ENUM lbrace enumerator_list rbrace
  {
    R("enum_specifier : ENUM lbrace enumerator_list rbrace");
    $$ = node.create("enum_specifier", yytext, yylineno);
    $$.children.push($3);
    $$.children.push(null);     // no identifier
  }
  | ENUM identifier lbrace enumerator_list rbrace
  {
    R("enum_specifier : ENUM identifier lbrace enumerator_list rbrace");
    $$ = node.create("enum_specifier", yytext, yylineno);
    $$.children.push($4);
    $$.children.push($2);
  }
  | ENUM identifier
  {
    R("enum_specifier : ENUM identifier");
    $$ = node.create("enum_specifier", yytext, yylineno);
    $$.children.push(null);     // no enumerator list
    $$.children.push($2);
  }
  ;

enumerator_list
  : enumerator
  {
    R("enumerator_list : enumerator");
    $$ = node.create("enumerator_list", yytext, yylineno);
    $$.children.push($1);
  }
  | enumerator_list ',' enumerator
  {
    R("enumerator_list : enumerator_list ',' enumerator");
    $$ = $1;
    $$.children.push($3);
  }
  ;

enumerator
  : identifier
  {
    R("enumerator : identifier");
    $$ = $1;
  }
  | identifier '=' constant_expression
  {
    R("enumerator : identifier '=' constant_expression");
    $$ = $1;
    $$.children.push($3);
  }
  ;

type_qualifier
  : CONST
  {
    R("type_qualifier : CONST");
    $$ = node.create("const", yytext, yylineno);
  }
  | VOLATILE
  {
    R("type_qualifier : VOLATILE");
    $$ = node.create("volatile", yytext, yylineno);
  }
  ;

declarator
  : pointer direct_declarator
  {
    R("declarator : pointer direct_declarator");
    $$ = node.create("declarator", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($1);
  }
  | direct_declarator
  {
    R("declarator : direct_declarator");
    $$ = node.create("declarator", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);
  }
  ;

direct_declarator
  : identifier
  {
    R("direct_declarator : identifier");
    $$ = $1;
  }
  | '(' declarator ')'
  {
    R("direct_declarator : '(' declarator ')'");
    $$ = $2;
  }
  | direct_declarator '[' constant_expression ']'
  {
    R("direct_declarator : direct_declarator '[' constant_expression ']'");

    var             array_decl;

    $$ = $1;
    array_decl = node.create("array_decl", yytext, yylineno);
    array_decl.children.push($3);
    $$.children.push(array_decl);
  }
  | direct_declarator '[' ']'
  {
    R("direct_declarator : direct_declarator '[' ']'");

    var             array_decl;

    $$ = $1;
    array_decl = node.create("array_decl", yytext, yylineno);
    $$.children.push(array_decl);
  }
  | direct_declarator function_scope '(' parameter_type_list ')'
  {
    R("direct_declarator : " +
      "direct_declarator '(' parameter_type_list ')'");
    
    $$ = node.create("function_decl", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($4);
    $$.children.push(null);     // no identifier_list
  }
  | direct_declarator function_scope '(' identifier_list ')'
  {
    R("direct_declarator : " +
      "direct_declarator '(' identifier_list ')'");

    $$ = node.create("function_decl", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no parameter_type_list
    $$.children.push($4);
  }
  | direct_declarator function_scope '(' ')'
  {
    R("direct_declarator : direct_declarator '(' ')'");
    
    $$ = node.create("function_decl", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no parameter_type_list
    $$.children.push(null);     // no identifier_list
  }
  ;

pointer
  : '*'
  {
    R("pointer : '*'");
    $$ = node.create("pointer", yytext, yylineno);
  }
  | '*' type_qualifier_list
  {
    R("pointer : '*' type_qualifier_list");
    $$ = node.create("pointer", yytext, yylineno);
    $$.children.push($2);
  }
  | '*' pointer
  {
    R("pointer : '*' pointer");
    $$ = node.create("pointer", yytext, yylineno);
    $$.children.push($2);
  }
  | '*' type_qualifier_list pointer
  {
    R("pointer : '*' type_qualifier_list pointer");
    $$ = node.create("pointer", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($3);
  }
  ;

type_qualifier_list
  : type_qualifier
  {
    R("type_qualifier_list : type_qualifier");
    $$ = node.create("type_qualifier_list", yytext, yylineno);
    $$.children.push($1);
  }
  | type_qualifier_list type_qualifier
  {
    R("type_qualifier_list : type_qualifier_list type_qualifier");
    $$ = $1;
    $$.children.push($2);
  }
  ;


parameter_type_list
  : parameter_list
  {
    R("parameter_type_list : parameter_list");
    $$ = $1;
  }
  | parameter_list ',' ellipsis
  {
    R("parameter_type_list : parameter_list ',' ellipsis");
    $$ = $1;
    $$.children.push($3);
  }
  ;

parameter_list
  : parameter_declaration
  {
    R("parameter_list : parameter_declaration");
    $$ = node.create("parameter_list", yytext, yylineno);
    $$.children.push($1);
  }
  | parameter_list ',' parameter_declaration
  {
    R("parameter_list : parameter_list ',' parameter_declaration");
    $$ = $1;
    $$.children.push($3);
  }
  ;

parameter_declaration
  : declaration_specifiers declarator
  {
    R("parameter_declaration : declaration_specifiers declarator");
    $$ = node.create("parameter_declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
    $$.children.push(null);     // no abstract declarator
  }
  | declaration_specifiers abstract_declarator
  {
    R("parameter_declaration : declaration_specifiers abstract_declarator");
    $$ = node.create("parameter_declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no declarator
    $$.children.push($2);
  }
  | declaration_specifiers
  {
    R("parameter_declaration : declaration_specifiers");
    $$ = node.create("parameter_declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no declarator
    $$.children.push(null);     // no abstract declarator
  }
  ;

identifier_list
  : identifier
  {
    R("identifier_list : identifier");
    $$ = node.create("identifier_list", yytext, yylineno);
    $$.children.push($1);
  }
  | identifier_list ',' identifier
  {
    R("identifier_list : identifier_list ',' identifier");
    $$ = $1;
    $$.children.push($3);
  }
  ;

type_name
  : specifier_qualifier_list
  {
    R("type_name : specifier_qualifier_list");
    $$ = node.create("type_name", yytext, yylineno);
    $$.children.push($1);
  }
  | specifier_qualifier_list abstract_declarator
  {
    R("type_name : specifier_qualifier_list abstract_declarator");
    $$ = node.create("type_name", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
  }
  ;

abstract_declarator
  : pointer
  {
    R("abstract_declarator : pointer");
    $$ = node.create("abstract_declarator", yytext, yylineno);
    $$.children.push($1);
  }
  | direct_abstract_declarator
  {
    R("abstract_declarator : direct_abstract_declarator");
    $$ = node.create("abstract_declarator", yytext, yylineno);
    $$.children.push(null);     // no pointer
    $$.children.push($1);
  }
  | pointer direct_abstract_declarator
  {
    R("abstract_declarator : pointer direct_abstract_declarator");
    $$ = node.create("abstract_declarator", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
  }
  ;

direct_abstract_declarator
  : '(' abstract_declarator ')'
  {
    R("direct_abstract_declarator : '(' abstract_declarator ')'");
    $$ = node.create("direct_abstract_declarator", yytext, yylineno);
    $$.children.push($2);
  }
  | '[' ']'
  {
    R("direct_abstract_declarator : '[' ']'");
    
    var             array_decl;

    $$ = node.create("direct_abstract_declarator", yytext, yylineno);
    array_decl = node.create("array_decl", yytext, yylineno);
    $$.children.push(array_decl);
  }
  | '[' constant_expression ']'
  {
    R("direct_abstract_declarator : '[' constant_expression ']'");
    
    var             array_decl;

    $$ = node.create("direct_abstract_declarator", yytext, yylineno);
    array_decl = node.create("array_decl", yytext, yylineno);
    array_decl.children.push($2);
    $$.children.push(array_decl);
  }
  | direct_abstract_declarator '[' ']'
  {
    R("direct_abstract_declarator : direct_abstract_declarator '[' ']'");
    
    var             array_decl;
    var             child;

    $$ = $1;
    child = node.create("direct_abstract_declarator", yytext, yylineno);
    array_decl = node.create("array_decl", yytext, yylineno);
    child.children.push(array_decl);
    $$.children.push(child);
  }
  | direct_abstract_declarator '[' constant_expression ']'
  {
    R("direct_abstract_declarator : " +
      "direct_abstract_declarator '[' constant_expression ']'");
    
    var             array_decl;
    var             child;

    $$ = $1;
    child = node.create("direct_abstract_declarator", yytext, yylineno);
    array_decl = node.create("array_decl", yytext, yylineno);
    array_decl.children.push($3);
    child.children.push(array_decl);
    $$.children.push(child);
  }
  | '(' ')'
  {
    R("direct_abstract_declarator : '(' ')'");
    $$ = node.create("direct_abstract_declarator", yytext, yylineno);
  }
  | '(' parameter_type_list ')'
  {
    R("direct_abstract_declarator : '(' parameter_type_list ')'");
    $$ = node.create("direct_abstract_declarator", yytext, yylineno);
    $$.children.push($2);
  }
  | direct_abstract_declarator '(' ')'
  {
    R("direct_abstract_declarator : direct_abstract_declarator '(' ')'");
    
    var             child;

    $$ = $1;
    child = node.create("direct_abstract_declarator", yytext, yylineno);
    $$.children.push(child);
  }
  | direct_abstract_declarator '(' parameter_type_list ')'
  {
    R("direct_abstract_declarator : " +
      "direct_abstract_declarator '(' parameter_type_list ')'");
    
    var             child;

    $$ = $1;
    child = node.create("direct_abstract_declarator", yytext, yylineno);
    child.children.push($2);
    $$.children.push(child);
  }
  ;

initializer
  : assignment_expression
  {
    R("initializer : assignment_expression");
    $$ = $1;
  }
  | lbrace initializer_list rbrace
  {
    R("initializer : lbrace initializer_list rbrace");
    $$ = $2;
  }
  | lbrace initializer_list ',' rbrace
  {
    R("initializer : lbrace initializer_list ',' rbrace");
    $$ = $2;
  }
  ;

initializer_list
  : initializer
  {
    R("initializer_list : initializer");
    $$ = node.create("initializer_list", yytext, yylineno);
    $$.children.push($1);
  }
  | initializer_list ',' initializer
  {
    R("initializer_list : initializer_list ',' initializer");
    $$ = $1;
    $$.children.push($3);
  }
  ;

statement
  : labeled_statement
  {
    R("statement : labeled_statement");
    $$ = $1;
  }
  | compound_statement
  {
    R("statement : compound_statement");
    $$ = $1;
  }
  | expression_statement
  {
    R("statement : expression_statement");
    $$ = $1;
  }
  | selection_statement
  {
    R("statement : selection_statement");
    $$ = $1;
  }
  | iteration_statement
  {
    R("statement : iteration_statement");
    $$ = $1;
  }
  | jump_statement
  {
    R("statement : jump_statement");
    $$ = $1;
  }
  | error
  {
    R("statement : error");
  }
  ;

labeled_statement
  : identifier ':' statement
  {
    R("labeled_statement : identifier ':' statement");
    $$ = node.create("label", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | CASE constant_expression ':' statement
  {
    R("labeled_statement : CASE constant_expression ':' statement");
    $$ = node.create("case", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($4);
  }
  | DEFAULT ':' statement
  {
    R("labeled_statement : DEFAULT ':' statement");
    $$ = node.create("default", yytext, yylineno);
    $$.children.push($3);
  }
  ;

compound_statement
  : lbrace_scope rbrace_scope
  {
    R("compound_statement : lbrace_scope rbrace_scope");
    $$ = node.create("compound_statement", yytext, yylineno);
  }
  | lbrace_scope statement_list rbrace_scope
  {
    R("compound_statement : lbrace_scope statement_list rbrace_scope");
    $$ = node.create("compound_statement", yytext, yylineno);
    $$.children.push(null);     // no declaration_list
    $$.children.push($2);
  }
  | lbrace_scope declaration_list rbrace_scope
  {
    R("compound_statement : lbrace_scope declaration_list rbrace_scope");
    $$ = node.create("compound_statement", yytext, yylineno);
    $$.children.push($2);
    $$.children.push(null);     // no statement list
  }
  | lbrace_scope declaration_list statement_list rbrace_scope
  {
    R("compound_statement : lbrace_scope declaration_list statement_list rbrace_scope");
    $$ = node.create("compound_statement", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($3);
  }
  ;

declaration_list
  : declaration
  {
    R("declaration_list : declaration");
    $$ = node.create("declaration_list", yytext, yylineno);
    $$.children.push($1);
  }
  | declaration_list declaration
  {
    R("declaration_list : declaration_list declaration");
    $$ = $1;
    $$.children.push($2);
  }
  ;

statement_list
  : statement
  {
    R("statement_list : statement");
    $$ = node.create("statement_list", yytext, yylineno);
    $$.children.push($1);
  }
  | statement_list statement
  {
    R("statement_list : statement_list statement");
    $$ = $1;
    $$.children.push($2);
  }
  ;

expression_statement
  : ';'
  {
    R("expression_statement : ';'");
    $$ = node.create("expression", yytext, yylineno);
  }
  | expression ';'
  {
    R("expression_statement : expression ';'");
    $$ = $1;
  }
  ;

selection_statement
  : IF '(' expression ')' statement
  {
    R("selection_statement : IF '(' expression ')' statement");
    $$ = node.create("if", yytext, yylineno);
    $$.children.push($3);
    $$.children.push($5);
  }
  | IF '(' expression ')' statement ELSE statement
  {
    R("selection_statement : IF '(' expression ')' statement ELSE statement");
    $$ = node.create("if", yytext, yylineno);
    $$.children.push($3);
    $$.children.push($5);
    $$.children.push($7);
  }
  | SWITCH '(' expression ')' statement
  {
    R("selection_statement : SWITCH '(' expression ')' statement");
    $$ = node.create("switch", yytext, yylineno);
    $$.children.push($3);
    $$.children.push($5);
  }
  ;

iteration_statement
  : WHILE '(' expression ')' statement
  {
    R("iteration_statement : WHILE '(' expression ')' statement");
    $$ = node.create("for", yytext, yylineno);
    $$.children.push(null);     // initialization
    $$.children.push($3);       // while condition
    $$.children.push($5);       // statement block
    $$.children.push(null);     // after each iteration
  }
  | DO statement WHILE '(' expression ')' ';'
  {
    R("iteration_statement : DO statement WHILE '(' expression ')' ';'");
    $$ = node.create("do-while", yytext, yylineno);
    $$.children.push($2);       // statement
    $$.children.push($4);       // while condition
  }
  | FOR '(' expression_statement expression_statement ')' statement
  {
    R("iteration_statement : FOR '(' expression_statement expression_statement ')' statement");
    $$ = node.create("for", yytext, yylineno);
    $$.children.push($3);       // initialization
    $$.children.push($4);       // while condition
    $$.children.push($6);       // statement block
    $$.children.push(null);     // after each iteration
  }
  | FOR '(' expression_statement expression_statement expression ')' statement
  {
    R("iteration_statement : " +
      "FOR '(' expression_statement expression_statement expression ')' " +
      "statement");
    $$ = node.create("for", yytext, yylineno);
    $$.children.push($3);       // initialization
    $$.children.push($4);       // while condition
    $$.children.push($7);       // statement block
    $$.children.push($5);       // after each iteration
  }
  ;

jump_statement
  : GOTO identifier ';'
  {
    R("jump_statement : GOTO identifier ';'");
    $$ = node.create("goto", yytext, yylineno);
    $$.children.push($2);
  }
  | CONTINUE ';'
  {
    R("jump_statement : CONTINUE ';'");
    $$ = node.create("continue", yytext, yylineno);
  }
  | BREAK ';'
  {
    R("jump_statement : BREAK ';'");
    $$ = node.create("break", yytext, yylineno);
  }
  | RETURN ';'
  {
    R("jump_statement : RETURN ';'");
    $$ = node.create("return", yytext, yylineno);
  }
  | RETURN expression ';'
  {
    R("jump_statement : RETURN expression ';'");
    $$ = node.create("return", yytext, yylineno);
    $$.children.push($2);
  }
  ;

translation_unit
  : external_declaration
    {
      R("translation_unit : external_declaration");
      $$ = node.create("translation_unit", yytext, yylineno);
      $$.children.push($1);
    }
  | translation_unit external_declaration
    {
      R("translation_unit : translation_unit external_declaration");
      $$ = $1;
      $$.children.push($2);
    }
  ;

external_declaration
  : function_definition
  {
    R("external_declaration : function_definition");
    $$ = $1;

    // Pop the symtab created by function_scope from the stack
    symtab.popStack();
  }
  | declaration
  {
    R("external_declaration : declaration");
    $$ = $1;
  }
  ;

function_definition
  : declaration_specifiers declarator declaration_list compound_statement
  {
    R("function_definition : " +
      "declaration_specifiers declarator declaration_list compound_statement");
    $$ = node.create("function_definition", yytext, yylineno);
    $$.children.push($1);       // declaration_specifiers
    $$.children.push($2);       // declarator
    $$.children.push($3);       // declaration_list
    $$.children.push($4);       // compound_statement
  }
  | declaration_specifiers declarator compound_statement
  {
    R("function_definition : " +
      "declaration_specifiers declarator compound_statement");
    $$ = node.create("function_definition", yytext, yylineno);
    $$.children.push($1);       // declaration_specifiers
    $$.children.push($2);       // declarator
    $$.children.push(null);     // declaration_list
    $$.children.push($3);       // compound_statement
  }
  | declarator declaration_list compound_statement
  {
    R("function_definition : declarator declaration_list compound_statement");
    $$ = node.create("function_definition", yytext, yylineno);
    $$.children.push(null);     // declaration_specifiers
    $$.children.push($1);       // declarator
    $$.children.push($2);       // declaration_list
    $$.children.push($3);       // compound_statement
  }
  | declarator compound_statement
  {
    R("function_definition : declarator compound_statement");
    $$ = node.create("function_definition", yytext, yylineno);
    $$.children.push(null);     // declaration_specifiers
    $$.children.push($1);       // declarator
    $$.children.push(null);     // declaration_list
    $$.children.push($2);       // compound_statement
  }
  ;

function_scope
  :
  {
    symtab.create(symtab.getCurrent(), null, yylineno + 1);
    $$ = $1;
  }
  ;

identifier
  : IDENTIFIER
  {
    if (lexer.conditionStack[lexer.conditionStack.length - 1] == "typedef_mode")
    {
      R("identifier : TYPE_DEFINITION (" + yytext + ")");
      $$ = node.create("type_definition", yytext, yylineno);
      $$.value = yytext;
      symtab.add(null, yytext, yylineno, true);
    }
    else
    {
      R("identifier : IDENTIFIER (" + yytext + ")");
      $$ = node.create("identifier", yytext, yylineno);
      $$.value = yytext;
    }
  }
  ;

type_name_token
  : TYPE_NAME
  {
    R("identifier : TYPE_NAME (" + yytext + ")");
    $$ = node.create("type_name", yytext, yylineno);
    $$.value = yytext;
  }
  ;

constant
  : CONSTANT
  {
    R("constant : CONSTANT (" + yytext + ")");
    
    var             ch;

    $$ = node.create("constant", yytext, yylineno);
    ch = yytext.charAt(0);
    if (ch == "'" || (ch == "L" && yytext.charAt(1) == "'"))
    {
      $$.value = yytext;
    }
    else
    {
      $$.value = parseInt(yytext);
    }
  }
  ;

string_literal
  : STRING_LITERAL
  {
    R("string_literal : STRING_LITERAL");
    $$ = node.create("string_literal", yytext, yylineno);
    $$.value = yytext;
  }
  ;

ellipsis
  : ELLIPSIS
  {
    R("ellipsis : ELLIPSIS");
    $$ = node.create("ellipsis", yytext, yylineno);
  }
  ;

lbrace_scope
  : lbrace
  {
    R("lbrace_scope : lbrace");

    // Create a symbol table with an arbitrary (for now) name.
    symtab.create(symtab.getCurrent(), null, yylineno + 1);
  }
  ;
  
rbrace_scope
  : rbrace
  {
    R("rbrace_scope : rbrace");

    // Pop this block's symbol table from the stack
    symtab.popStack();
  }
  ;
  
lbrace
  : LBRACE
  {
    R("lbrace : LBRACE");
    $$ = node.create("lbrace", yytext, yylineno);
  }
  ;

rbrace
  : RBRACE
  {
    R("rbrace : RBRACE");
    $$ = node.create("rbrace", yytext, yylineno);;
  }
  ;

%%

sys = require("sys");                // for sys.print()
node = require("./lib/node.js");     // Node functionality
error = require("./lib/error.js");   // parseError, errorCount, etc.
symtab = require("./lib/symtab.js"); // symbol table functionality

modules =
  {
    sys    : sys,
    node   : node,
    error  : error,
    symtab : symtab
  };

error.setParser(parser);                 // provide parser to the error module

// Function called upon each error encountered during parsing
parser.yy.parseError = error.parseError;

// Create the root-level symbol table
symtab.create(null, null, 0);

// Function to display rules as they are parsed
function R(rule)
{
//  sys.print("rule: " + rule + "\n");
}
