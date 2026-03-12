#!/bin/bash
# levanta-todo.sh — Arranca todos los servicios del proyecto
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "[*] Verificando dependencias del sistema..."

# 1. Ansible
if ! command -v ansible-playbook &>/dev/null; then
    echo "[!] Ansible no encontrado. Instalando..."
    sudo apt update && sudo apt install -y ansible || {
        echo "[ERROR] No se pudo instalar Ansible. Instálalo manualmente."
        exit 1
    }
fi

# 2. PyYAML
echo "[*] Verificando dependencias de Python..."
python3 -m pip install --break-system-packages pyyaml >/dev/null 2>&1 || \
python3 -m pip install pyyaml >/dev/null 2>&1 || true

# ─── Backend: instalar dependencias npm ───────────────────────────────────────
echo "[*] Instalando dependencias del backend..."
(cd "$BACKEND_DIR" && npm install --omit=dev 2>/dev/null || npm install)

# ─── Frontend: instalar dependencias npm ─────────────────────────────────────
echo "[*] Instalando dependencias del frontend..."
(cd "$FRONTEND_DIR" && npm install)

# ─── JSON Server ─────────────────────────────────────────────────────────────
echo "[*] Iniciando JSON Server (puerto 3001)..."
(cd "$BACKEND_DIR" && npx json-server --watch db.json --port 3001 --host 0.0.0.0 \
  > "$ROOT_DIR/json-server.log" 2>&1) &
JSON_PID=$!

# ─── API Server (Express, puerto 3002) ───────────────────────────────────────
echo "[*] Iniciando API Server (puerto 3002)..."
(cd "$BACKEND_DIR" && node server.js >> "$ROOT_DIR/app.log" 2>&1) &
API_PID=$!

# ─── Watcher Ansible ─────────────────────────────────────────────────────────
echo "[*] Iniciando Watcher de Ansible..."
python3 "$BACKEND_DIR/watcher.py" >> "$ROOT_DIR/watcher.log" 2>&1 &
WATCHER_PID=$!

# ─── Frontend (Vite) ─────────────────────────────────────────────────────────
echo "[*] Iniciando Frontend (Vite)..."
(cd "$FRONTEND_DIR" && npm run dev)

# ─── Cleanup al salir ────────────────────────────────────────────────────────
echo "[*] Deteniendo servicios..."
kill "$JSON_PID"    2>/dev/null || true
kill "$API_PID"     2>/dev/null || true
kill "$WATCHER_PID" 2>/dev/null || true
