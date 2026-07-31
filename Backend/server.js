import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB, { requireDBConnection } from "./config/db.js";
import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";
import authRoutes from "./routes/authRoute.js";
import postRoutes from "./routes/postRoute.js";
import userRoutes from "./routes/userRoute.js";
import commentRoutes from "./routes/commentRoute.js";
import chatRoutes from "./routes/chatRoute.js";
import sampleRoutes from "./routes/sampleRoutes.js";
import { getAllowedOrigins } from "./utils/securityConfig.js";
import { Server } from "socket.io";
import http from "http";
import Message from "./models/Message.js";
import Conversation from "./models/Conversation.js";
import xss from 'xss';

dotenv.config();

await connectDB();

const app = express();
const httpServer = http.createServer(app);
const allowedOrigins = getAllowedOrigins();

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb", parameterLimit: 50 }));
app.use(cookieParser());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Qua nhieu yeu cau tu IP nay, vui long thu lai sau 15 phut." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Dang nhap/dang ky qua nhieu lan, vui long thu lai sau." },
});

app.use("/api", globalLimiter);

app.get("/", (req, res) => {
  res.send("API Server is running...");
});

app.use("/api/sample", sampleRoutes);
app.use("/api/auth", authLimiter, requireDBConnection, authRoutes);
app.use("/api/posts", requireDBConnection, postRoutes);
app.use("/api/comments", requireDBConnection, commentRoutes);
app.use("/api/users", requireDBConnection, userRoutes);
app.use("/api/chat", requireDBConnection, chatRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Socket.IO Setup
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

// Middleware xác thực cho Socket.IO
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    // Import jwt ở trên cùng, tạm dùng cách require hoặc import (do ESM)
    // Sẽ cần bổ sung import jwt from "jsonwebtoken"; và getJwtSecret ở phần đầu file
    const jwt = await import("jsonwebtoken");
    const { getJwtSecret } = await import("./utils/securityConfig.js");
    
    const jwtSecret = getJwtSecret();
    const decoded = jwt.default.verify(token, jwtSecret);
    
    socket.user = decoded; // { userId, username }
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.userId;
  console.log(`Socket connected: ${socket.id}, User: ${userId}`);

  // Tự động cho user join vào room riêng của họ
  socket.join(userId);
  console.log(`User ${userId} automatically joined room ${userId}`);

  socket.on("send_message", async (data) => {
    // Bỏ qua data.senderId từ client, sử dụng userId từ token đã xác thực
    const senderId = socket.user.userId;
    
    try {
      if (!data.conversationId) return;
      if (!data.content || typeof data.content !== 'string' || !data.content.trim()) return;

      const safeContent = xss(data.content.trim());

      // Lưu message vào DB
      const newMessage = await Message.create({
        conversationId: data.conversationId,
        senderId: senderId,
        content: safeContent,
      });

      // Lấy danh sách thành viên trước
      const conversation = await Conversation.findById(data.conversationId);
      if (conversation) {
        conversation.lastMessage = newMessage._id;
        
        // Tăng unreadCount cho tất cả trừ người gửi
        conversation.participants.forEach(pId => {
          const pIdStr = pId.toString();
          if (pIdStr !== senderId) {
            const currentCount = conversation.unreadCounts.get(pIdStr) || 0;
            conversation.unreadCounts.set(pIdStr, currentCount + 1);
          }
        });
        
        await conversation.save();

        // Phát tin nhắn cho tất cả thành viên trong nhóm (kể cả người gửi)
        conversation.participants.forEach(participantId => {
          io.to(participantId.toString()).emit("receive_message", newMessage);
        });
      }

    } catch (error) {
      console.error("Socket send_message error:", error);
    }
  });

  // Sự kiện khi đọc tin nhắn (từ frontend báo lên)
  socket.on("read_conversation", async (conversationId) => {
    try {
      const userId = socket.user.userId;
      await Conversation.updateOne(
        { _id: conversationId },
        { $set: { [`unreadCounts.${userId}`]: 0 } }
      );
    } catch (err) {
      console.error("read_conversation error", err);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
