import express from "express";
import { 
  getConversations, 
  getOrCreateConversation, 
  getMessages,
  createGroup,
  inviteToGroup,
  acceptGroupInvite,
  rejectGroupInvite,
  kickFromGroup,
  editMessage,
  deleteMessage
} from "../controllers/chatController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { validateObjectId } from "../middlewares/validateResource.js";

const router = express.Router();

// Middleware yêu cầu đăng nhập cho mọi route chat
router.use(verifyToken);

router.get("/conversations", getConversations);
router.post("/conversations", getOrCreateConversation);
router.get("/conversations/:conversationId/messages", validateObjectId("conversationId"), getMessages);

// Group Chat Routes
router.post("/groups", createGroup);
router.post("/groups/:groupId/invite", validateObjectId("groupId"), inviteToGroup);
router.put("/groups/:groupId/accept", validateObjectId("groupId"), acceptGroupInvite);
router.put("/groups/:groupId/reject", validateObjectId("groupId"), rejectGroupInvite);
router.delete("/groups/:groupId/kick/:memberId", validateObjectId("groupId"), validateObjectId("memberId"), kickFromGroup);

// Edit/Delete Messages
router.put("/messages/:messageId", validateObjectId("messageId"), editMessage);
router.delete("/messages/:messageId", validateObjectId("messageId"), deleteMessage);

export default router;
