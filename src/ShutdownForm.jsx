import React, { useState } from "react";
import {
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const API_BASE = "http://localhost:3002";

function ShutdownForm() {
  const [isReboot, setIsReboot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = () => {
    setConfirmOpen(true);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  const handleExecute = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/shutdown`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reboot: isReboot }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, message: isReboot ? "Reinicio iniciado correctamente." : "Apagado iniciado correctamente." });
      } else {
        setResult({ ok: false, message: data.error || "Error al ejecutar la acción." });
      }
    } catch (err) {
      setResult({ ok: false, message: `Error de conexión: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const actionLabel = isReboot ? "Reiniciar" : "Apagar";
  const ActionIcon = isReboot ? RestartAltIcon : PowerSettingsNewIcon;
  const actionColor = isReboot ? "#d97706" : "#dc2626";
  const actionGradient = isReboot
    ? "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)"
    : "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)";

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, color: "#dc2626", mb: 1 }}>
        Control de Energía
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Seleccioná la acción que querés ejecutar en el servidor y confirmá.
      </Typography>

      {/* Toggle switch */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          p: 2.5,
          borderRadius: 3,
          border: `2px solid ${actionColor}40`,
          background: `linear-gradient(135deg, ${actionColor}08 0%, ${actionColor}12 100%)`,
          mb: 3,
          transition: "all 0.3s ease",
        }}
      >
        {/* Left label: Apagar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 110 }}>
          <PowerSettingsNewIcon sx={{ color: isReboot ? "text.disabled" : "#dc2626", fontSize: 22, transition: "color 0.3s" }} />
          <Typography
            sx={{
              fontWeight: isReboot ? 400 : 700,
              color: isReboot ? "text.disabled" : "#dc2626",
              transition: "all 0.3s ease",
            }}
          >
            Apagar
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={isReboot}
              onChange={(e) => {
                setIsReboot(e.target.checked);
                setResult(null);
              }}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#d97706",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#d97706",
                },
              }}
            />
          }
          label=""
          sx={{ m: 0 }}
        />

        {/* Right label: Reiniciar */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RestartAltIcon sx={{ color: isReboot ? "#d97706" : "text.disabled", fontSize: 22, transition: "color 0.3s" }} />
          <Typography
            sx={{
              fontWeight: isReboot ? 700 : 400,
              color: isReboot ? "#d97706" : "text.disabled",
              transition: "all 0.3s ease",
            }}
          >
            Reiniciar
          </Typography>
        </Box>
      </Box>

      {/* Action button */}
      <Button
        variant="contained"
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ActionIcon />}
        disabled={loading}
        onClick={handleConfirm}
        sx={{
          background: actionGradient,
          fontWeight: 700,
          px: 4,
          py: 1.2,
          borderRadius: 2,
          boxShadow: `0 4px 14px ${actionColor}50`,
          transition: "all 0.3s ease",
          "&:hover": {
            background: actionGradient,
            boxShadow: `0 6px 20px ${actionColor}70`,
            transform: "translateY(-2px)",
          },
          "&:disabled": {
            opacity: 0.7,
          },
        }}
      >
        {loading ? "Ejecutando..." : `${actionLabel} el servidor`}
      </Button>

      {/* Result alert */}
      {result && (
        <Alert
          severity={result.ok ? "success" : "error"}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          {result.message}
        </Alert>
      )}

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onClose={handleCancel}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ActionIcon sx={{ color: actionColor }} />
          Confirmar {actionLabel}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro que querés <strong>{actionLabel.toLowerCase()}</strong> el servidor?{" "}
            {isReboot
              ? "El sistema se reiniciará y volverá en unos momentos."
              : "El sistema se apagará y no volverá a encenderse automáticamente."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleExecute}
            variant="contained"
            sx={{ background: actionGradient, fontWeight: 700 }}
          >
            Sí, {actionLabel}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ShutdownForm;
