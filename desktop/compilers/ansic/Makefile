#
# Copyright (c) 2013 Derrell Lipman
# 
# License:
#   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
#

COMMON		= ./ansic.js
LIBDIR          = ../../playground/source/class/playground/c/lib
PLAYGROUND_DIR	= ../../playground/source/resource/playground/script
PLAYGROUND	= $(PLAYGROUND_DIR)/ansic.js

all:	$(COMMON) $(PLAYGROUND)

$(COMMON):	ansic.jison ansic.lex $(LIBDIR)/Node.js $(LIBDIR)/Symtab.js
	nodejs cli-wrapper.js -m commonjs -o $(COMMON) ansic.jison ansic.lex
	@echo ""
	@echo "------------------------------"
	@echo "For testing, run 'nodejs ./ansic.js FILE.c'."
	@echo "------------------------------"

$(PLAYGROUND):	ansic.jison ansic.lex $(LIBDIR)/Node.js $(LIBDIR)/Symtab.js
	mkdir -p $(PLAYGROUND_DIR)
	nodejs cli-wrapper.js -m amd -o $(PLAYGROUND) ansic.jison ansic.lex
	@echo ""
	@echo "------------------------------"
	@echo "requireJS module available in playground's resource directory"
	@echo "------------------------------"

clean:
	rm -f $(COMMON) $(PLAYGROUND)
