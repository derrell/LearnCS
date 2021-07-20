#!/bin/bash

#
# This file is executed automatically via daemontools, as /etc/service/run
#


set -e
cd /home/dlipman/learncs/deploy-node

# Create a fifo for logging of LearnCS!
mkfifo /tmp/learncs-log-fifo

# Start the logger running in the background, pid=init
( logger -t learncs </tmp/learncs-log-fifo & )

# Redirect current shell's stdout to the fifo. Holds fifo open.
exec >/tmp/learncs-log-fifo

# Since fifo is held open, file system entry can be removed.
rm /tmp/learncs-log-fifo

# delete any pior forwarding of port 80 and 443
iptables -F INPUT || true
iptables -F PREROUTING || true
iptables -t nat -F INPUT || true
iptables -t nat -F PREROUTING || true

# forward port 80 to 8080
iptables -A INPUT -i ens160 -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -i ens160 -p tcp --dport 8080 -j ACCEPT
iptables -A PREROUTING -t nat -i ens160 -p tcp --dport 80 -j REDIRECT --to-port 8080

# forward port 443 to 8443
iptables -A INPUT -i ens160 -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -i ens160 -p tcp --dport 8443 -j ACCEPT
iptables -A PREROUTING -t nat -i ens160 -p tcp --dport 443 -j REDIRECT --to-port 8443

# Start up LearnCS! 
exec su -c "nodejs backend.js http.port=8080 https.port=8443" dlipman 2>&1

