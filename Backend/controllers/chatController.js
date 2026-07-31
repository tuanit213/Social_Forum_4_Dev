import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import xss from 'xss';

// @desc    Lấy danh sách các cuộc hội thoại của user hiện tại
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Lấy danh sách conversation có chứa userId (ở participants hoặc pendingMembers)
    const conversations = await Conversation.find({
      $or: [
        { participants: userId },
        { pendingMembers: userId }
      ]
    })
      .populate("participants", "username displayName avatarUrl")
      .populate("pendingMembers", "username displayName avatarUrl")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, conversations });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy/Tạo cuộc hội thoại 1-1 với 1 user cụ thể (chưa cần tạo nếu chưa có tin nhắn, nhưng để đơn giản có thể tạo rỗng)
// @route   POST /api/chat/conversations
// @access  Private
export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.userId;

    if (!receiverId) {
      return res.status(400).json({ success: false, message: "Thiếu receiverId" });
    }

    // Tìm xem đã có conversation 1-1 giữa 2 người này chưa
    let conversation = await Conversation.findOne({
      isGroup: false,
      $and: [
        { participants: senderId },
        { participants: receiverId }
      ]
    }).populate("participants", "username displayName avatarUrl");

    if (!conversation) {
      // Chưa có thì tạo mới
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
      conversation = await conversation.populate("participants", "username displayName avatarUrl");
    }

    res.status(200).json({ success: true, conversation });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy danh sách tin nhắn của 1 conversation (có phân trang)
// @route   GET /api/chat/conversations/:conversationId/messages
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);

    // Kiểm tra quyền (IDOR Check)
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
    }
    
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền đọc cuộc trò chuyện này" });
    }

    // Tính skip (số tin nhắn bỏ qua)
    const skip = (page - 1) * limit;

    // Sort theo createdAt giảm dần để lấy tin nhắn mới nhất, sau đó trên frontend sẽ đảo ngược lại
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Tính tổng số lượng để frontend biết khi nào hết
    const totalMessages = await Message.countDocuments({ conversationId });
    const hasMore = skip + messages.length < totalMessages;

    // Đảo ngược mảng để gửi cho frontend thứ tự từ cũ đến mới trong mảng (vì frontend thường map từ trên xuống)
    // Hoặc giữ nguyên và để frontend tự prepend. Ta sẽ gửi nguyên bản sort giảm dần.
    res.status(200).json({ success: true, messages: messages.reverse(), hasMore, totalMessages });
  } catch (error) {
    next(error);
  }
};

// ========================
// GROUP CHAT APIs
// ========================

// @desc    Tạo Group Chat
// @route   POST /api/chat/groups
// @access  Private
export const createGroup = async (req, res, next) => {
  try {
    const { groupName, memberIds } = req.body;
    const userId = req.user.userId;

    if (!groupName || typeof groupName !== 'string' || !groupName.trim() || !memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
    }

    const safeGroupName = xss(groupName.trim());

    const newGroup = await Conversation.create({
      isGroup: true,
      groupName: safeGroupName,
      groupAdmin: userId,
      participants: [userId], // Người tạo tự động tham gia và làm Admin
      pendingMembers: memberIds.filter(id => id !== userId), // Mời các thành viên khác
    });

    const populatedGroup = await newGroup.populate("participants pendingMembers", "username displayName avatarUrl");

    const io = req.app.get("io");
    if (io) {
      populatedGroup.pendingMembers.forEach(member => {
        io.to(member._id.toString()).emit("new_group", populatedGroup);
      });
    }

    res.status(201).json({ success: true, group: populatedGroup });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin mời thêm thành viên vào Group
// @route   PUT /api/chat/groups/:id/invite
// @access  Private
export const inviteToGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { memberIds } = req.body;
    const userId = req.user.userId;

    const group = await Conversation.findById(id);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (group.groupAdmin.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Chỉ Admin mới có quyền mời thành viên" });
    }

    // Thêm các user vào pendingMembers nếu họ chưa ở trong participants hoặc pendingMembers
    const newPending = memberIds.filter(mId => 
      !group.participants.includes(mId) && !group.pendingMembers.includes(mId)
    );

    group.pendingMembers.push(...newPending);
    await group.save();
    
    const populatedGroup = await Conversation.findById(id).populate("participants pendingMembers", "username displayName avatarUrl");

    const io = req.app.get("io");
    if (io) {
      newPending.forEach(mId => {
        io.to(mId.toString()).emit("new_group", populatedGroup);
      });
    }

    res.status(200).json({ success: true, group: populatedGroup });
  } catch (error) {
    next(error);
  }
};

// @desc    Chấp nhận lời mời vào Group
// @route   PUT /api/chat/groups/:id/accept
// @access  Private
export const acceptGroupInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const group = await Conversation.findById(id);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (!group.pendingMembers.includes(userId)) {
      return res.status(400).json({ success: false, message: "Bạn không có lời mời vào nhóm này" });
    }

    // Chuyển từ pending sang participants
    group.pendingMembers = group.pendingMembers.filter(mId => mId.toString() !== userId);
    if (!group.participants.includes(userId)) {
      group.participants.push(userId);
    }
    
    await group.save();
    res.status(200).json({ success: true, message: "Đã tham gia nhóm", group });
  } catch (error) {
    next(error);
  }
};

// @desc    Từ chối lời mời vào Group
// @route   PUT /api/chat/groups/:id/reject
// @access  Private
export const rejectGroupInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const group = await Conversation.findById(id);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    group.pendingMembers = group.pendingMembers.filter(mId => mId.toString() !== userId);
    await group.save();
    
    res.status(200).json({ success: true, message: "Đã từ chối lời mời" });
  } catch (error) {
    next(error);
  }
};

// @desc    Kick thành viên khỏi Group
// @route   DELETE /api/chat/groups/:id/kick/:userId
// @access  Private
export const kickFromGroup = async (req, res, next) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const adminId = req.user.userId;

    const group = await Conversation.findById(id);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (group.groupAdmin.toString() !== adminId) {
      return res.status(403).json({ success: false, message: "Chỉ Admin mới có quyền kick thành viên" });
    }

    if (adminId === targetUserId) {
      return res.status(400).json({ success: false, message: "Admin không thể tự kick chính mình" });
    }

    group.participants = group.participants.filter(mId => mId.toString() !== targetUserId);
    await group.save();
    
    res.status(200).json({ success: true, message: "Đã xóa thành viên khỏi nhóm" });
  } catch (error) {
    next(error);
  }
};

// @desc    Sửa tin nhắn
// @route   PUT /api/chat/messages/:messageId
// @access  Private
export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung không hợp lệ" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tin nhắn" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền sửa tin nhắn này" });
    }

    const safeContent = xss(content.trim());
    message.content = safeContent;
    message.isEdited = true;
    await message.save();

    // Lấy thông tin conversation để phát sự kiện
    const conversation = await Conversation.findById(message.conversationId);
    const io = req.app.get("io");
    if (io && conversation) {
      conversation.participants.forEach(participantId => {
        io.to(participantId.toString()).emit("edit_message", message);
      });
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa tin nhắn (Thu hồi)
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Không tìm thấy tin nhắn" });
    }

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa tin nhắn này" });
    }

    message.content = "Tin nhắn đã bị thu hồi";
    message.isDeleted = true;
    await message.save();

    const conversation = await Conversation.findById(message.conversationId);
    const io = req.app.get("io");
    if (io && conversation) {
      conversation.participants.forEach(participantId => {
        io.to(participantId.toString()).emit("delete_message", message);
      });
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};
