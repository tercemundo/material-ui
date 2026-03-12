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
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

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

const steps = ["Usuario", "Contraseña", "Creación"];

function SudoersForm() {
  const [activeStep, setActiveStep] = useState(0);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRoot, setIsRoot] = useState(false);
  
  const [validationError, setValidationError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, message, uid }

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    const sanitized = val.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(sanitized);
    setValidationError(validateUsername(sanitized) || "");
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const error = validateUsername(username);
      if (error) {
        setValidationError(error);
        return;
      }
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (!password || password.trim() === "") {
        return; // Password can't be empty
      }
      setActiveStep(2);
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setUsername("");
    setPassword("");
    setIsRoot(false);
    setResult(null);
    setValidationError("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password: password.trim(), isRoot }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setResult({ ok: false, message: data.error || "Error al ejecutar el playbook." });
      } else {
        setResult({
          ok: true,
          message: `Usuario "${username}" creado${isRoot ? " con privilegios root" : ""} y agregado a /etc/sudoers.d/${username}`,
          uid: data.uid
        });
      }
    } catch (err) {
      setResult({ ok: false, message: `Error de conexión: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const isUsernameValid = username.length > 0 && !validationError;
  const isPasswordValid = password.length > 0;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <AdminPanelSettingsIcon sx={{ color: "#7c3aed", fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#7c3aed" }}>
          Agregar Usuario a Sudoers
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label.Mui-active": { color: "#7c3aed", fontWeight: "bold" },
                "& .MuiStepIcon-root.Mui-active": { color: "#7c3aed" },
                "& .MuiStepIcon-root.Mui-completed": { color: "#7c3aed" }
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* STEP 1: USUARIO */}
      {activeStep === 0 && (
        <Box sx={{ mb: 2 }}>
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
            inputProps={{ maxLength: 32, autoComplete: "off", spellCheck: false }}
            sx={{
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#7c3aed",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#7c3aed",
              },
            }}
          />
        </Box>
      )}

      {/* STEP 2: CONTRASEÑA */}
      {activeStep === 1 && (
        <Box sx={{ mb: 2 }}>
          <TextField
            id="sudoers-password"
            fullWidth
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#7c3aed",
              },
              "& .MuiInputLabel-root.Mui-focused": {
                color: "#7c3aed",
              },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
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
                  checked={isRoot}
                  onChange={(e) => setIsRoot(e.target.checked)}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": { color: "#7c3aed" },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7c3aed" }
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>¿Es root?</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isRoot ? "Tendrá ALL=(ALL:ALL) NOPASSWD: ALL" : "Tendrá permisos básicos de sudo"}
                  </Typography>
                </Box>
              }
            />
          </Box>
        </Box>
      )}

      {/* STEP 3: RESULTADO */}
      {activeStep === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 2 }}>
          {loading ? (
            <>
              <CircularProgress size={40} sx={{ color: "#7c3aed", mb: 2 }} />
              <Typography variant="body1">Ejecutando playbook, creando usuario...</Typography>
            </>
          ) : result ? (
            <Box sx={{ width: "100%" }}>
              <Alert
                severity={result.ok ? "success" : "error"}
                icon={result.ok ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                sx={{ mb: 2, borderRadius: 2 }}
              >
                {result.message}
              </Alert>
              {result.ok && result.uid && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  <strong>User ID (UID):</strong> {result.uid}
                </Alert>
              )}
            </Box>
          ) : null}
        </Box>
      )}

      {/* BOTONES */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
        {activeStep === 2 && !loading && (
          <Button onClick={handleReset} sx={{ color: "#7c3aed" }}>
            Volver al inicio
          </Button>
        )}
        {activeStep !== 2 && (
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ color: "text.secondary" }}
          >
            Atrás
          </Button>
        )}
        {activeStep !== 2 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={(activeStep === 0 && !isUsernameValid) || (activeStep === 1 && !isPasswordValid)}
            sx={{
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)",
                boxShadow: "0 4px 14px #7c3aed50",
              },
              "&:disabled": { background: "#e0e0e0" }
            }}
          >
            {activeStep === steps.length - 2 ? "Crear y Aplicar" : "Siguiente"}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default SudoersForm;
