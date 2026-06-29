import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { logger } from "./config/logger";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { globalRateLimiter } from "./middleware/rateLimit.middleware";

const app = express();
const corsOptions = {
  origin: env.clientUrl,
  credentials: true,
};

// ---- Security ----
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow uploaded files to be fetched by the frontend
  })
);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(globalRateLimiter);

// ---- Core middleware ----
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.cookieSecret));
app.use(compression());
app.use(
  morgan(env.isProduction ? "combined" : "dev", {
    stream: { write: (msg) => logger.http?.(msg.trim()) ?? logger.info(msg.trim()) },
  })
);

// ---- Static file serving (local upload fallback) ----
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ---- API routes ----
app.use("/api/v1", routes);

// ---- 404 + error handling ----
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
