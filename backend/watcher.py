#!/usr/bin/env python3
"""
watcher.py — Observa cambios en db.json y ejecuta parse_and_run.sh.
Usa rutas absolutas basadas en la ubicación del script.
"""
import os
import time
import subprocess

# Directorio donde vive este script (backend/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

FILE_TO_WATCH = os.path.join(SCRIPT_DIR, 'db.json')
COMMAND_TO_RUN = ['bash', os.path.join(SCRIPT_DIR, 'parse_and_run.sh')]


def get_mtime(path):
    try:
        return os.path.getmtime(path)
    except OSError:
        return None


def main():
    print(f"[*] Iniciando watcher para {FILE_TO_WATCH}...")
    # Aseguramos que el archivo existe
    while not os.path.exists(FILE_TO_WATCH):
        print(f"[...] Esperando a que aparezca {FILE_TO_WATCH}")
        time.sleep(1)

    last_mtime = get_mtime(FILE_TO_WATCH)
    print(f"[*] Monitoreando cambios en {FILE_TO_WATCH} (mtime: {last_mtime})")

    try:
        while True:
            current_mtime = get_mtime(FILE_TO_WATCH)
            if current_mtime is not None and current_mtime != last_mtime:
                # Esperamos un momento para que el archivo se asiente
                time.sleep(0.3)
                print(f"\n[!] Cambio detectado en {FILE_TO_WATCH}. Ejecutando automatización...")

                # Guardamos el mtime ANTES de ejecutar
                run_mtime = get_mtime(FILE_TO_WATCH)

                # Ejecutamos la automatización
                result = subprocess.run(COMMAND_TO_RUN, capture_output=False, cwd=SCRIPT_DIR)

                # Si el archivo cambió DURANTE la ejecución, se volverá a procesar
                last_mtime = run_mtime
                print(f"[*] Automatización finalizada (Exit Code: {result.returncode}). Volviendo a monitorear...")

            time.sleep(0.5)
    except KeyboardInterrupt:
        print("\n[*] Deteniendo watcher.")


if __name__ == "__main__":
    main()
