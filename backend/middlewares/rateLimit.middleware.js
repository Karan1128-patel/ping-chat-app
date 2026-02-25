import rateLimit from "express-rate-limit";

/**
 * Global API limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

/**
 * Strict Auth limiter (OTP protection)
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 attempts only
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many OTP attempts. Please try again later.",
  },
});