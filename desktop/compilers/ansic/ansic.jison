/**
 * Grammar for ANSI C (with some C99 mods)
 *
 * Copyright (c) 2013 Derrell Lipman
 * 
 * License:
 *   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
 */

%token CONSTANT_HEX CONSTANT_OCTAL CONSTANT_DECIMAL CONSTANT_CHAR CONSTANT_FLOAT
%token IDENTIFIER STRING_LITERAL SIZEOF
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
      var Memory = learncs.machine.Memory;

      // Correct line numbers
      $1.fixLineNumbers();

      // Display the abstract syntax tree
      $1.display();

      // Display the symbol table
      learncs.lib.Symtab.display();

      // Reset the symbol table to a clean state
      learncs.lib.Symtab.reset();

      // Re-create the root-level symbol table
      new learncs.lib.Symtab(null, null, 0);

      // Initialize the machine singleton, which initializes the registers
      new learncs.machine.Machine();

      // Process the abstract syntax tree to create symbol tables
      $1.process(data, false);

      sys.print("\n\nAfter processing...");
      learncs.lib.Symtab.display();

      // Process the abstract syntax tree from the entry point, if it exists,
      // to run the program
      if (learncs.lib.Node.entryNode)
      {
        // Prepare the stack to call main()

        // Save the stack pointer, so we can restore it after the function call
        sp = learncs.lib.Node.__mem.getReg("SP", "unsigned int");
console.log("ansic.jison: original sp=" + sp.toString(16));

        // Push argv and argc onto the stack
        learncs.lib.Node.__mem.stackPush("pointer", 0xeeeeeeee);
        learncs.lib.Node.__mem.stackPush("unsigned int", 0xdddddddd);

        // Save this frame pointer
        learncs.lib.Symtab.pushFramePointer(
          learncs.lib.Node.__mem.getReg("SP", "unsigned int"));

        // Push the return address (our current line number) onto the stack
        learncs.lib.Node.__mem.stackPush("unsigned int", 0xcccccccc);

        // Process main()
        learncs.lib.Node.entryNode.process(data, true);

        // Restore the frame pointer and stack pointer
        learncs.lib.Symtab.popFramePointer();
        learncs.lib.Node.__mem.setReg("SP", "unsigned int", sp);
      }
      else
      {
        sys.print("Missing main() function\n");
      } 

      learncs.machine.Memory.getInstance().prettyPrint(
        "Stack",
        Memory.info.rts.start + Memory.info.rts.length - 64,
        64);
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
      $$ = new learncs.lib.Node("postfix_expression", yytext, yylineno);
      $$.children.push($1);
    }
  | postfix_expression '[' expression ']'
    {
      R("postfix_expression : postfix_expression '[' expression ']'");

      var             array_expression;

      $$ = $1;
      array_expression =
        new learncs.lib.Node("array_expression", yytext, yylineno);
      array_expression.children.push($1);
      array_expression.children.push($3);
      $$.children.push(array_expression);
    }
  | postfix_expression '(' ')'
    {
      R("postfix_expression : postfix_expression '(' ')'");
      $$ = new learncs.lib.Node("function_call", yytext, yylineno);
      $$.children.push($1);
      $$.children.push(null);   // no argument_expression_list
    }
  | postfix_expression '(' argument_expression_list ')'
    {
      R("postfix_expression : " +
        "postfix_expression '(' argument_expression_list ')'");
      $$ = new learncs.lib.Node("function_call", yytext, yylineno);
      $$.children.push($1);
      $$.children.push($3);
    }
  | postfix_expression '.' identifier
    {
      R("postfix_expression : postfix_expression '.' identifier");

      var             structure_reference;

      $$ = $1;
      structure_reference =
        new learncs.lib.Node("structure_reference", yytext, yylineno);
      structure_reference.children.push($3);
      $$.children.push(structure_reference);
    }
  | postfix_expression PTR_OP identifier
    {
      R("postfix_expression : postfix_expression PTR_OP identifier");

      var             pointer_access;

      $$ = $1;
      pointer_access = new learncs.lib.Node("pointer_access", yytext, yylineno);
      pointer_access.children.push($3);
      $$.children.push(pointer_access);
    }
  | postfix_expression INC_OP
    {
      R("postfix_expression : postfix_expression INC_OP");
      $$ = new learncs.lib.Node("post_increment_op", yytext, yylineno);
      $$.children.push($1);
    }
  | postfix_expression DEC_OP
    {
      R("postfix_expression : postfix_expression DEC_OP");
      $$ = new learncs.lib.Node("post_decrement_op", yytext, yylineno);
      $$.children.push($1);
    }
  ;

argument_expression_list
  : assignment_expression
  {
    R("argument_expression_list : assignment_expression");
    $$ = new learncs.lib.Node("argument_expression_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("pre_increment_op", yytext, yylineno);
    $$.children.push($2);
  }
  | DEC_OP unary_expression
  {
    R("unary_expression : DEC_OP unary_expression");
    $$ = new learncs.lib.Node("pre_decrement_op", yytext, yylineno);
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
    $$ = new learncs.lib.Node("sizeof", yytext, yylineno);
    $$.children.push($2);
  }
  | SIZEOF '(' type_name ')'
  {
    R("unary_expression : SIZEOF '(' type_name ')'");
    $$ = new learncs.lib.Node("sizeof", yytext, yylineno);
    $$.children.push($3);
  }
  ;

unary_operator
  : '&'
  {
    R("unary_operator : '&'");
    $$ = new learncs.lib.Node("address_of", yytext, yylineno);
  }
  | '*'
  {
    R("unary_operator : '*'");
    $$ = new learncs.lib.Node("dereference", yytext, yylineno);
  }
  | '+'
  {
    R("unary_operator : '+'");
    $$ = new learncs.lib.Node("positive", yytext, yylineno);
  }
  | '-'
  {
    R("unary_operator : '-'");
    $$ = new learncs.lib.Node("negative", yytext, yylineno);
  }
  | '~'
  {
    R("unary_operator : '~'");
    $$ = new learncs.lib.Node("bit_invert", yytext, yylineno);
  }
  | '!'
  {
    R("unary_operator : '!'");
    $$ = new learncs.lib.Node("not", yytext, yylineno);
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
    $$ = new learncs.lib.Node("cast_expression", yytext, yylineno);
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
    $$ = new learncs.lib.Node("multiply", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | multiplicative_expression '/' cast_expression
  {
    R("multiplicative_expression : " +
      "multiplicative_expression '/' cast_expression");
    $$ = new learncs.lib.Node("divide", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | multiplicative_expression '%' cast_expression
  {
    R("multiplicative_expression : " +
      "multiplicative_expression '%' cast_expression");
    $$ = new learncs.lib.Node("mod", yytext, yylineno);
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
    $$ = new learncs.lib.Node("add", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | additive_expression '-' multiplicative_expression
  {
    R("additive_expression : " +
      "additive_expression '-' multiplicative_expression");
    $$ = new learncs.lib.Node("subtract", yytext, yylineno);
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
    $$ = new learncs.lib.Node("left-shift", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | shift_expression RIGHT_OP additive_expression
  {
    R("shift_expression : shift_expression RIGHT_OP additive_expression");
    $$ = new learncs.lib.Node("right-shift", yytext, yylineno);
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
    $$ = new learncs.lib.Node("less-than", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | relational_expression '>' shift_expression
  {
    R("relational_expression : relational_expression '>' shift_expression");
    $$ = new learncs.lib.Node("greater-than", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | relational_expression LE_OP shift_expression
  {
    R("relational_expression : relational_expression LE_OP shift_expression");
    $$ = new learncs.lib.Node("less-equal", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | relational_expression GE_OP shift_expression
  {
    R("relational_expression : relational_expression GE_OP shift_expression");
    $$ = new learncs.lib.Node("greater-equal", yytext, yylineno);
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
    $$ = new learncs.lib.Node("equal", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | equality_expression NE_OP relational_expression
  {
    R("equality_expression : equality_expression NE_OP relational_expression");
    $$ = new learncs.lib.Node("not-equal", yytext, yylineno);
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
    $$ = new learncs.lib.Node("bit-and", yytext, yylineno);
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
    $$ = new learncs.lib.Node("exclusive-or", yytext, yylineno);
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
    $$ = new learncs.lib.Node("bit-or", yytext, yylineno);
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
    $$ = new learncs.lib.Node("and", yytext, yylineno);
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
    $$ = new learncs.lib.Node("or", yytext, yylineno);
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
    $$ = new learncs.lib.Node("trinary", yytext, yylineno);
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
    R("assignment_expression : " +
      "unary_expression assignment_operator assignment_expression");
    $$ = $2;
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

assignment_operator
  : '='
  {
    R("assignment_operator : '='");
    $$ = new learncs.lib.Node("assign", yytext, yylineno);
  }
  | MUL_ASSIGN
  {
    R("assignment_operator : MUL_ASSIGN");
    $$ = new learncs.lib.Node("multiply-assign", yytext, yylineno);
  }
  | DIV_ASSIGN
  {
    R("assignment_operator : DIV_ASSIGN");
    $$ = new learncs.lib.Node("divide-assign", yytext, yylineno);
  }
  | MOD_ASSIGN
  {
    R("assignment_operator : MOD_ASSIGN");
    $$ = new learncs.lib.Node("mod-assign", yytext, yylineno);
  }
  | ADD_ASSIGN
  {
    R("assignment_operator : ADD_ASSIGN");
    $$ = new learncs.lib.Node("add-assign", yytext, yylineno);
  }
  | SUB_ASSIGN
  {
    R("assignment_operator : SUB_ASSIGN");
    $$ = new learncs.lib.Node("subtract-assign", yytext, yylineno);
  }
  | LEFT_ASSIGN
  {
    R("assignment_operator : LEFT_ASSIGN");
    $$ = new learncs.lib.Node("left-shift-assign", yytext, yylineno);
  }
  | RIGHT_ASSIGN
  {
    R("assignment_operator : RIGHT_ASSIGN");
    $$ = new learncs.lib.Node("right-shift-assign", yytext, yylineno);
  }
  | AND_ASSIGN
  {
    R("assignment_operator : AND_ASSIGN");
    $$ = new learncs.lib.Node("bit-and-assign", yytext, yylineno);
  }
  | XOR_ASSIGN
  {
    R("assignment_operator : XOR_ASSIGN");
    $$ = new learncs.lib.Node("xor-assign", yytext, yylineno);
  }
  | OR_ASSIGN
  {
    R("assignment_operator : OR_ASSIGN");
    $$ = new learncs.lib.Node("bit-or-assign", yytext, yylineno);
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
    $$ = new learncs.lib.Node("expression", yytext, yylineno);
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

    $$ = new learncs.lib.Node("declaration", yytext, yylineno);
    $$.children.push($1);
  }
  | declaration_specifiers init_declarator_list ';'
  {
    R("declaration : declaration_specifiers init_declarator_list ';'");

    // If we were in the typedef start condition, revert to the initial
    // condition.
    lexer.begin("INITIAL");

    $$ = new learncs.lib.Node("declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
  }
  ;

declaration_specifiers
  : storage_class_specifier
  {
    R("declaration_specifiers : storage_class_specifier");
    $$ = new learncs.lib.Node("declaration_specifiers", yytext, yylineno);
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
    $$ = new learncs.lib.Node("declaration_specifiers", yytext, yylineno);
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
    $$ = new learncs.lib.Node("declaration_specifiers", yytext, yylineno);
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
    $$ = new learncs.lib.Node("init_declarator_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("init_declarator", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no initializer
  }
  | declarator '=' initializer
  {
    R("init_declarator : declarator '=' initializer");
    $$ = new learncs.lib.Node("init_declarator", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

storage_class_specifier
  : TYPEDEF
  {
    R("storage_class_specifier : TYPEDEF");
    lexer.begin("typedef_mode");
    $$ = new learncs.lib.Node("typedef", yytext, yylineno);
  }
  | EXTERN
  {
    R("storage_class_specifier : EXTERN");
    $$ = new learncs.lib.Node("extern", yytext, yylineno);
  }
  | STATIC
  {
    R("storage_class_specifier : STATIC");
    $$ = new learncs.lib.Node("static", yytext, yylineno);
  }
  | AUTO
  {
    R("storage_class_specifier : AUTO");
    $$ = new learncs.lib.Node("auto", yytext, yylineno);
  }
  | REGISTER
  {
    R("storage_class_specifier : REGISTER");
    $$ = new learncs.lib.Node("register", yytext, yylineno);
  }
  ;

type_specifier
  : VOID
  {
    R("type_specifier : VOID");
    $$ = new learncs.lib.Node("void", yytext, yylineno);
  }
  | CHAR
  {
    R("type_specifier : CHAR");
    $$ = new learncs.lib.Node("char", yytext, yylineno);
  }
  | SHORT
  {
    R("type_specifier : SHORT");
    $$ = new learncs.lib.Node("short", yytext, yylineno);
  }
  | INT
  {
    R("type_specifier : INT");
    $$ = new learncs.lib.Node("int", yytext, yylineno);
  }
  | LONG
  {
    R("type_specifier : LONG");
    $$ = new learncs.lib.Node("long", yytext, yylineno);
  }
  | FLOAT
  {
    R("type_specifier : FLOAT");
    $$ = new learncs.lib.Node("float", yytext, yylineno);
  }
  | DOUBLE
  {
    R("type_specifier : DOUBLE");
    $$ = new learncs.lib.Node("double", yytext, yylineno);
  }
  | SIGNED
  {
    R("type_specifier : SIGNED");
    $$ = new learncs.lib.Node("signed", yytext, yylineno);
  }
  | UNSIGNED
  {
    R("type_specifier : UNSIGNED");
    $$ = new learncs.lib.Node("unsigned", yytext, yylineno);
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
    learncs.lib.Symtab.getCurrent().add($2.value, yylineno, true);
  }
  | struct_or_union lbrace struct_declaration_list rbrace
  {
    R("struct_or_union_specifier : " +
      "struct_or_union lbrace struct_declaration_list rbrace");
    $$ = $1;
    $$.children.push($3);
    $$.children.push(null);     // no identifier

    // Add a symbol table entry for this struct (a type)
    learncs.lib.Symtab.getCurrent().add(
      "struct#" + learncs.lib.Symtab.getUniqueId(), yylineno, true);
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
    leancs.lib.Symtab.getCurrent().add($2.value, yylineno, true);
  }
  ;

struct_or_union
  : STRUCT
  {
    R("struct_or_union : STRUCT");
    $$ = new learncs.lib.Node("struct", yytext, yylineno);
  }
  | UNION
  {
    R("struct_or_union : UNION");
    $$ = new learncs.lib.Node("union", yytext, yylineno);
  }
  ;

struct_declaration_list
  : struct_declaration
  {
    R("struct_declaration_list : struct_declaration");
    $$ = new learncs.lib.Node("struct_declaration_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("struct_declaration", yytext, yylineno);
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
    $$ = new learncs.lib.Node("specifier_qualifier_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("specifier_qualifier_list", yytext, yylineno);
    $$.children.unshift($1);
  }
  ;

struct_declarator_list
  : struct_declarator
  {
    R("struct_declarator_list : struct_declarator");
    $$ = new learncs.lib.Node("struct_declarator_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("struct_declarator", yytext, yylineno);
    $$.children.push($1);
  }
  | ':' constant_expression
  {
    R("struct_declarator : ':' constant_expression");
    $$ = new learncs.lib.Node("struct_declarator", yytext, yylineno);
    $$.children.push(null);     // no declarator
    $$.children.push($2);
  }
  | declarator ':' constant_expression
  {
    R("struct_declarator : declarator ':' constant_expression");
    $$ = new learncs.lib.Node("struct_declarator", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  ;

enum_specifier
  : ENUM lbrace enumerator_list rbrace
  {
    R("enum_specifier : ENUM lbrace enumerator_list rbrace");
    $$ = new learncs.lib.Node("enum_specifier", yytext, yylineno);
    $$.children.push($3);
    $$.children.push(null);     // no identifier
  }
  | ENUM identifier lbrace enumerator_list rbrace
  {
    R("enum_specifier : ENUM identifier lbrace enumerator_list rbrace");
    $$ = new learncs.lib.Node("enum_specifier", yytext, yylineno);
    $$.children.push($4);
    $$.children.push($2);
  }
  | ENUM identifier
  {
    R("enum_specifier : ENUM identifier");
    $$ = new learncs.lib.Node("enum_specifier", yytext, yylineno);
    $$.children.push(null);     // no enumerator list
    $$.children.push($2);
  }
  ;

enumerator_list
  : enumerator
  {
    R("enumerator_list : enumerator");
    $$ = new learncs.lib.Node("enumerator_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("const", yytext, yylineno);
  }
  | VOLATILE
  {
    R("type_qualifier : VOLATILE");
    $$ = new learncs.lib.Node("volatile", yytext, yylineno);
  }
  ;

declarator
  : pointer direct_declarator
  {
    R("declarator : pointer direct_declarator");
    $$ = new learncs.lib.Node("declarator", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($1);
  }
  | direct_declarator
  {
    R("declarator : direct_declarator");
    $$ = new learncs.lib.Node("declarator", yytext, yylineno);
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
    array_decl = new learncs.lib.Node("array_decl", yytext, yylineno);
    array_decl.children.push($3);
    $$.children.push(array_decl);
  }
  | direct_declarator '[' ']'
  {
    R("direct_declarator : direct_declarator '[' ']'");

    var             array_decl;

    $$ = $1;
    array_decl = new learncs.lib.Node("array_decl", yytext, yylineno);
    $$.children.push(array_decl);
  }
  | direct_declarator function_scope '(' parameter_type_list ')'
  {
    R("direct_declarator : " +
      "direct_declarator '(' parameter_type_list ')'");
    
    $$ = new learncs.lib.Node("function_decl", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($4);
    $$.children.push(null);     // no identifier_list
  }
  | direct_declarator function_scope '(' identifier_list ')'
  {
    R("direct_declarator : " +
      "direct_declarator '(' identifier_list ')'");

    $$ = new learncs.lib.Node("function_decl", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no parameter_type_list
    $$.children.push($4);
  }
  | direct_declarator function_scope '(' ')'
  {
    R("direct_declarator : direct_declarator '(' ')'");
    
    $$ = new learncs.lib.Node("function_decl", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no parameter_type_list
    $$.children.push(null);     // no identifier_list
  }
  ;

pointer
  : '*'
  {
    R("pointer : '*'");
    $$ = new learncs.lib.Node("pointer", yytext, yylineno);
  }
  | '*' type_qualifier_list
  {
    R("pointer : '*' type_qualifier_list");
    $$ = new learncs.lib.Node("pointer", yytext, yylineno);
    $$.children.push($2);
  }
  | '*' pointer
  {
    R("pointer : '*' pointer");
    $$ = new learncs.lib.Node("pointer", yytext, yylineno);
    $$.children.push($2);
  }
  | '*' type_qualifier_list pointer
  {
    R("pointer : '*' type_qualifier_list pointer");
    $$ = new learncs.lib.Node("pointer", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($3);
  }
  ;

type_qualifier_list
  : type_qualifier
  {
    R("type_qualifier_list : type_qualifier");
    $$ = new learncs.lib.Node("type_qualifier_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("parameter_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("parameter_declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
    $$.children.push(null);     // no abstract declarator
  }
  | declaration_specifiers abstract_declarator
  {
    R("parameter_declaration : declaration_specifiers abstract_declarator");
    $$ = new learncs.lib.Node("parameter_declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no declarator
    $$.children.push($2);
  }
  | declaration_specifiers
  {
    R("parameter_declaration : declaration_specifiers");
    $$ = new learncs.lib.Node("parameter_declaration", yytext, yylineno);
    $$.children.push($1);
    $$.children.push(null);     // no declarator
    $$.children.push(null);     // no abstract declarator
  }
  ;

identifier_list
  : identifier
  {
    R("identifier_list : identifier");
    $$ = new learncs.lib.Node("identifier_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("type_name", yytext, yylineno);
    $$.children.push($1);
  }
  | specifier_qualifier_list abstract_declarator
  {
    R("type_name : specifier_qualifier_list abstract_declarator");
    $$ = new learncs.lib.Node("type_name", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
  }
  ;

abstract_declarator
  : pointer
  {
    R("abstract_declarator : pointer");
    $$ = new learncs.lib.Node("abstract_declarator", yytext, yylineno);
    $$.children.push($1);
  }
  | direct_abstract_declarator
  {
    R("abstract_declarator : direct_abstract_declarator");
    $$ = new learncs.lib.Node("abstract_declarator", yytext, yylineno);
    $$.children.push(null);     // no pointer
    $$.children.push($1);
  }
  | pointer direct_abstract_declarator
  {
    R("abstract_declarator : pointer direct_abstract_declarator");
    $$ = new learncs.lib.Node("abstract_declarator", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($2);
  }
  ;

direct_abstract_declarator
  : '(' abstract_declarator ')'
  {
    R("direct_abstract_declarator : '(' abstract_declarator ')'");
    $$ = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
    $$.children.push($2);
  }
  | '[' ']'
  {
    R("direct_abstract_declarator : '[' ']'");
    
    var             array_decl;

    $$ = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
    array_decl = new learncs.lib.Node("array_decl", yytext, yylineno);
    $$.children.push(array_decl);
  }
  | '[' constant_expression ']'
  {
    R("direct_abstract_declarator : '[' constant_expression ']'");
    
    var             array_decl;

    $$ = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
    array_decl = new learncs.lib.Node("array_decl", yytext, yylineno);
    array_decl.children.push($2);
    $$.children.push(array_decl);
  }
  | direct_abstract_declarator '[' ']'
  {
    R("direct_abstract_declarator : direct_abstract_declarator '[' ']'");
    
    var             array_decl;
    var             child;

    $$ = $1;
    child = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
    array_decl = new learncs.lib.Node("array_decl", yytext, yylineno);
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
    child = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
    array_decl = new learncs.lib.Node("array_decl", yytext, yylineno);
    array_decl.children.push($3);
    child.children.push(array_decl);
    $$.children.push(child);
  }
  | '(' ')'
  {
    R("direct_abstract_declarator : '(' ')'");
    $$ = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
  }
  | '(' parameter_type_list ')'
  {
    R("direct_abstract_declarator : '(' parameter_type_list ')'");
    $$ = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
    $$.children.push($2);
  }
  | direct_abstract_declarator '(' ')'
  {
    R("direct_abstract_declarator : direct_abstract_declarator '(' ')'");
    
    var             child;

    $$ = $1;
    child = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
    $$.children.push(child);
  }
  | direct_abstract_declarator '(' parameter_type_list ')'
  {
    R("direct_abstract_declarator : " +
      "direct_abstract_declarator '(' parameter_type_list ')'");
    
    var             child;

    $$ = $1;
    child = new learncs.lib.Node("direct_abstract_declarator", yytext, yylineno);
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
    $$ = new learncs.lib.Node("initializer_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("label", yytext, yylineno);
    $$.children.push($1);
    $$.children.push($3);
  }
  | CASE constant_expression ':' statement
  {
    R("labeled_statement : CASE constant_expression ':' statement");
    $$ = new learncs.lib.Node("case", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($4);
  }
  | DEFAULT ':' statement
  {
    R("labeled_statement : DEFAULT ':' statement");
    $$ = new learncs.lib.Node("default", yytext, yylineno);
    $$.children.push($3);
  }
  ;

compound_statement
  : lbrace_scope rbrace_scope
  {
    R("compound_statement : lbrace_scope rbrace_scope");
    $$ = new learncs.lib.Node("compound_statement", yytext, yylineno);
  }
  | lbrace_scope statement_list rbrace_scope
  {
    R("compound_statement : lbrace_scope statement_list rbrace_scope");
    $$ = new learncs.lib.Node("compound_statement", yytext, yylineno);
    $$.children.push(null);     // no declaration_list
    $$.children.push($2);
  }
  | lbrace_scope declaration_list rbrace_scope
  {
    R("compound_statement : lbrace_scope declaration_list rbrace_scope");
    $$ = new learncs.lib.Node("compound_statement", yytext, yylineno);
    $$.children.push($2);
    $$.children.push(null);     // no statement list
  }
  | lbrace_scope declaration_list statement_list rbrace_scope
  {
    R("compound_statement : lbrace_scope declaration_list statement_list rbrace_scope");
    $$ = new learncs.lib.Node("compound_statement", yytext, yylineno);
    $$.children.push($2);
    $$.children.push($3);
  }
  ;

declaration_list
  : declaration
  {
    R("declaration_list : declaration");
    $$ = new learncs.lib.Node("declaration_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("statement_list", yytext, yylineno);
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
    $$ = new learncs.lib.Node("expression", yytext, yylineno);
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
    $$ = new learncs.lib.Node("if", yytext, yylineno);
    $$.children.push($3);
    $$.children.push($5);
  }
  | IF '(' expression ')' statement ELSE statement
  {
    R("selection_statement : IF '(' expression ')' statement ELSE statement");
    $$ = new learncs.lib.Node("if", yytext, yylineno);
    $$.children.push($3);
    $$.children.push($5);
    $$.children.push($7);
  }
  | SWITCH '(' expression ')' statement
  {
    R("selection_statement : SWITCH '(' expression ')' statement");
    $$ = new learncs.lib.Node("switch", yytext, yylineno);
    $$.children.push($3);
    $$.children.push($5);
  }
  ;

iteration_statement
  : WHILE '(' expression ')' statement
  {
    R("iteration_statement : WHILE '(' expression ')' statement");
    $$ = new learncs.lib.Node("for", yytext, yylineno);
    $$.children.push(null);     // initialization
    $$.children.push($3);       // while condition
    $$.children.push($5);       // statement block
    $$.children.push(null);     // after each iteration
  }
  | DO statement WHILE '(' expression ')' ';'
  {
    R("iteration_statement : DO statement WHILE '(' expression ')' ';'");
    $$ = new learncs.lib.Node("do-while", yytext, yylineno);
    $$.children.push($2);       // statement
    $$.children.push($4);       // while condition
  }
  | FOR '(' expression_statement expression_statement ')' statement
  {
    R("iteration_statement : FOR '(' expression_statement expression_statement ')' statement");
    $$ = new learncs.lib.Node("for", yytext, yylineno);
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
    $$ = new learncs.lib.Node("for", yytext, yylineno);
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
    $$ = new learncs.lib.Node("goto", yytext, yylineno);
    $$.children.push($2);
  }
  | CONTINUE ';'
  {
    R("jump_statement : CONTINUE ';'");
    $$ = new learncs.lib.Node("continue", yytext, yylineno);
  }
  | BREAK ';'
  {
    R("jump_statement : BREAK ';'");
    $$ = new learncs.lib.Node("break", yytext, yylineno);
  }
  | RETURN ';'
  {
    R("jump_statement : RETURN ';'");
    $$ = new learncs.lib.Node("return", yytext, yylineno);
  }
  | RETURN expression ';'
  {
    R("jump_statement : RETURN expression ';'");
    $$ = new learncs.lib.Node("return", yytext, yylineno);
    $$.children.push($2);
  }
  ;

translation_unit
  : external_declaration
    {
      R("translation_unit : external_declaration");
      $$ = new learncs.lib.Node("translation_unit", yytext, yylineno);
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
    learncs.lib.Symtab.popStack();
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
    $$ = new learncs.lib.Node("function_definition", yytext, yylineno);
    $$.children.push($1);       // declaration_specifiers
    $$.children.push($2);       // declarator
    $$.children.push($3);       // declaration_list
    $$.children.push($4);       // compound_statement
  }
  | declaration_specifiers declarator compound_statement
  {
    R("function_definition : " +
      "declaration_specifiers declarator compound_statement");
    $$ = new learncs.lib.Node("function_definition", yytext, yylineno);
    $$.children.push($1);       // declaration_specifiers
    $$.children.push($2);       // declarator
    $$.children.push(null);     // declaration_list
    $$.children.push($3);       // compound_statement
  }
  | declarator declaration_list compound_statement
  {
    R("function_definition : declarator declaration_list compound_statement");
    $$ = new learncs.lib.Node("function_definition", yytext, yylineno);
    $$.children.push(null);     // declaration_specifiers
    $$.children.push($1);       // declarator
    $$.children.push($2);       // declaration_list
    $$.children.push($3);       // compound_statement
  }
  | declarator compound_statement
  {
    R("function_definition : declarator compound_statement");
    $$ = new learncs.lib.Node("function_definition", yytext, yylineno);
    $$.children.push(null);     // declaration_specifiers
    $$.children.push($1);       // declarator
    $$.children.push(null);     // declaration_list
    $$.children.push($2);       // compound_statement
  }
  ;

function_scope
  :
  {
    new learncs.lib.Symtab(learncs.lib.Symtab.getCurrent(), null, yylineno + 1);
    $$ = $1;
  }
  ;

identifier
  : IDENTIFIER
  {
    if (lexer.conditionStack[lexer.conditionStack.length - 1] == "typedef_mode")
    {
      R("identifier : TYPE_DEFINITION (" + yytext + ")");
      $$ = new learncs.lib.Node("type_definition", yytext, yylineno);
      $$.value = yytext;
      learncs.lib.Symtab.getCurrent().add(yytext, yylineno, true);
    }
    else
    {
      R("identifier : IDENTIFIER (" + yytext + ")");
      $$ = new learncs.lib.Node("identifier", yytext, yylineno);
      $$.value = yytext;
    }
  }
  ;

type_name_token
  : TYPE_NAME
  {
    R("identifier : TYPE_NAME (" + yytext + ")");
    $$ = new learncs.lib.Node("type_name", yytext, yylineno);
    $$.value = yytext;
  }
  ;

constant
  : CONSTANT_HEX
  {
    var bUnsigned;
    var bLong;

    R("constant : CONSTANT_HEX (" + yytext + ")");
    
    $$ = new learncs.lib.Node("constant", yytext, yylineno);

    bUnsigned = yytext.toLowerCase().indexOf("u") != -1;
    bLong     = yytext.toLowerCase().indexOf("l") != -1;
    if (bUnsigned && bLong)
    {
      $$.numberType = learncs.lib.Node.NumberType.ULong;
    }
    else if (bUnsigned)
    {
      $$.numberType = learncs.lib.Node.NumberType.ULong;
    }
    else if (bLong)
    {
      $$.numberType = learncs.lib.Node.NumberType.Long;
    }
    else
    {
      $$.numberType = learncs.lib.Node.NumberType.Int;
    }

    $$.value = parseInt(yytext, 16);
  }
  | CONSTANT_OCTAL
  {
    var             bUnsigned;
    var             bLong;

    R("constant : CONSTANT_OCTAL (" + yytext + ")");
    
    $$ = new learncs.lib.Node("constant", yytext, yylineno);

    bUnsigned = yytext.toLowerCase().indexOf("u") != -1;
    bLong     = yytext.toLowerCase().indexOf("l") != -1;
    if (bUnsigned && bLong)
    {
      $$.numberType = learncs.lib.Node.NumberType.ULong;
    }
    else if (bUnsigned)
    {
      $$.numberType = learncs.lib.Node.NumberType.ULong;
    }
    else if (bLong)
    {
      $$.numberType = learncs.lib.Node.NumberType.Long;
    }
    else
    {
      $$.numberType = learncs.lib.Node.NumberType.Int;
    }

    $$.value = parseInt(yytext, 8);
  }
  | CONSTANT_DECIMAL
  {
    var             bUnsigned;
    var             bLong;

    R("constant : CONSTANT_DECIMAL (" + yytext + ")");
    
    $$ = new learncs.lib.Node("constant", yytext, yylineno);

    bUnsigned = yytext.toLowerCase().indexOf("u") != -1;
    bLong     = yytext.toLowerCase().indexOf("l") != -1;
    if (bUnsigned && bLong)
    {
      $$.numberType = learncs.lib.Node.NumberType.ULong;
    }
    else if (bUnsigned)
    {
      $$.numberType = learncs.lib.Node.NumberType.ULong;
    }
    else if (bLong)
    {
      $$.numberType = learncs.lib.Node.NumberType.Long;
    }
    else
    {
      $$.numberType = learncs.lib.Node.NumberType.Int;
    }

    $$.value = parseInt(yytext, 10);
  }
  | CONSTANT_CHAR
  {
    var             value;
    var             match;

    R("constant : CONSTANT_CHAR (" + yytext + ")");
    
    // We don't support long characters, at present
    if (yytext.charAt(0) == "L")
    {
      throw new Error("Line " + yylineno + ": " +
                      "Long characters (characters of the form L'x') " +
                      "are not currently supported.");
    }

    $$ = new learncs.lib.Node("constant", yytext, yylineno);

    // If the length is exactly 3, it's a single quote, simple character, and
    // another single quote.
    if (yytext.length == 3)
    {
      value = yytext.charCodeAt(1);
    }

    // Try to match against the possible special escape sequences
    if (typeof value == "undefined")
    {
      [
        [ /^'\\a'$/,   7 ],                    // bell (alert)
        [ /^'\\b'$/,   8 ],                    // backspace
        [ /^'\\f'$/,  12 ],                    // formfeed
        [ /^'\\n'$/,  10 ],                    // newline
        [ /^'\\r'$/,  13 ],                    // carriage return
        [ /^'\\t'$/,   9 ],                    // tab
        [ /^'\\v'$/,  11 ],                    // vertical tab
        [ /^'\\''$/,  39 ],                    // single quote
        [ /^'\\"'$/,  34 ],                    // double quote
        [ /^'\\\\'$/, 92 ],                    // backslash
        [ /^'\\\?'$/, 63 ]                     // literal question mark
      ].forEach(
        function(escape)
        {
          if (typeof value != "undefined")
          {
            return;
          }
          
          if (escape[0].test(yytext))
          {
            value = escape[1];
          }
        });
    }

    // If it wasn't special, then see if it's an octal character
    if (typeof value == "undefined" &&
        (match = /'\\([0-7]{3})'/.exec(yytext)))
    {
      value = parseInt(match[1], 8);
    }

    // If it wasn't special or octal, see if it's a hex character
    if (typeof value == "undefined" &&
        (match = /'\\([0-9a-fA-F]{2})'/.exec(yytext)))
    {
      value = parseInt(match[1], 16);
    }

    // If it wasn't special or octal or hex, see if it's a long hex character
    // NOT IMPLEMENTED
    if (false &&
        typeof value == "undefined" &&
        (match = /'\\([0-9a-fA-F]{4})'/.exec(yytext)))
    {
      value = parseInt(match[1], 16);
    }

    // If it's none of those, and the length is exactly 4, (a single quote, a
    // backslash, some character, and another single quote), then convert the
    // "some character" to its ASCII value.
    if (typeof value == "undefined" &&
        yytext.length === 4)
    {
      value = yytext.charCodeAt(2);
    }

    // If we still haven't converted it, there's something wrong
    if (typeof value != "undefined")
    {
      // Save the converted value
      $$.numberType = learncs.lib.Node.NumberType.Int;
      $$.value = value;
    }
    else
    {
      error.parseError("Unrecognized single-quoted character (" + yytext + ")",
                       { line : yylineno });
    }
  }
  | CONSTANT_FLOAT
  {
    R("constant : CONSTANT (" + yytext + ")");
    
    var             ch;

    $$ = new learncs.lib.Node("constant", yytext, yylineno);
    $$.numberType = learncs.lib.Node.NumberType.Float;
    $$.value = parseFloat(yytext);
    }
  }
  ;

string_literal
  : STRING_LITERAL
  {
    R("string_literal : STRING_LITERAL");
    $$ = new learncs.lib.Node("string_literal", yytext, yylineno);
    $$.value = yytext;
  }
  ;

ellipsis
  : ELLIPSIS
  {
    R("ellipsis : ELLIPSIS");
    $$ = new learncs.lib.Node("ellipsis", yytext, yylineno);
  }
  ;

lbrace_scope
  : lbrace
  {
    R("lbrace_scope : lbrace");

    // Create a symbol table with an arbitrary (for now) name.
    new learncs.lib.Symtab(learncs.lib.Symtab.getCurrent(), null, yylineno + 1);
  }
  ;
  
rbrace_scope
  : rbrace
  {
    R("rbrace_scope : rbrace");

    // Pop this block's symbol table from the stack
    learncs.lib.Symtab.popStack();
  }
  ;
  
lbrace
  : LBRACE
  {
    R("lbrace : LBRACE");
    $$ = new learncs.lib.Node("lbrace", yytext, yylineno);
  }
  ;

rbrace
  : RBRACE
  {
    R("rbrace : RBRACE");
    $$ = new learncs.lib.Node("rbrace", yytext, yylineno);;
  }
  ;

%%

sys = require("sys");                // for sys.print()
error = require("./lib/error.js");   // parseError, errorCount, etc.
require("./lib/Symtab.js");          // symbol table functionality
require("./lib/Node.js");            // Node functionality
require("./machine/Machine.js");     // The virtual machine

error.setParser(parser);             // provide parser to the error module

// Function called upon each error encountered during parsing
parser.yy.parseError = error.parseError;

// Create the root-level symbol table
new learncs.lib.Symtab(null, null, 0);

// Function to display rules as they are parsed
function R(rule)
{
//  sys.print("rule: " + rule + "\n");
}
