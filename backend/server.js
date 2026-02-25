// import "./queues/message.worker.js";
import app from "./app.js";
import http from "http";
import { PORT } from "./constants.js";
import { connectDB } from "./config/db.js";
import { initSocketServer } from "./sockets/socket.server.js";
import redis from "./config/redis.js"; 

const server = http.createServer(app);

// Timeout configuration
server.requestTimeout = 60000;   // 60 seconds
server.headersTimeout = 65000;

/** Initialize Socket Server */
try {
  initSocketServer(server);
} catch (err) {
  console.error("❌ Failed to initialize socket server:", err.message);
  process.exit(1);
}

/** Graceful Shutdown Function*/
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log("✅ HTTP server closed.");

    try {
      // Close DB connection If using mysql pool
      // await db.end();
      console.log("✅ DB connection closed.");

      // Close Redis if exists
      if (redis) {
        await redis.quit();
        console.log("✅ Redis connection closed.");
      }

      process.exit(0);
    } catch (err) {
      console.error("❌ Error during shutdown:", err.message);
      process.exit(1);
    }
  });
};

/**
 * Process Signals
 */
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

/**
 * Start Server
 */
connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to start server due to DB error:", err.message);
    process.exit(1);
  });