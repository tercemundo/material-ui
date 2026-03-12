#!/usr/bin/env bash
# parse_and_run.sh
# Parsea db.json, genera inventario y host_vars, y ejecuta el playbook de Ansible.
# Uso: bash parse_and_run.sh [opciones extra de ansible-playbook]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================"
echo "  Parser db.json → Ansible"
echo "========================================"

# 1. Parsear db.json
echo ""
echo "[PASO 1] Parseando base de datos..."
python3 "$SCRIPT_DIR/actualizar_v_ansible.py"

# 2. Verificar que ansible está instalado
if ! command -v ansible-playbook &>/dev/null; then
  echo ""
  echo "[ERROR] ansible-playbook no encontrado. Instálalo con:"
  echo "  pip install ansible   o   sudo apt install ansible"
  exit 1
fi

# 3. Ejecutar el playbook
echo ""
echo "[PASO 2] Ejecutando playbook Ansible..."
echo "Directorio: $SCRIPT_DIR/ansible"
echo ""

cd "$SCRIPT_DIR/ansible"
ansible-playbook -i inventory.ini site.yml "$@"

echo ""
echo "========================================"
echo "  ¡Ejecución completada!"
echo "========================================"
