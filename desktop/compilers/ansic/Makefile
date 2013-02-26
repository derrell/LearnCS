#
# Copyright (c) 2013 Derrell Lipman
# 
# License:
#   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
#

COMMON		= ./ansic.js
PLAYGROUND	= ../../playground/source/resource/playground/ansic.js

all:	$(COMMON) $(PLAYGROUND)

$(COMMON):	ansic.jison ansic.lex lib/error.js lib/Node.js lib/Symtab.js
	nodejs cli-wrapper.js -m commonjs -o $(COMMON) ansic.jison ansic.lex
	@echo ""
	@echo "------------------------------"
	@echo "For testing, run 'nodejs ./ansic.js FILE.c'."
	@echo "------------------------------"

$(PLAYGROUND):	ansic.jison ansic.lex lib/error.js lib/Node.js lib/Symtab.js
	nodejs cli-wrapper.js -m amd -o $(PLAYGROUND) ansic.jison ansic.lex
	@echo ""
	@echo "------------------------------"
	@echo "requireJS module available in playground's resource directory"
	@echo "------------------------------"

clean:
	rm -f $(COMMON) $(PLAYGROUND)
