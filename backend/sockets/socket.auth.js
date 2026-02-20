import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constants.js";

export const socketAuth = (socket, next) => {
  try {
    const authHeader = socket.handshake.headers.authorization;
    const deviceId = socket.handshake.headers["device-id"];

    if (!authHeader || !deviceId) {
      return next(new Error("Unauthorized"));
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, JWT_SECRET);

    socket.userId = decoded.id;
    socket.deviceId = deviceId;

    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
};
