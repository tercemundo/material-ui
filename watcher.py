#!/usr/bin/env python3
import os
import time
import subprocess

FILE_TO_WATCH = 'db.json'
COMMAND_TO_RUN = ['bash', 'parse_and_run.sh']

def get_mtime(path):
    try:
        return os.path.getmtime(path)
    except OSError:
        return None

def main():
    print(f"[*] Iniciando watcher para {FILE_TO_WATCH}...")
    last_mtime = get_mtime(FILE_TO_WATCH)
    
    # Esperar a que el archivo exista si no está
    while last_mtime is None:
        time.sleep(1)
        last_mtime = get_mtime(FILE_TO_WATCH)
    
    print(f"[*] Monitoreando cambios en {FILE_TO_WATCH}")
    
    try:
        while True:
            current_mtime = get_mtime(FILE_TO_WATCH)
            if current_mtime is not None and current_mtime != last_mtime:
                print(f"[!] Cambio detectado en {FILE_TO_WATCH}. Ejecutando automatización...")
                # Pequeña pausa para asegurar que el archivo terminó de escribirse
                time.sleep(0.5)
                subprocess.run(COMMAND_TO_RUN)
                last_mtime = get_mtime(FILE_TO_WATCH)
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Deteniendo watcher.")

if __name__ == "__main__":
    main()
