#!/usr/bin/env python3
"""
parse_db.py — Lee db.json y genera:
  - ansible/inventory.ini            (localhost con conexión local)
  - ansible/host_vars/localhost/packages.yml  (todos los paquetes agrupados)
"""

import json
import os
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "db.json")
ANSIBLE_DIR = os.path.join(os.path.dirname(__file__), "ansible")
INVENTORY_PATH = os.path.join(ANSIBLE_DIR, "inventory.ini")
HOST_VARS_DIR = os.path.join(ANSIBLE_DIR, "host_vars")


def load_db(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def write_inventory() -> None:
    lines = [
        "[managed_hosts]",
        "localhost  ansible_connection=local",
        "",
    ]
    with open(INVENTORY_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[OK] Inventario escrito en {INVENTORY_PATH}")


def write_host_vars(hosts: list) -> None:
    os.makedirs(HOST_VARS_DIR, exist_ok=True)
    localhost_dir = os.path.join(HOST_VARS_DIR, "localhost")
    os.makedirs(localhost_dir, exist_ok=True)

    packages = [h["paquete"] for h in hosts]

    lines = [
        "---",
        "# Generado automáticamente desde db.json",
        "# Todos los paquetes de los hosts se instalan en localhost",
        "packages_to_install:",
    ]
    for pkg in packages:
        lines.append(f"  - {pkg}")
    lines.append("")

    var_file = os.path.join(localhost_dir, "packages.yml")
    with open(var_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"[OK] host_vars/localhost/packages.yml → paquetes: {', '.join(packages)}")


def main():
    if not os.path.exists(DB_PATH):
        print(f"[ERROR] No se encontró {DB_PATH}", file=sys.stderr)
        sys.exit(1)

    data = load_db(DB_PATH)
    hosts = data.get("hosts", [])

    if not hosts:
        print("[WARN] No se encontraron hosts en db.json")
        sys.exit(0)

    print(f"[INFO] {len(hosts)} paquetes encontrados en db.json")
    write_inventory()
    write_host_vars(hosts)
    print("\n[LISTO] Ahora puedes ejecutar:")
    print("  cd ansible && ansible-playbook -i inventory.ini site.yml")


if __name__ == "__main__":
    main()
