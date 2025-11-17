const WebSocket = require("ws");
const express = require("express");

const app = express();

const wss = new WebSocket.Server({ port: 3001 });

let waiting = null;

app.get("/", (req, res) => {
  res.send("Signaling server is running");
});

// wss.on("connection", (ws) => {
//   console.log("New client connected");

//   ws.on("message", (msg) => {
//     const data = msg.toString();

//     // JOIN QUEUE
//     if (data === "join") {
//       console.log("User joined the queue");

//       if (!waiting) {
//         waiting = ws;
//         console.log("Waiting for partner...");
//       } else {
//         ws.partner = waiting;
//         waiting.partner = ws;

//         console.log("Matched two users!");

//         ws.send(JSON.stringify({ type: "match" }));
//         waiting.send(JSON.stringify({ type: "match" }));

//         waiting = null;
//       }
//       return;
//     }

//     // DISCONNECT
//     if (data === "disconnect") {
//       console.log("User requested disconnect");
//       if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
//         ws.partner.send(JSON.stringify({ type: "partner_disconnected" }));
//         ws.partner.partner = null;
//       }
//       ws.partner = null;
//       return;
//     }

//     // RELAY SIGNALING DATA
//     try {
//       const json = JSON.parse(data);
//       if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
//         ws.partner.send(JSON.stringify(json));
//       }
//     } catch (err) {
//       console.log("JSON error:", err);
//     }
//   });

//   ws.on("close", () => {
//     console.log("Client disconnected");
//     if (waiting === ws) waiting = null;

//     if (ws.partner && ws.partner.readyState === WebSocket.OPEN) {
//       ws.partner.send(JSON.stringify({ type: "partner_disconnected" }));
//       ws.partner.partner = null;
//     }
//     ws.partner = null;
//   });
// });

app.listen(3000, () => {
  console.log("HTTP server running on http://localhost:3000");
});

console.log("Signaling server running on ws://localhost:3001");
