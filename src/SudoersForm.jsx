import React, { useState } from "react";
import {
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Box,
  CircularProgress,
  Alert,
  Collapse,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Regex: minúsculas, comienza con letra, solo letras/números/guión/guión_bajo, max 32 chars
const USERNAME_REGEX = /^[a-z][a-z0-9_-]{0,31}$/;

// Palabras reservadas que no se pueden usar
const RESERVED_USERS = [
  "root", "daemon", "bin", "sys", "sync", "games", "man", "lp",
  "mail", "news", "uucp", "proxy", "www-data", "backup", "list",
  "irc", "gnats", "nobody", "systemd-network", "systemd-resolve",
  "syslog", "messagebus", "uuidd", "dnsmasq", "usbmux", "rtkit",
  "cups-pk-helper", "dbus", "pulse", "avahi", "colord", "hplip",
  "geoclue", "gdm", "sshd", "admin",
];

const API_URL = "http://localhost:3002/api/sudoers";

function validateUsername(username) {
  if (!username || username.trim() === "") {
    return "El nombre de usuario no puede estar vacío.";
  }
  const trimmed = username.trim().toLowerCase();
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Solo letras minúsculas, números, guiones y guiones bajos. Debe comenzar con letra. Máx 32 caracteres.";
  }
  if (RESERVED_USERS.includes(trimmed)) {
    return `"${trimmed}" es un usuario reservado del sistema.`;
  }
  return null; // Sin error
}

function SudoersForm() {
  const [username, setUsername] = useState("");
  const [isRoot, setIsRoot] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    // Sanitización inmediata: solo permitir caracteres válidos en el input
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(sanitized);
    setValidationError(validateUsername(sanitized) || "");
    setResult(null);
  };

  const handleSubmit = async () => {
    const error = validateUsername(username);
    if (error) {
      setValidationError(error);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), isRoot }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setResult({ ok: false, message: data.error || "Error al ejecutar el playbook." });
      } else {
        setResult({
          ok: true,
          message: `Usuario "${username}" creado${isRoot ? " con privilegios root" : ""} y agregado a /etc/sudoers.d/${username}`,
        });
        setUsername("");
        setIsRoot(false);
      }
    } catch (err) {
      setResult({ ok: false, message: `Error de conexión: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = username.length > 0 && !validationError;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <AdminPanelSettingsIcon sx={{ color: "#7c3aed", fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#7c3aed" }}>
          Agregar Usuario a Sudoers
        </Typography>
      </Box>

      {/* Campo Usuario */}
      <TextField
        id="sudoers-username"
        fullWidth
        label="Nombre de usuario"
        placeholder="ej: pepe"
        value={username}
        onChange={handleUsernameChange}
        error={!!validationError && username.length > 0}
        helperText={
          validationError && username.length > 0
            ? validationError
            : "Solo letras minúsculas, números, guiones y guiones bajos. Comienza con letra."
        }
        disabled={loading}
        inputProps={{
          maxLength: 32,
          autoComplete: "off",
          spellCheck: false,
        }}
        sx={{
          mb: 3,
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#7c3aed",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#7c3aed",
          },
        }}
      />

      {/* Switch root */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
          p: 2,
          borderRadius: 2,
          background: isRoot ? "#7c3aed12" : "transparent",
          border: `1px solid ${isRoot ? "#7c3aed40" : "#e0e0e0"}`,
          transition: "all 0.2s ease",
        }}
      >
        <FormControlLabel
          control={
            <Switch
              id="sudoers-root-switch"
              checked={isRoot}
              onChange={(e) => setIsRoot(e.target.checked)}
              disabled={loading}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": { color: "#7c3aed" },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#7c3aed",
                },
              }}
            />
          }
          label={
            <Box>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                ¿Es root?
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isRoot
                  ? "Tendrá ALL=(ALL:ALL) NOPASSWD: ALL"
                  : "Tendrá permisos básicos de sudo"}
              </Typography>
            </Box>
          }
        />
      </Box>

      {/* Resumen de lo que se va a hacer */}
      {isFormValid && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            background: "#f3f0ff",
            border: "1px solid #7c3aed30",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Se creará el usuario <strong>{username}</strong> con password{" "}
            <strong>{username}</strong> y se escribirá{" "}
            <code>/etc/sudoers.d/{username}</code>{" "}
            {isRoot ? "con privilegios root totales." : "con permisos de sudo básicos."}
          </Typography>
        </Box>
      )}

      {/* Feedback */}
      <Collapse in={!!result}>
        <Alert
          severity={result?.ok ? "success" : "error"}
          icon={
            result?.ok ? (
              <CheckCircleOutlineIcon />
            ) : (
              <ErrorOutlineIcon />
            )
          }
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {result?.message}
        </Alert>
      </Collapse>

      {/* Botón */}
      <Button
        id="sudoers-apply-btn"
        variant="contained"
        disabled={!isFormValid || loading}
        onClick={handleSubmit}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
        sx={{
          background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
          px: 4,
          py: 1.2,
          borderRadius: 2,
          fontWeight: 700,
          letterSpacing: 0.5,
          "&:hover": {
            background: "linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)",
            boxShadow: "0 4px 14px #7c3aed50",
          },
          "&:disabled": {
            background: "#e0e0e0",
          },
        }}
      >
        {loading ? "Ejecutando playbook..." : "Aplicar"}
      </Button>
    </Box>
  );
}

export default SudoersForm;
