import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import xss from "xss";
import { createApp } from "./app.js";
import connectDB, { disconnectDB } from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { startFeedQueue, stopFeedQueue } from "./config/queue.js";
import { startFeedWorker, stopFeedWorker } from "./workers/feedWorker.js";
import Conversation from "./models/Conversation.js";
import Message from "./models/Message.js";
import User from "./models/User.js";
import { getAllowedOrigins, getJwtSecret } from "./utils/securityConfig.js";

const PORT = Number.parseInt(process.env.PORT || "5000", 10);
const idsMatch = (left, right) => left?.toString() === right?.toString();
const isParticipant = (conversation, userId) =>
  conversation?.participants?.some((participant) => idsMatch(participant, userId));

export const attachSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error: No token provided"));
      const decoded = jwt.verify(token, getJwtSecret());
      if (!decoded.userId) return next(new Error("Authentication error: Invalid token"));
      const currentUser = await User.findById(decoded.userId).select("status").lean();
      if (!currentUser || ["banned", "suspended"].includes(currentUser.status)) {
        return next(new Error("Authentication error: Account unavailable"));
      }
      socket.user = decoded;
      return next();
    } catch (error) {
      console.error("Socket auth error", error.name, error.message);
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.userId.toString();
    socket.join(userId);

    socket.on("send_message", async (data = {}) => {
      try {
        const { conversationId, content } = data;
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          return socket.emit("receive_error", { message: "Conversation id không hợp lệ" });
        }
        if (typeof content !== "string" || !content.trim() || content.length > 10000) {
          return socket.emit("receive_error", { message: "Nội dung tin nhắn không hợp lệ" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return socket.emit("receive_error", { message: "Không tìm thấy cuộc trò chuyện" });
        if (!isParticipant(conversation, userId)) {
          return socket.emit("receive_error", { message: "Bạn không có quyền gửi tin nhắn" });
        }

        if (!conversation.isGroup) {
          const partnerId = conversation.participants.find((participant) => !idsMatch(participant, userId));
          const [sender, partner] = await Promise.all([
            User.findById(userId).select("blockedUsers").lean(),
            User.findById(partnerId).select("blockedUsers").lean(),
          ]);
          if (sender?.blockedUsers?.some((id) => idsMatch(id, partnerId))) {
            return socket.emit("receive_error", { message: "Bạn đã chặn người dùng này." });
          }
          if (partner?.blockedUsers?.some((id) => idsMatch(id, userId))) {
            return socket.emit("receive_error", { message: "Bạn đã bị người này chặn." });
          }
        }

        const newMessage = await Message.create({
          conversationId: conversation._id,
          senderId: userId,
          content: xss(content.trim()),
        });
        conversation.lastMessage = newMessage._id;
        conversation.deletedBy = [];
        conversation.participants.forEach((participantId) => {
          if (!idsMatch(participantId, userId)) {
            const key = participantId.toString();
            conversation.unreadCounts.set(key, (conversation.unreadCounts.get(key) || 0) + 1);
          }
        });
        await conversation.save();
        conversation.participants.forEach((participantId) => {
          io.to(participantId.toString()).emit("receive_message", newMessage);
        });
      } catch (error) {
        console.error("Socket send_message error", error.name, error.message);
        socket.emit("receive_error", { message: "Không thể gửi tin nhắn" });
      }
    });

    socket.on("read_conversation", async (conversationId) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
          return socket.emit("receive_error", { message: "Conversation id không hợp lệ" });
        }
        const conversation = await Conversation.findOne({ _id: conversationId, participants: userId }).select("_id");
        if (!conversation) {
          return socket.emit("receive_error", { message: "Bạn không có quyền đọc cuộc trò chuyện này" });
        }
        await Conversation.updateOne(
          { _id: conversation._id, participants: userId },
          { $set: { [`unreadCounts.${userId}`]: 0 } },
        );
      } catch (error) {
        console.error("Socket read_conversation error", error.name, error.message);
        socket.emit("receive_error", { message: "Không thể đánh dấu đã đọc" });
      }
    });
  });
};

export const createHttpRuntime = () => {
  const io = new Server({
    cors: { origin: getAllowedOrigins(), methods: ["GET", "POST"], credentials: true },
  });
  attachSocketHandlers(io);
  const app = createApp({ io });
  const httpServer = http.createServer(app);
  io.attach(httpServer);
  return { app, io, httpServer };
};

const closeHttpServer = (server) =>
  new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
const closeSocketServer = (io) => new Promise((resolve) => io.close(resolve));

export const startServer = async () => {
  const runtime = createHttpRuntime();
  let listening = false;
  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}, shutting down`);
    try {
      await closeSocketServer(runtime.io);
      if (listening && runtime.httpServer.listening) await closeHttpServer(runtime.httpServer);
      await stopFeedWorker();
      await stopFeedQueue();
      await disconnectRedis();
      await disconnectDB();
    } catch (error) {
      console.error("Shutdown error", error.name, error.message);
      process.exitCode = 1;
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  try {
    await connectDB();
    await connectRedis();
    await startFeedQueue();
    await startFeedWorker();
    await new Promise((resolve, reject) => {
      runtime.httpServer.once("error", reject);
      runtime.httpServer.listen(PORT, () => {
        listening = true;
        console.log(`Server running on port ${PORT}`);
        resolve();
      });
    });
    return { ...runtime, shutdown };
  } catch (error) {
    console.error("Startup failed", error.message);
    await shutdown("STARTUP_FAILURE");
    throw error;
  }
};

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
  startServer().catch(() => {
    process.exitCode = 1;
  });
}
