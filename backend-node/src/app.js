require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");

const Database = require("./config/database");
const setupSwagger = require("./config/swagger");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const groupRoutes = require("./routes/groups");
const restaurantRoutes = require("./routes/restaurants");

// Import socket handlers
const setupSocketHandlers = require("./sockets/socketHandlers");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Permite qualquer origem por agora
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// CORS configuration - tem de ser ANTES do helmet
app.use(
  cors({
    origin: "*", // Permite qualquer origem por agora
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: true,
  })
);

// Helmet com configurações mais permissivas para desenvolvimento
app.use(
  helmet({
    contentSecurityPolicy: false, // Desativa para desenvolvimento
    crossOriginResourcePolicy: false, // Desativa para desenvolvimento
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  skip: (req) => {
    // Skip rate limiting for Swagger UI
    return req.path.startsWith("/api-docs");
  },
});
app.use(limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Setup Swagger
setupSwagger(app);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/groups", groupRoutes);
app.use("/restaurants", restaurantRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// Setup Socket.IO
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Initialize database
    await Database.initializeDatabase();

    // Start server
    server.listen(PORT, () => {
      console.log("🚀 Server running on port", PORT);
      console.log(
        "📖 API documentation: http://localhost:" + PORT + "/api-docs"
      );
      console.log("🏥 Health check: http://localhost:" + PORT + "/health");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
