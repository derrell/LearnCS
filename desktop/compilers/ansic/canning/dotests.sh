#!/bin/bash

./_dotests.js > /tmp/playground-tests.out
diff -u TESTS-EXPECTED-OUTPUT /tmp/playground-tests.out
