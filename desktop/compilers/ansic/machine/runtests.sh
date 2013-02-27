#!/bin/bash

for f in ./tests/*.js; do
    nodejs $f
done
