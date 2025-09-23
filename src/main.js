import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";

import { inngest, functions } from "./services/inngest/index.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import connectDB from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();
const __dirname = path.resolve();

// CORS: Cho phép các origin gọi API
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [];

// middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // allow frontend to send cookies
  })
);
app.use(express.json());
app.use(cookieParser());
// app.use(clerkMiddleware());

// check server
app.use('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy' });
});

// routes API
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use('/api/inngest', serve({ client: inngest, functions })); //ingest routes

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
