#!/bin/bash
# Levanta JSON Server + Vite simultáneo


# JSON Server background
npm install -g json-server 2>/dev/null || true
npx json-server --watch db.json --port 3001 --host 0.0.0.0 > json-server.log 2>&1 &
JSON_PID=$!

# Watcher para Ansible
python3 watcher.py > watcher.log 2>&1 &
WATCHER_PID=$!

# Vite
npm ci
npm run dev

# Cleanup
kill $JSON_PID
kill $WATCHER_PID
