import express from "express";
import { 
  getConversations, 
  getOrCreateConversation, 
  getMessages,
  searchMessages,
  hideConversation,
  createGroup,
  inviteToGroup,
  acceptGroupInvite,
  rejectGroupInvite,
  kickFromGroup,
  leaveGroup,
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
router.get("/conversations/:conversationId/search", validateObjectId("conversationId"), searchMessages);
router.delete("/conversations/:id/hide", validateObjectId("id"), hideConversation);

// Group Chat Routes
router.post("/groups", createGroup);
router.post("/groups/:groupId/invite", validateObjectId("groupId"), inviteToGroup);
router.put("/groups/:groupId/accept", validateObjectId("groupId"), acceptGroupInvite);
router.put("/groups/:groupId/reject", validateObjectId("groupId"), rejectGroupInvite);
router.delete("/groups/:groupId/kick/:memberId", validateObjectId("groupId"), validateObjectId("memberId"), kickFromGroup);
router.put("/groups/:groupId/leave", validateObjectId("groupId"), leaveGroup);

// Edit/Delete Messages
router.put("/messages/:messageId", validateObjectId("messageId"), editMessage);
router.delete("/messages/:messageId", validateObjectId("messageId"), deleteMessage);

export default router;
