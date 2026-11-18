#!/bin/bash
# Run as root on the server: pull the latest code and restart.
set -e
cd /opt/little-bites
sudo -u littlebites git pull --ff-only
systemctl restart littlebites
sleep 2
systemctl is-active littlebites
curl -fsS http://127.0.0.1:3000/ -o /dev/null && echo "app responding"
