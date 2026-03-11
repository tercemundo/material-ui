/**
 * server.js — Express API server on port 3002 (ESM)
 * Handles Ansible playbook execution requests from the frontend.
 */

import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3002;

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

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[api-server] Escuchando en http://0.0.0.0:${PORT}`);
});
