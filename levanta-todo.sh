# Verificar e instalar dependencias del sistema
echo "[*] Verificando dependencias..."

# 1. Ansible
if ! command -v ansible-playbook &>/dev/null; then
    echo "[!] Ansible no encontrado. Intentando instalar..."
    sudo apt update && sudo apt install -y ansible || {
        echo "[ERROR] No se pudo instalar Ansible automáticamente. Por favor instálalo manualmente."
        exit 1
    }
fi

# 2. Dependencias de Python (PyYAML para los scripts de parseo)
echo "[*] Verificando dependencias de Python..."
python3 -m pip install --break-system-packages pyyaml >/dev/null 2>&1 || \
python3 -m pip install pyyaml >/dev/null 2>&1 || true

# JSON Server background
echo "[*] Iniciando JSON Server..."
npm install -g json-server 2>/dev/null || true
npx json-server --watch db.json --port 3001 --host 0.0.0.0 > json-server.log 2>&1 &
JSON_PID=$!

# Watcher para Ansible
echo "[*] Iniciando Watcher de Ansible..."
python3 watcher.py > watcher.log 2>&1 &
WATCHER_PID=$!

# Vite
echo "[*] Iniciando Frontend..."
npm ci
npm run dev

# Cleanup
echo "[*] Deteniendo servicios..."
kill $JSON_PID 2>/dev/null || true
kill $WATCHER_PID 2>/dev/null || true
