#!/bin/bash

nodejs ./_dotests.js > /tmp/playground-tests.out
diff -u --text TESTS-EXPECTED-OUTPUT /tmp/playground-tests.out
