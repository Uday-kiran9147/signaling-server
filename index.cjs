const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();

// Azure provides PORT environment variable
const PORT = process.env.PORT || 3000;

// Simple health check
app.get("/", (req, res) => {
  res.send("Signaling server is running");
});

// Create HTTP server for Express
const server = http.createServer(app);

// Attach WebSocket server to same HTTP server
const wss = new WebSocket.Server({ server });

// Queue for matchmaking
let waiting = null;

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.isAlive = true;

  // Heartbeat to detect dead connections
  ws.on("pong", () => { ws.isAlive = true; });

  ws.on("message", (msg) => {
    const data = msg.toString();

    // JOIN QUEUE
    if (data === "join") {
      console.log("User joined the queue");

      if (!waiting) {
        waiting = ws;
        console.log("Waiting for partner...");
      } else {
        ws.partner = waiting;
        waiting.partner = ws;

        console.log("Matched two users!");
        ws.send(JSON.stringify({ type: "match" }));
        waiting.send(JSON.stringify({ type: "match" }));

        waiting = null;
      }
      return;
    }

    // DISCONNECT
    if (data === "disconnect") {
      console.log("User requested disconnect");
      if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
        ws.partner.send(JSON.stringify({ type: "partner_disconnected" }));
        ws.partner.partner = null;
      }
      ws.partner = null;
      return;
    }

    // RELAY SIGNALING DATA
    try {
      const json = JSON.parse(data);
      if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
        ws.partner.send(JSON.stringify(json));
      }
    } catch (err) {
      console.error("JSON parse error:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    if (waiting === ws) waiting = null;

    if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
      ws.partner.send(JSON.stringify({ type: "partner_disconnected" }));
      ws.partner.partner = null;
    }
    ws.partner = null;
  });
});

// Ping clients periodically to keep connection alive (WebSocket heartbeat)
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000); // every 30 seconds

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP server running on port http://localhost:${PORT}`);
  console.log(`WebSocket server ready at ws://localhost:${PORT}`);
});

// Clean up on process exit
process.on("SIGTERM", () => {
  clearInterval(interval);
  wss.close();
  server.close(() => {
    console.log("Server shutting down gracefully");
    process.exit(0);
  });
});
