import React, { useState, useEffect } from "react";
import { Typography, Box, Button, CircularProgress, Alert } from "@mui/material";
import CodeIcon from "@mui/icons-material/Code";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";

const API_URL = "http://localhost:3002/api/containers";

function JsonOutputForm() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo obtener la información.");
      }
      setData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCopy = () => {
    if (data) {
      navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CodeIcon sx={{ color: "#d97706", fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#d97706" }}>
            JSON Output (Contenedores)
          </Typography>
        </Box>
        <Button
          startIcon={<RefreshIcon />}
          size="small"
          onClick={fetchData}
          disabled={loading}
          sx={{ color: "#d97706" }}
        >
          Refrescar
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress sx={{ color: "#d97706" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : (
        <Box sx={{ position: "relative" }}>
          <Button
            size="small"
            startIcon={<ContentCopyIcon fontSize="small" />}
            onClick={handleCopy}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              color: copied ? "#10b981" : "#9ca3af",
              bgcolor: "rgba(255,255,255,0.1)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
              textTransform: "none",
              fontSize: "0.75rem",
            }}
          >
            {copied ? "Copiado!" : "Copiar JSON"}
          </Button>
          <Box
            sx={{
              p: 2,
              pt: 5,
              bgcolor: "#1e1e1e",
              color: "#eab308",
              borderRadius: 2,
              fontFamily: "monospace",
              fontSize: "0.85rem",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {data && data.length > 0
              ? JSON.stringify(data, null, 2)
              : "[\n  // No hay contenedores registrados aún\n]"}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default JsonOutputForm;
