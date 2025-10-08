import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import ip from "ip";
import os from "os";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import connectDB from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 5001;
// const HOST = ip.address(); // Lấy IP LAN tự động

// 🧠 Hàm lấy đúng IP LAN thật (192.168.x.x)
function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal && net.address.startsWith("192.")) {
        return net.address;
      }
    }
  }
  return "0.0.0.0";
}

const HOST = getLocalIp();

const __dirname = path.resolve();

// ✅ CORS setup
app.use(
  cors({
    origin: [
      "https://call-app-wheat.vercel.app",
      "http://localhost:5173",
      `http://${HOST}:5173`,
    ],
    credentials: true, // rất quan trọng để gửi cookie
  })
);

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// ✅ development
if (process.env.NODE_ENV === "development") {
  app.get("/", (req, res) => {
    res.send("✅ Backend is running on development mode!");
  });
}

// ✅ Listen
app.listen(PORT, HOST, () => {
  console.log(`IP: ${HOST}`)
  console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  connectDB();
});
