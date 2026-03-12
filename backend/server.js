/**
 * server.js — Express API server on port 3002 (ESM)
 * Handles Ansible playbook execution requests from the frontend.
 */

import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { promisify } from "util";
import { WebSocketServer } from "ws";
import pty from "node-pty";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3002;
const execFileAsync = promisify(execFile);

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Validation helpers ────────────────────────────────────────────────────────
const USERNAME_REGEX = /^[a-z][a-z0-9_-]{0,31}$/;
const RESERVED_USERS = [
  "root", "daemon", "bin", "sys", "sync", "games", "man", "lp",
  "mail", "news", "uucp", "proxy", "www-data", "backup", "list",
  "irc", "gnats", "nobody", "systemd-network", "systemd-resolve",
  "syslog", "messagebus", "uuidd", "dnsmasq", "usbmux", "rtkit",
  "cups-pk-helper", "dbus", "pulse", "avahi", "colord", "hplip",
  "geoclue", "gdm", "sshd", "admin",
];

function validateUsername(username) {
  if (typeof username !== "string") return "Username debe ser un string.";
  const u = username.trim().toLowerCase();
  if (!USERNAME_REGEX.test(u)) {
    return "Username inválido: solo letras minúsculas, números, guiones y guiones bajos. Debe comenzar con letra. Máx 32 caracteres.";
  }
  if (RESERVED_USERS.includes(u)) {
    return `"${u}" es un usuario reservado del sistema.`;
  }
  return null;
}

// ── POST /api/sudoers ─────────────────────────────────────────────────────────
app.post("/api/sudoers", (req, res) => {
  const { username, password, isRoot } = req.body;

  // Sanitize & validate
  const cleanUser = (typeof username === "string" ? username.trim().toLowerCase() : "");
  const err = validateUsername(cleanUser);
  if (err) {
    return res.status(400).json({ ok: false, error: err });
  }
  if (!password || typeof password !== "string" || password.trim() === "") {
    return res.status(400).json({ ok: false, error: "Contraseña inválida o vacía." });
  }

  const sudoersIsRoot = isRoot === true ? "true" : "false";
  const playbookPath = path.join(__dirname, "ansible", "sudoers.yml");

  console.log(`[sudoers] Ejecutando playbook para usuario: ${cleanUser}, root: ${sudoersIsRoot}`);

  // Use execFile — NO shell interpolation, args passed as array
  execFile(
    "ansible-playbook",
    [
      playbookPath,
      "-e", `sudoers_user=${cleanUser}`,
      "-e", `sudoers_password=${password}`,
      "-e", `sudoers_is_root=${sudoersIsRoot}`,
    ],
    { cwd: __dirname, timeout: 120_000 },
    (error, stdout, stderr) => {
      const output = `${stdout}\n${stderr}`.trim();
      if (error) {
        console.error(`[sudoers] Error: ${error.message}`);
        console.error(`[sudoers] Output:\n${output}`);
        return res.status(500).json({ ok: false, error: "El playbook falló.", details: output });
      }
      console.log(`[sudoers] Playbook OK. Obteniendo UID...`);
      execFile("id", ["-u", cleanUser], (idError, idStdout) => {
        let uid = null;
        if (!idError && idStdout) {
          uid = idStdout.trim();
        }
        console.log(`[sudoers] OK:\n${output}\nUID: ${uid}`);
        return res.json({ ok: true, output, uid });
      });
    }
  );
});

// ── POST /api/containers ──────────────────────────────────────────────────────
app.post("/api/containers", async (req, res) => {
  const { image, name } = req.body;

  if (!image || typeof image !== "string" || image.trim() === "") {
    return res.status(400).json({ ok: false, error: "La imagen es obligatoria." });
  }

  const cleanImage = image.trim();
  const cleanName = name && typeof name === "string" ? name.trim() : "";

  // Construir comando docker run
  const dockerArgs = ["run", "-d"];
  if (cleanName) {
    dockerArgs.push("--name", cleanName);
  }
  dockerArgs.push(cleanImage);

  console.log(`[containers] Ejecutando: sudo docker ${dockerArgs.join(" ")}`);

  // Lanzar contenedor
  execFile("sudo", ["docker", ...dockerArgs], { timeout: 60_000 }, async (err, stdout, stderr) => {
    if (err) {
      console.error(`[containers] Error ejecutando contenedor: ${err.message}`);
      return res.status(500).json({ ok: false, error: "Fallo al crear contenedor", details: stderr });
    }

    try {
      // Registrar en containers.json
      const jsonPath = path.join(__dirname, "containers.json");
      let containers = [];
      try {
        const fileData = await fs.readFile(jsonPath, "utf-8");
        containers = JSON.parse(fileData);
      } catch (readErr) {
        // Ignorar si el archivo no existe (ENOENT)
      }

      containers.push({
        image: cleanImage,
        name: cleanName || undefined,
        timestamp: new Date().toISOString()
      });

      await fs.writeFile(jsonPath, JSON.stringify(containers, null, 2));

      // Ejecutar docker ps para devolver el output
      execFile("sudo", ["docker", "ps"], { timeout: 10_000 }, (psErr, psStdout, psStderr) => {
        if (psErr) {
          console.error(`[containers] Error ejecutando docker ps: ${psErr.message}`);
          return res.status(500).json({ 
            ok: false, 
            error: "Contenedor iniciado, pero falló 'docker ps'", 
            details: psStderr 
          });
        }

        console.log(`[containers] OK. Devuelto docker ps de ${psStdout.length} bytes`);
        return res.json({ ok: true, output: psStdout });
      });

    } catch (fsErr) {
      console.error(`[containers] Error gestionando containers.json: ${fsErr.message}`);
      return res.status(500).json({ ok: false, error: "Fallo al escribir en containers.json", details: fsErr.message });
    }
  });
});

// ── GET /api/containers ──────────────────────────────────────────────────────
app.get("/api/containers", async (req, res) => {
  try {
    const jsonPath = path.join(__dirname, "containers.json");
    const fileData = await fs.readFile(jsonPath, "utf-8");
    return res.json({ ok: true, data: JSON.parse(fileData) });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.json({ ok: true, data: [] });
    }
    console.error(`[containers] Error leyendo containers.json: ${err.message}`);
    return res.status(500).json({ ok: false, error: "Error leyendo la base de datos de contenedores" });
  }
});

// ── POST /api/containers/batch ───────────────────────────────────────────────
app.post("/api/containers/batch", async (req, res) => {
  const containersReq = req.body;

  if (!Array.isArray(containersReq) || containersReq.length === 0) {
    return res.status(400).json({ ok: false, error: "Se espera un arreglo JSON válido y no vacío." });
  }

  console.log(`[containers-batch] Ejecutando lote de ${containersReq.length} contenedores...`);
  const jsonPath = path.join(__dirname, "containers.json");
  let storedContainers = [];

  try {
    const fileData = await fs.readFile(jsonPath, "utf-8");
    storedContainers = JSON.parse(fileData);
  } catch (err) {
    // Ignorar si no existe
  }

  const results = [];

  for (const item of containersReq) {
    const { image, name } = item;
    if (!image || typeof image !== "string" || image.trim() === "") {
      results.push({ image, status: "error", error: "Imagen inválida o vacía." });
      continue;
    }

    const cleanImage = image.trim();
    const cleanName = name && typeof name === "string" ? name.trim() : "";

    const dockerArgs = ["run", "-d"];
    if (cleanName) {
      dockerArgs.push("--name", cleanName);
    }
    dockerArgs.push(cleanImage);

    try {
      await execFileAsync("sudo", ["docker", ...dockerArgs], { timeout: 60_000 });
      storedContainers.push({
        image: cleanImage,
        name: cleanName || undefined,
        timestamp: new Date().toISOString()
      });
      results.push({ image: cleanImage, name: cleanName, status: "success" });
    } catch (err) {
      console.error(`[containers-batch] Fallo contenedor ${cleanImage}: ${err.message}`);
      results.push({ image: cleanImage, name: cleanName, status: "error", error: err.message });
    }
  }

  try {
    await fs.writeFile(jsonPath, JSON.stringify(storedContainers, null, 2));
  } catch (fsErr) {
    console.error(`[containers-batch] Error escribiendo JSON: ${fsErr.message}`);
  }

  try {
    const { stdout: psStdout } = await execFileAsync("sudo", ["docker", "ps"], { timeout: 10_000 });
    return res.json({ ok: true, results, output: psStdout });
  } catch (psErr) {
    console.error(`[containers-batch] Falló docker ps: ${psErr.message}`);
    return res.status(500).json({ ok: false, error: "Lote procesado, pero falló 'docker ps'", results });
  }
});

// ── POST /api/shutdown ───────────────────────────────────────────────────────
app.post("/api/shutdown", (req, res) => {
  const { reboot } = req.body;
  const flag = reboot === true ? "-r" : "-h";
  const action = reboot === true ? "reboot" : "halt";

  console.log(`[shutdown] Ejecutando: sudo shutdown ${flag} now`);

  execFile(
    "sudo",
    ["shutdown", flag, "now"],
    { timeout: 30_000 },
    (error, stdout, stderr) => {
      const output = `${stdout}\n${stderr}`.trim();
      if (error) {
        console.error(`[shutdown] Error: ${error.message}`);
        console.error(`[shutdown] Output:\n${output}`);
        return res.status(500).json({ ok: false, error: `Falló el ${action}.`, details: output });
      }
      console.log(`[shutdown] OK:\n${output}`);
      return res.json({ ok: true, action, output });
    }
  );
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true }));

// ── Interactive Terminal (WebSocket) ──────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws) => {
  console.log("[terminal] Nueva conexión WebSocket abierta.");

  // Forzar a usar bash
  const shell = "bash";
  
  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-color",
    cols: 80,
    rows: 30,
    cwd: process.env.HOME,
    env: process.env,
  });

  ptyProcess.onData((data) => {
    ws.send(data);
  });

  ws.on("message", (msg) => {
    ptyProcess.write(msg);
  });

  ws.on("close", () => {
    console.log("[terminal] Conexión cerrada. Matando proceso pty.");
    ptyProcess.kill();
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api-server] Escuchando en http://0.0.0.0:${PORT}`);
});

server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});
