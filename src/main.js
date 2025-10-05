import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import connectDB from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 5001;

const __dirname = path.resolve();

// ✅ CORS setup (quan trọng nhất)
app.use(
  cors({
    origin: ["https://call-app-wheat.vercel.app", "http://localhost:5173"],
    credentials: true, // Cho phép cookie JWT cross-domain
  })
);

// Middlewares cơ bản
app.use(express.json());
app.use(cookieParser());

// ✅ API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Production (Render sẽ không có frontend/dist)
if (process.env.NODE_ENV === "production") {
  app.get("/", (req, res) => {
    res.send("✅ Backend is running on Render!");
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  connectDB();
});
