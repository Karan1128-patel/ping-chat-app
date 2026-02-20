import app from "./app.js";
import http from "http";
import { PORT } from "./constants.js";
import { connectDB } from "./config/db.js";
import { initSocketServer } from "./sockets/socket.server.js";

const server = http.createServer(app);

initSocketServer(server);

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
