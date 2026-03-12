import React, { useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import ExtensionIcon from "@mui/icons-material/Extension"; // Icono temporal, puedes usar otro
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const API_URL = "http://localhost:3002/api/containers";

const steps = ["Imagen", "Nombre", "Resultado"];

function ContainersForm() {
  const [activeStep, setActiveStep] = useState(0);

  const [image, setImage] = useState("");
  const [containerName, setContainerName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, message, output }

  const handleNext = () => {
    if (activeStep === 0) {
      if (!image.trim()) return;
      setActiveStep(1);
    } else if (activeStep === 1) {
      setActiveStep(2);
      handleSubmit();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setImage("");
    setContainerName("");
    setResult(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: image.trim(), name: containerName.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setResult({ ok: false, message: data.error || "Error al ejecutar el contenedor.", output: data.details });
      } else {
        setResult({
          ok: true,
          message: `Contenedor lanzado con éxito.`,
          output: data.output
        });
      }
    } catch (err) {
      setResult({ ok: false, message: `Error de conexión: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const isImageValid = image.trim().length > 0;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <ExtensionIcon sx={{ color: "#2563eb", fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#2563eb" }}>
          Lanzar Contenedor Docker
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label.Mui-active": { color: "#2563eb", fontWeight: "bold" },
                "& .MuiStepIcon-root.Mui-active": { color: "#2563eb" },
                "& .MuiStepIcon-root.Mui-completed": { color: "#2563eb" }
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* STEP 1: IMAGEN */}
      {activeStep === 0 && (
        <Box sx={{ mb: 2 }}>
          <TextField
            id="containers-image"
            fullWidth
            label="Imagen u origen del paquete"
            placeholder="ej: nginx:alpine, redis:latest"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            inputProps={{ autoComplete: "off", spellCheck: false }}
            sx={{
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#2563eb" },
            }}
          />
        </Box>
      )}

      {/* STEP 2: NOMBRE DEL CONTENEDOR */}
      {activeStep === 1 && (
        <Box sx={{ mb: 2 }}>
          <TextField
            id="containers-name"
            fullWidth
            label="Nombre del contenedor (opcional)"
            placeholder="ej: mi-web-server"
            value={containerName}
            onChange={(e) => setContainerName(e.target.value)}
            inputProps={{ autoComplete: "off", spellCheck: false }}
            sx={{
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#2563eb" },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Si lo dejas en blanco, Docker asignará un nombre aleatorio automáticamente.
          </Typography>
        </Box>
      )}

      {/* STEP 3: RESULTADO */}
      {activeStep === 2 && (
        <Box sx={{ display: "flex", flexDirection: "column", py: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <CircularProgress size={40} sx={{ color: "#2563eb", mb: 2 }} />
              <Typography variant="body1">Lanzando contenedor...</Typography>
            </Box>
          ) : result ? (
            <Box sx={{ width: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                {result.ok ? <CheckCircleOutlineIcon color="success" /> : <ErrorOutlineIcon color="error" />}
                <Typography variant="body1" sx={{ fontWeight: 600, color: result.ok ? "success.main" : "error.main" }}>
                  {result.message}
                </Typography>
              </Box>
              
              {result.output && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#1e1e1e",
                    color: "#d4d4d4",
                    borderRadius: 2,
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    overflowX: "auto",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {result.output}
                </Box>
              )}
            </Box>
          ) : null}
        </Box>
      )}

      {/* BOTONES */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
        {activeStep === 2 && !loading && (
           <Button onClick={handleReset} sx={{ color: "#2563eb" }}>
            Lanzar otro contenedor
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
            disabled={(activeStep === 0 && !isImageValid)}
            sx={{
              background: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                boxShadow: "0 4px 14px #2563eb50",
              },
              "&:disabled": { background: "#e0e0e0" }
            }}
          >
            {activeStep === steps.length - 2 ? "Ejecutar" : "Siguiente"}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default ContainersForm;
