import React from "react";
import HostsGrid from "./HostsGrid";
import { Container, Typography } from "@mui/material";

function App() {
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Panel de Hosts
      </Typography>
      <HostsGrid />
    </Container>
  );
}

export default App;

