import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const API_URL = "http://localhost:3001/hosts";

function HostsGrid() {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formData, setFormData] = useState({ ip: "", paquete: "", so: "" });
  const [editingHost, setEditingHost] = useState(null); // null o id para editar

  const fetchHosts = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Error al obtener datos");
      const data = await res.json();
      setHosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const resetForm = () => {
    setFormData({ ip: "", paquete: "", so: "" });
    setEditingHost(null);
    setOpenDialog(false);
  };

  const handleSubmit = async () => {
    try {
      let url = API_URL;
      let method = "POST";

      if (editingHost) {
        url = `${API_URL}/${editingHost}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(`Error al ${editingHost ? "actualizar" : "crear"}`);
      
      resetForm();
      fetchHosts();
      showSnackbar(
        editingHost ? "Host actualizado" : "Host creado", 
        "success"
      );
    } catch (err) {
      showSnackbar("Error en la operación", "error");
    }
  };

  const handleEdit = (host) => {
    setFormData({ ip: host.ip, paquete: host.paquete, so: host.so });
    setEditingHost(host.id);
    setOpenDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmDelete) {
      try {
        const res = await fetch(`${API_URL}/${confirmDelete.id}`, { 
          method: "DELETE" 
        });
        if (!res.ok) throw new Error("Error al borrar");
        setConfirmDelete(null);
        fetchHosts();
        showSnackbar("Host eliminado", "success");
      } catch (err) {
        showSnackbar("Error al eliminar", "error");
      }
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  if (loading) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 8 }} />;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => {
          resetForm();
          setOpenDialog(true);
        }}
        sx={{ mb: 2 }}
      >
        {editingHost ? "Editar Host" : "Nuevo Host"}
      </Button>

      <Grid container spacing={2}>
        {hosts.map((host) => (
          <Grid item key={host.id} xs={12} sm={6} md={4}>
            <Card variant="outlined" sx={{ position: "relative", height: "100%" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {host.ip}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 1 }}>
                  Paquete: {host.paquete}
                </Typography>
                <Typography color="text.secondary">
                  SO: {host.so}
                </Typography>
                
                <div style={{ position: "absolute", top: 8, right: 8 }}>
                  <IconButton 
                    color="primary" 
                    size="small"
                    onClick={() => handleEdit(host)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    size="small"
                    onClick={() => setConfirmDelete({ id: host.id, ip: host.ip })}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog Crear/Editar */}
      <Dialog open={openDialog} onClose={resetForm} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingHost ? "Editar Host" : "Nuevo Host"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Dirección IP"
            value={formData.ip}
            onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Paquete"
            value={formData.paquete}
            onChange={(e) => setFormData({ ...formData, paquete: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Sistema Operativo"
            value={formData.so}
            onChange={(e) => setFormData({ ...formData, so: e.target.value })}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={resetForm}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingHost ? "Actualizar" : "Crear"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Confirmar Borrar */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle sx={{ color: "error.main" }}>
          ¿Eliminar Host?
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar <strong>{confirmDelete?.ip}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
          >
            Sí, eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <SnackbarContent 
          message={snackbarMessage}
          sx={{
            backgroundColor: openSnackbar === "success" ? "success.main" : "error.main"
          }}
        />
      </Snackbar>
    </>
  );
}

export default HostsGrid;

