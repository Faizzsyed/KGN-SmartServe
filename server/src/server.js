import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { connectDatabase } from "./config/db.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import serviceRequestRoutes from "./routes/serviceRequestRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(serverDirectory, "../.env") });

const app = express();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "*", methods: ["GET", "POST", "PATCH"] }));
app.use(express.json());

// Routes
app.get("/api/health", (req, res) => res.json({ success: true, message: "KGN SmartServe API running" }));
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/service-requests", serviceRequestRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Error handling
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ success: false, message: error.message || "Server error" });
});

let io;

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  await connectDatabase();

  if (!res.socket.server.io) {
    io = new Server(res.socket.server, {
      path: "/socket.io",
      addTrailingSlash: false,
      cors: { origin: process.env.CLIENT_URL || "*", methods: ["GET", "POST", "PATCH"] }
    });
    app.set("io", io);
    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.id}`));
    });
    res.socket.server.io = io;
  }

  return app(req, res);
}

// Local Server Initialization
if (!process.env.VERCEL) {
  const httpServer = http.createServer(app);
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET", "POST", "PATCH"] } });
  app.set("io", io);
  
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.id}`));
  });

  const port = process.env.PORT || 5000;
  connectDatabase()
    .then(() => httpServer.listen(port, () => console.log(`KGN SmartServe API listening on port ${port}`)))
    .catch((error) => {
      console.error(`Server not started: ${error.message}`);
      process.exit(1);
    });
}
