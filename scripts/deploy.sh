#!/bin/bash

directory="/root/apps/douyudm-monitor"
filename="douyudm-monitor.tar.gz"

# delete and unarchive the files
echo "Delete old files..."
rm -rf $directory
mkdir -p $directory

echo "Unarchive $filename..."
tar -xzvf $filename -C $directory

# deploy
cd $directory
pm2 start ecosystem.config.js
