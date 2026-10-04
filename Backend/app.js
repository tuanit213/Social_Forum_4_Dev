import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { requireDBConnection, getDBHealth } from "./config/db.js";
import { getRedisHealth } from "./config/redis.js";
import { feedQueue } from "./config/queue.js";
import { isFeedWorkerReady } from "./workers/feedWorker.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import authRoutes from "./routes/authRoute.js";
import postRoutes from "./routes/postRoute.js";
import userRoutes from "./routes/userRoute.js";
import commentRoutes from "./routes/commentRoute.js";
import chatRoutes from "./routes/chatRoute.js";
import sampleRoutes from "./routes/sampleRoutes.js";
import adminRoutes from "./routes/adminRoute.js";
import searchRoutes from "./routes/searchRoute.js";
import { getAllowedOrigins } from "./utils/securityConfig.js";

export const getRuntimeHealth = () => ({
  mongo: getDBHealth(),
  redis: getRedisHealth(),
  bullmq: { queue: Boolean(feedQueue), worker: isFeedWorkerReady() },
});

export const isRuntimeReady = () => {
  const health = getRuntimeHealth();
  return health.mongo.ready && health.redis.ready && health.bullmq.queue && health.bullmq.worker;
};

export const createApp = ({ io } = {}) => {
  const app = express();
  const allowedOrigins = getAllowedOrigins();
  app.disable("x-powered-by");
  app.set("io", io);
  app.set("runtimeHealth", getRuntimeHealth);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb", parameterLimit: 50 }));
  app.use(cookieParser());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Intent"],
  }));

  app.use("/api", rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Qua nhieu yeu cau tu IP nay, vui long thu lai sau 15 phut." },
  }));
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Dang nhap/dang ky qua nhieu lan, vui long thu lai sau." },
  });

  app.get("/health/live", (req, res) => res.status(200).json({ status: "ok" }));
  app.get("/health/ready", (req, res) => {
    const ready = isRuntimeReady();
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", checks: getRuntimeHealth() });
  });
  app.get("/", (req, res) => res.send("API Server is running..."));
  app.use("/api/sample", sampleRoutes);
  app.use("/api/auth", authLimiter, requireDBConnection, authRoutes);
  app.use("/api/posts", requireDBConnection, postRoutes);
  app.use("/api/comments", requireDBConnection, commentRoutes);
  app.use("/api/users", requireDBConnection, userRoutes);
  app.use("/api/chat", requireDBConnection, chatRoutes);
  app.use("/api/admin", requireDBConnection, adminRoutes);
  app.use("/api/search", requireDBConnection, searchRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
};

export default createApp;
