#
# Copyright (c) 2013 Derrell Lipman
# 
# License:
#   GPL Version 2: http://www.gnu.org/licenses/gpl-2.0.html 
#

ansic.js:	ansic.jison ansic.lex lib/error.js lib/Node.js lib/Symtab.js
	nodejs ../jison.git/bin/jison ansic.jison ansic.lex
	@echo ""
	@echo "------------------------------"
	@echo "Now run 'nodejs ansic.js FILE.c'"
	@echo "------------------------------"

clean:
	rm -f ansic.js
