import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

const TerminalForm = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Inicializar Terminal
    const term = new Terminal({
      cursorBlink: true,
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
      },
      fontFamily: "'Fira Code', 'Courier New', monospace",
      fontSize: 14,
    });
    
    // Inicializar addon de ajuste (fit)
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Conectar terminal al contenedor de React
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Inicializar conexión WebSocket
    // Asumimos que la API está en el mismo host por el puerto 3002
    const wsUrl = `ws://${window.location.hostname}:3002`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln("\x1b[32m*** Conectado a la terminal del sistema ***\x1b[0m");
    };

    ws.onmessage = (event) => {
      // El backend envía datos de ptyProcess.onData
      term.write(event.data);
    };

    ws.onerror = (err) => {
      term.writeln("\x1b[31m*** Ocurrió un error en el WebSocket ***\x1b[0m");
    };

    ws.onclose = () => {
      term.writeln("\n\x1b[33m*** Desconectado del servidor de terminal ***\x1b[0m");
    };

    // Escuchar tipeo e input del usuario en xterm y enviarlo al backend
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // Ajustar tamaño del PTY si la ventana cambia
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      // Cleanup a la hora de desmontar
      resizeObserver.disconnect();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      term.dispose();
    };
  }, []);

  return (
    <Box
      sx={{
        height: "500px",
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        backgroundColor: "#1e1e1e",
        p: 1, // ligero padding interno
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.5)",
      }}
    >
      <div ref={terminalRef} style={{ width: "100%", height: "100%" }} />
    </Box>
  );
};

export default TerminalForm;
