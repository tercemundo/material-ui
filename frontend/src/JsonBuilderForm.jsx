import React, { useState } from "react";
import { Typography, Box, Button, CircularProgress, Alert, TextField } from "@mui/material";
import DataObjectIcon from "@mui/icons-material/DataObject";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const API_URL = "http://localhost:3002/api/containers/batch";

function JsonBuilderForm() {
  const [jsonInput, setJsonInput] = useState('[\n  {\n    "image": "nginx:alpine",\n    "name": "web-server"\n  }\n]');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);

    let parsedJson;
    try {
      parsedJson = JSON.parse(jsonInput);
      if (!Array.isArray(parsedJson)) {
        throw new Error("El JSON debe ser un arreglo [ ... ].");
      }
    } catch (e) {
      setError(`Error de formato JSON: ${e.message}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedJson),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setResult({ ok: false, error: data.error, details: data.results });
      } else {
        setResult({ ok: true, output: data.output, details: data.results });
      }
    } catch (err) {
      setResult({ ok: false, error: `Error de red: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <DataObjectIcon sx={{ color: "#10b981", fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#10b981" }}>
          JSON Builder (Lote)
        </Typography>
      </Box>

      {!result && !loading && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pega o escribe un arreglo JSON de contenedores a desplegar simultáneamente.
          </Typography>

          <TextField
            multiline
            rows={8}
            fullWidth
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              setError(null);
            }}
            error={!!error}
            helperText={error}
            InputProps={{
              sx: { fontFamily: "monospace", fontSize: "0.85rem", bgcolor: "#1e1e1e", color: "#eab308" }
            }}
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#10b981" },
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!jsonInput.trim()}
              sx={{
                background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                "&:hover": {
                  background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                  boxShadow: "0 4px 14px #10b98150",
                },
              }}
            >
              Ejecutar JSON
            </Button>
          </Box>
        </>
      )}

      {loading && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 4 }}>
          <CircularProgress sx={{ color: "#10b981", mb: 2 }} />
          <Typography variant="body1">Procesando lote de contenedores...</Typography>
        </Box>
      )}

      {result && !loading && (
        <Box sx={{ width: "100%", mt: 2 }}>
          <Alert
            severity={result.ok ? "success" : "error"}
            icon={result.ok ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
            sx={{ mb: 2, borderRadius: 2 }}
          >
            {result.ok ? "Lote ejecutado correctamente." : result.error}
          </Alert>

          {result.details && Array.isArray(result.details) && (
             <Box sx={{ mb: 2 }}>
               <Typography variant="subtitle2" sx={{ mb: 1 }}>Detalle por contenedor:</Typography>
               {result.details.map((d, i) => (
                 <Typography key={i} variant="body2" color={d.status === "error" ? "error.main" : "success.main"}>
                   - {d.image} {d.name ? `(${d.name})` : ''}: {d.status === "error" ? `Fallo: ${d.error}` : "OK"}
                 </Typography>
               ))}
             </Box>
          )}

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
                whiteSpace: "pre-wrap",
                mt: 2
              }}
            >
              {result.output}
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button onClick={() => setResult(null)} sx={{ color: "#10b981" }}>
              Cargar otro JSON
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default JsonBuilderForm;
