const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3001 });

let waiting = null;

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (msg) => {
    const data = msg.toString();

    // When user joins the queue
    if (data === "join") {
      console.log("User joined the queue");

      if (!waiting) {
        waiting = ws;
        console.log("Waiting for partner...");
      } else {
        // Match 2 users
        ws.partner = waiting;
        waiting.partner = ws;

        console.log("Matched two users!");

        ws.send(JSON.stringify({ type: "match" }));
        waiting.send(JSON.stringify({ type: "match" }));

        waiting = null;
      }
      return;
    }

    // When user disconnects from call
    if (data === "disconnect") {
      console.log("User requested disconnect");
      
      if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
        // Notify partner that user disconnected
        ws.partner.send(JSON.stringify({ type: "partner_disconnected" }));
        ws.partner.partner = null;
      }
      
      ws.partner = null;
      console.log("User disconnected from partner");
      return;
    }

    // Relay signaling messages to the matched partner
    try {
      const json = JSON.parse(data);

      if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
        ws.partner.send(JSON.stringify(json));
      }
    } catch (err) {
      console.log("JSON error:", err);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    
    // Remove from waiting queue if present
    if (waiting === ws) {
      waiting = null;
      console.log("Removed from waiting queue");
    }

    // Notify partner if in active call
    if (ws.partner) {
      if (ws.partner.readyState === WebSocket.OPEN) {
        ws.partner.send(JSON.stringify({ type: "partner_disconnected" }));
      }
      ws.partner.partner = null;
      ws.partner = null;
      console.log("Partner notified of disconnection");
    }
  });
});

console.log("Signaling server running on ws://localhost:3001");