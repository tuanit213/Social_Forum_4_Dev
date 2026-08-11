import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Tối ưu hóa truy vấn tin nhắn (Lấy tin nhắn mới nhất của một cuộc trò chuyện)
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Tối ưu hóa tìm kiếm văn bản (Full-text search)
messageSchema.index({ content: "text" });

const Message = mongoose.model("Message", messageSchema);

export default Message;
