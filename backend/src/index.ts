import "dotenv/config";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// import session from "cookie-session";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import "./config/passport.config";
import passport from "passport";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";
import { passportAuthenticateJWT } from "./config/passport.config";
import docsRouter from "./docs";

const app = express();
const BASE_PATH = config.BASE_PATH;

// Trust the first proxy hop (host/load balancer) so req.ip reflects the real
// client — required for correct per-client rate limiting and secure cookies.
app.set("trust proxy", 1);

// Rate limiting: a broad global cap plus a stricter cap on auth endpoints to
// blunt credential brute-force and abuse. Tune the limits to real traffic.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

app.use(helmet());

app.use(express.json({ limit: "100kb" }));

app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// app.use(
//   session({
//     name: "session",
//     keys: [config.SESSION_SECRET],
//     maxAge: 24 * 60 * 60 * 1000,
//     secure: config.NODE_ENV === "production",
//     httpOnly: true,
//     sameSite: "lax",
//   })
// );

app.use(passport.initialize());
// app.use(passport.session());

app.use(
  cors({
    origin: (origin, callback) => {
      const configuredOrigins = config.FRONTEND_ORIGIN.split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const allowedOrigins = new Set([
        ...configuredOrigins,
        "http://localhost:5173",
        "http://localhost:5174",
        "https://taskflowsaas.vercel.app",
      ]);

      // Allow non-browser requests (no Origin header) and configured frontend apps.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);

// Liveness/readiness probe for load balancers and uptime monitors.
app.get(`/health`, (_req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  return res
    .status(isDbConnected ? HTTPSTATUS.OK : HTTPSTATUS.SERVICE_UNAVAILABLE)
    .json({
      status: isDbConnected ? "ok" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: isDbConnected ? "connected" : "disconnected",
    });
});

app.use(globalLimiter);

if (config.ENABLE_API_DOCS !== "false") {
  app.use(`${BASE_PATH}/docs`, docsRouter);
}

app.use(`${BASE_PATH}/auth`, authLimiter, authRoutes);
app.use(`${BASE_PATH}/user`, passportAuthenticateJWT, userRoutes);
app.use(`${BASE_PATH}/workspace`, passportAuthenticateJWT, workspaceRoutes);
app.use(`${BASE_PATH}/member`, passportAuthenticateJWT, memberRoutes);
app.use(`${BASE_PATH}/project`, passportAuthenticateJWT, projectRoutes);
app.use(`${BASE_PATH}/task`, passportAuthenticateJWT, taskRoutes);

app.use(errorHandler);

app.listen(config.PORT, async () => {
  console.log(`Server listening on port ${config.PORT} in ${config.NODE_ENV}`);
  await connectDatabase();
});
