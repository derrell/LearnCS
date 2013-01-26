ansic.js:	ansic.jison ansic.lex lib/error.js lib/node.js lib/symtab.js
	nodejs ../jison.git/bin/jison ansic.jison ansic.lex
	@echo ""
	@echo "------------------------------"
	@echo "Now run 'node ansic.js FILE.c'"
	@echo "------------------------------"

clean:
	rm -f ansic.js
