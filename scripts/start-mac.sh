#!/bin/bash
set -e
cd "$(dirname "$0")/.."
docker build -t prelegal .
docker rm -f prelegal 2>/dev/null || true
docker run -d --name prelegal -p 8000:8000 --env-file .env prelegal
echo "Prelegal is running at http://localhost:8000"
