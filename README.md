# IP Dashboard & Automation System

Este proyecto es un tablero de control para gestionar hosts y paquetes, con automatización integrada mediante Ansible para la instalación de software en tiempo real.

## 🚀 Características

- **Frontend Interactivo**: Panel construido con React y Material UI para visualizar, agregar, editar y eliminar hosts.
- **Base de Datos Dinámica**: Utiliza `json-server` con `db.json` para persistencia ligera.
- **Automatización Ansible**: Rol personalizado (`install_packages`) que detecta el gestor de paquetes del sistema (`apt`, `dnf`, `apk`) e instala los paquetes definidos.
- **Ejecución en Tiempo Real (Watcher)**: Un script en Python monitorea cambios en la base de datos y dispara automáticamente el despliegue de Ansible en `localhost`.

## 🛠️ Estructura del Proyecto

- `src/`: Código fuente del frontend (React).
- `ansible/`:
  - `roles/install_packages/`: Lógica de instalación multiplataforma.
  - `site.yml`: Playbook principal.
  - `host_vars/localhost/packages.yml`: Variables generadas automáticamente.
- `watcher.py`: Script que vigila `db.json`.
- `parse_db.py` / `actualizar_v_ansible.py`: Scripts de procesamiento de datos.
- `levanta-todo.sh`: Script principal de arranque.

## 🏁 Cómo empezar

### Requisitos previos

- Node.js y npm
- Python 3
- Ansible (`sudo apt install ansible`)

### Instalación y Ejecución

Simplemente ejecuta el script de arranque:

```bash
bash levanta-todo.sh
```

Este script se encarga de:
1.  Levantar el **JSON Server** (Puerto 3001).
2.  Iniciar el **Watcher de Ansible** en segundo plano.
3.  Lanzar el servidor de desarrollo de **Vite** para el frontend.

## 🔄 Flujo de Automatización

1.  Usuario agrega un nuevo host/paquete desde la web.
2.  El frontend guarda los datos en `db.json`.
3.  `watcher.py` detecta el cambio en `db.json`.
4.  Se ejecuta `parse_and_run.sh`, el cual:
    - Procesa los paquetes y actualiza las variables de Ansible.
    - Ejecuta `ansible-playbook` para instalar los paquetes en `localhost`.

## 📝 Notas de Uso

- **Seguridad**: Las tareas de Ansible utilizan `become: yes`, por lo que es posible que necesites tener privilegios de sudo configurados sin contraseña o ejecutar el sistema en un entorno controlado.
- **Compatibilidad**: Probado en sistemas basados en Debian/Ubuntu (Zorin OS), RedHat y Alpine.
