import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

// Inngest
import { serve } from "inngest/express";
import { inngest, functions } from "./services/inngest/index.js";

// Routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

// DB
import connectDB from "./lib/db.js";

const app = express();
const server = http.createServer(app); // tạo http server để socket.io dùng chung
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || "*",
    credentials: true,
  },
});

const PORT = process.env.PORT || 5000;

// Kết nối DB
connectDB();

// __dirname trong ESModule
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.use("/api/health", (req, res) => {
  console.log("Remote IP:", req.socket.remoteAddress);
  console.log("Remote Port:", req.socket.remotePort);
  res.status(200).json({ success: true, message: "Server is healthy" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Inngest routes
app.use("/api/inngest", serve({ client: inngest, functions }));

// --- SOCKET.IO (chat + call signaling) ---
io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id, "IP:", socket.handshake.address);

  // chat message
  socket.on("chat:message", (data) => {
    console.log(`Message from ${socket.id} (IP: ${socket.handshake.address})`, data);
    io.to(data.chatId).emit("chat:message", data);
  });

  // join chat room
  socket.on("chat:join", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  // call signaling
  socket.on("call:offer", ({ callId, sdp }) => {
    socket.to(callId).emit("call:offer", { sdp });
  });

  socket.on("call:answer", ({ callId, sdp }) => {
    socket.to(callId).emit("call:answer", { sdp });
  });

  socket.on("call:candidate", ({ callId, candidate }) => {
    socket.to(callId).emit("call:candidate", { candidate });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
