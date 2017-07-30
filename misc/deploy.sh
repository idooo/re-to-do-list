#!/usr/bin/env bash

HOST=$1
FRONTEND_LOCATION=$2

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../" && pwd )"

# Cleanup
rm -rf $DIR/dist
rm -rf $FRONTEND_LOCATION/build

# Build backend
cd $DIR
npm run-script build

# Build frontend things
cd $FRONTEND_LOCATION
npm run-script build
mv $FRONTEND_LOCATION/build $DIR/dist/public

# Copy production configuration
cd $DIR
cp config/production.json dist/default.json

# Copy to the remote server
ssh $HOST 'rm -rf ~/todo; mkdir ~/todo'
rsync -rav -e ssh --exclude={config,node_modules,misc,mocks,*.ts,.*} ./ $HOST:~/todo

ssh $HOST << EOF

  cd ~/todo
  yarn install --production

  forever stop /var/www/todo/server.js

  rm -rf /var/www/todo
  rsync -av ~/todo /var/www;
  cd /var/www/todo

  # forever start /var/www/todo/server.js
EOF
