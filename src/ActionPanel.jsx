import React, { useState } from "react";
import {
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Box,
  Collapse,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ExtensionIcon from "@mui/icons-material/Extension";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import SudoersForm from "./SudoersForm";
import HostsGrid from "./HostsGrid";
import ShutdownForm from "./ShutdownForm";

const ACTIONS = [
  {
    id: "sudoers",
    label: "Sudoers",
    description: "Gestionar usuarios con privilegios sudo",
    icon: AdminPanelSettingsIcon,
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
  },
  {
    id: "paquetes",
    label: "Paquetes",
    description: "Instalar y desinstalar paquetes del sistema",
    icon: ExtensionIcon,
    color: "#0891b2",
    gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
  },
  {
    id: "apagado",
    label: "Apagado",
    description: "Reiniciar o apagar el servidor",
    icon: PowerSettingsNewIcon,
    color: "#dc2626",
    gradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
  },
];

function ActionPanel() {
  const [activeAction, setActiveAction] = useState(null);

  const handleCardClick = (id) => {
    setActiveAction((prev) => (prev === id ? null : id));
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ fontWeight: 700, color: "text.primary", mb: 2 }}
      >
        Acciones del Sistema
      </Typography>

      {/* Row of 3 action cards */}
      <Grid container spacing={2}>
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const isActive = activeAction === action.id;
          return (
            <Grid item xs={12} sm={4} key={action.id}>
              <Card
                elevation={isActive ? 8 : 2}
                sx={{
                  borderRadius: 3,
                  border: isActive
                    ? `2px solid ${action.color}`
                    : "2px solid transparent",
                  transition: "all 0.25s ease",
                  transform: isActive ? "translateY(-4px)" : "translateY(0)",
                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: `0 8px 24px ${action.color}40`,
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleCardClick(action.id)}
                  sx={{ borderRadius: 3 }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      py: 3,
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: action.gradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: `0 4px 14px ${action.color}50`,
                        mb: 1,
                      }}
                    >
                      <Icon sx={{ color: "#fff", fontSize: 32 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: action.color }}
                    >
                      {action.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                    >
                      {action.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Expandable form area */}
      <Collapse in={activeAction === "sudoers"} timeout={350}>
        <Box
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 3,
            border: "2px solid #7c3aed40",
            background: "linear-gradient(135deg, #7c3aed08 0%, #a855f708 100%)",
            boxShadow: "0 4px 24px #7c3aed18",
          }}
        >
          <SudoersForm />
        </Box>
      </Collapse>

      <Collapse in={activeAction === "paquetes"} timeout={350}>
        <Box
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 3,
            border: "2px solid #0891b240",
            background: "linear-gradient(135deg, #0891b208 0%, #06b6d408 100%)",
            boxShadow: "0 4px 24px #0891b218",
          }}
        >
          <HostsGrid />
        </Box>
      </Collapse>

      <Collapse in={activeAction === "apagado"} timeout={350}>
        <Box
          sx={{
            mt: 3,
            p: 3,
            borderRadius: 3,
            border: "2px solid #dc262640",
            background: "linear-gradient(135deg, #dc262608 0%, #ef444408 100%)",
            boxShadow: "0 4px 24px #dc262618",
          }}
        >
          <ShutdownForm />
        </Box>
      </Collapse>
    </Box>
  );
}

export default ActionPanel;
