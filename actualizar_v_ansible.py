#!/usr/bin/env python3
"""
actualizar_v_ansible.py
Genera packages.yml y packages_to_remove.yml a partir de db.json.

Estrategia para calcular los paquetes a desinstalar:
- Mantiene un 'known_packages.yml' con TODOS los paquetes que alguna vez
  se solicitaron instalar. Nunca se elimina de ahí hasta confirmar
  que fueron desinstalados.
- Consulta a dpkg cuáles de esos paquetes históricos están instalados.
- Los que están instalados pero ya no están en db.json → se desinstalan.
"""
import json
import os
import subprocess
import yaml

# Rutas de archivos
DB_FILE        = 'db.json'
OUTPUT_DIR     = 'ansible/host_vars/localhost'
PACKAGES_FILE  = os.path.join(OUTPUT_DIR, 'packages.yml')
TO_REMOVE_FILE = os.path.join(OUTPUT_DIR, 'packages_to_remove.yml')
# Historial acumulativo de TODOS los paquetes que alguna vez se solicitaron
HISTORY_FILE   = os.path.join(OUTPUT_DIR, 'known_packages.yml')


def get_installed_from(candidates):
    """
    Dado un conjunto de nombres de paquetes, retorna cuáles están
    realmente instalados en el sistema usando dpkg-query.
    """
    installed = set()
    if not candidates:
        return installed
    try:
        result = subprocess.run(
            ['dpkg-query', '-W', '-f=${Package} ${Status}\n'] + sorted(candidates),
            capture_output=True, text=True
        )
        for line in result.stdout.splitlines():
            parts = line.split()
            if len(parts) >= 4 and parts[-1] == 'installed':
                installed.add(parts[0])
    except FileNotFoundError:
        print("[!] dpkg-query no encontrado. No se calcularán desinstalaciones.")
    except Exception as e:
        print(f"[!] Error consultando paquetes instalados: {e}")
    return installed


def read_yaml_list(filepath, key):
    """Lee una lista de un YAML. Retorna [] si no existe o hay error."""
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, 'r') as f:
            return (yaml.safe_load(f) or {}).get(key, [])
    except Exception:
        return []


def update_ansible_vars():
    db_file = DB_FILE
    if not os.path.exists(db_file):
        db_file = 'os.db'

    if not os.path.exists(db_file):
        print("Error: Neither db.json nor os.db found.")
        return

    try:
        with open(db_file, 'r') as f:
            data = json.load(f)

        hosts = data.get('hosts', [])

        # Lista DESEADA según db.json
        desired = sorted(set(
            h.get('paquete') for h in hosts if h.get('paquete')
        ))

        # Historial acumulativo: todos los paquetes que alguna vez quisimos
        # Incluye lo de sesiones anteriores y lo actual
        known_history = set(read_yaml_list(HISTORY_FILE, 'known_packages'))

        # Ampliar el historial con lo deseado ahora
        # (si es la primera vez, known_history puede estar vacío)
        all_candidates = known_history | set(desired)

        # Actualizar el historial ANTES de consultar a dpkg
        # (agrega los nuevos paquetes deseados al historial)
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        with open(HISTORY_FILE, 'w') as f:
            f.write("# Historial acumulativo — no editar manualmente\n")
            yaml.dump({'known_packages': sorted(all_candidates)}, f,
                      default_flow_style=False)

        # Consultar al sistema cuáles realmente están instalados
        actually_installed = get_installed_from(all_candidates)

        # Paquetes a desinstalar = instalados que ya no están en desired
        to_remove = sorted(actually_installed - set(desired))

        # 1. Escribir packages.yml
        with open(PACKAGES_FILE, 'w') as f:
            f.write("# Generado automáticamente desde db.json / os.db\n")
            yaml.dump({'packages_to_install': desired}, f,
                      default_flow_style=False)

        # 2. Escribir packages_to_remove.yml
        with open(TO_REMOVE_FILE, 'w') as f:
            f.write("# Generado automáticamente desde db.json / os.db\n")
            yaml.dump({'packages_to_remove': to_remove}, f,
                      default_flow_style=False)

        print(f"[+] Deseados (instalar):       {', '.join(desired) or 'ninguno'}")
        print(f"[-] Instalados a desinstalar:  {', '.join(to_remove) or 'ninguno'}")
        print(f"[=] Historial total conocido:  {', '.join(sorted(all_candidates))}")

    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    update_ansible_vars()
