#!/bin/sh
# wait-for-db.sh — waits for MySQL to be ready before starting the app
# Usage: ./wait-for-db.sh <host> <port> -- <cmd>

HOST=$1
PORT=$2
shift 2
shift  # skip the '--'

echo "Waiting for MySQL at $HOST:$PORT ..."
until nc -z "$HOST" "$PORT" 2>/dev/null; do
  echo "  MySQL not ready, retrying in 2s..."
  sleep 2
done

echo "MySQL is up — starting backend"
exec "$@"
