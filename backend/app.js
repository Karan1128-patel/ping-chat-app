import express from "express";
import cors from "cors";
import path from "path";
import { apiLimiter } from "./middlewares/rateLimit.middleware.js";
import { handleMulterError } from "./middlewares/multer.middleware.js";
import { fileURLToPath } from "url";
import { CORS_ORIGIN, PORT } from "./constants.js";
import routes from "./routes/index.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

/**
 * IMPORTANT for Render / Proxy
 */
app.set("trust proxy", 1);

const limiter = apiLimiter;
app.use(cors({ credentials: true, origin: CORS_ORIGIN }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "public")));
app.use(handleMulterError);
/**
 * Global API limiter
 */
app.use("/api", limiter);
app.use("/api", routes);

app.get("/", (req, res) => {
  res.send(`App is running on port: ${PORT}`);
});

export default app;
