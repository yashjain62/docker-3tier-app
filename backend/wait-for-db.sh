#!/bin/sh
echo "Waiting for MySQL..."
until nc -z db 3306 2>/dev/null; do
  echo "MySQL not ready, retrying in 2s..."
  sleep 2
done
echo "MySQL is up — starting backend"
exec node app.js
