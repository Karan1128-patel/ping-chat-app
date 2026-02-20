import jwt from "jsonwebtoken";
import { apiError, apiHandler } from "../utils/api.util.js";
import { CUSTOM_ERROR, UNAUTHORIZED } from "../utils/message.util.js";
import { JWT_SECRET } from "../constants.js";

export const authGuard = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication token missing", });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, };
    next();
  } catch (error) {
    return apiError(UNAUTHORIZED, "Invalid token", null, res);
  }
};
