#!/bin/bash
cd ~/app/automation
git checkout .
git pull
npm install -D
pm2 restart automation
