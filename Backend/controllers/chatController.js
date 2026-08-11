import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import xss from 'xss';
import mongoose from 'mongoose';

// @desc    Lấy danh sách các cuộc hội thoại của user hiện tại
// @route   GET /api/chat/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Lấy danh sách conversation có chứa userId (ở participants hoặc pendingMembers) và chưa bị xóa bởi user
    const conversations = await Conversation.find({
      $or: [
        { participants: userId },
        { pendingMembers: userId }
      ],
      deletedBy: mongoose.trusted({ $ne: userId })
    })
      .populate("participants", "Username displayName avatarUrl")
      .populate("pendingMembers", "Username displayName avatarUrl")
      .populate({
        path: "lastMessage",
        populate: { path: "senderId", select: "Username displayName avatarUrl" }
      })
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
    }).populate("participants", "Username displayName avatarUrl");

    if (!conversation) {
      // Chưa có thì tạo mới
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
      conversation = await conversation.populate("participants", "Username displayName avatarUrl");
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
      .limit(limit)
      .populate("senderId", "Username displayName avatarUrl");

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

// @desc    Tìm kiếm tin nhắn trong một cuộc hội thoại bằng Full-Text Search
// @route   GET /api/chat/conversations/:conversationId/search?q=keyword
// @access  Private
export const searchMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { q } = req.query;
    const userId = req.user.userId;

    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: "Từ khóa tìm kiếm không được để trống" });
    }

    // Kiểm tra quyền (IDOR Check)
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
    }
    
    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền đọc cuộc trò chuyện này" });
    }

    // Sử dụng Text Index của MongoDB để tìm kiếm nhanh
    const messages = await Message.find({
      conversationId,
      $text: { $search: q },
      isDeleted: false // Không tìm kiếm các tin nhắn đã bị thu hồi
    })
    .sort({ createdAt: -1 }) // Sắp xếp theo thời gian mới nhất (hoặc thay bằng { score: { $meta: "textScore" } } nếu muốn ưu tiên độ chính xác)
    .limit(50); // Giới hạn 50 kết quả

    // Trả về mảng messages. Có thể giữ nguyên thứ tự hoặc reverse() tùy logic Frontend
    // Đảo ngược để giống cấu trúc mảng trả về của getMessages
    res.status(200).json({ success: true, messages: messages.reverse() });
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

    const populatedGroup = await Conversation.findById(newGroup._id)
      .populate("participants pendingMembers", "Username displayName avatarUrl")
      .populate("lastMessage");

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

// @desc    Sửa tên nhóm
// @route   PUT /api/chat/groups/:id/rename
// @access  Private
export const renameGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { groupName } = req.body;
    const userId = req.user.userId;

    if (!groupName || typeof groupName !== 'string' || !groupName.trim()) {
      return res.status(400).json({ success: false, message: "Tên nhóm không hợp lệ" });
    }

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (group.groupAdmin.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Chỉ Admin mới có quyền đổi tên nhóm" });
    }

    group.groupName = xss(groupName.trim());
    await group.save();

    const populatedGroup = await Conversation.findById(groupId)
      .populate("participants pendingMembers", "Username displayName avatarUrl")
      .populate("lastMessage");

    const io = req.app.get("io");
    if (io) {
      populatedGroup.participants.forEach(participantId => {
        io.to(participantId._id.toString()).emit("update_group", populatedGroup);
      });
    }

    res.status(200).json({ success: true, message: "Đã cập nhật tên nhóm", group: populatedGroup });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin mời thêm thành viên vào Group
// @route   PUT /api/chat/groups/:id/invite
// @access  Private
export const inviteToGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user.userId;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (group.groupAdmin.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Chỉ Admin mới có quyền mời thành viên" });
    }

    // Thêm các user vào pendingMembers nếu họ chưa ở trong participants, pendingMembers, hoặc bannedMembers
    const newPending = memberIds.filter(mId => 
      !group.participants.some(p => p.toString() === mId) && 
      !group.pendingMembers.some(p => p.toString() === mId) &&
      (!group.bannedMembers || !group.bannedMembers.some(p => p.toString() === mId))
    );

    if (newPending.length === 0) {
      return res.status(400).json({ success: false, message: "Người dùng đã có trong nhóm, đang chờ duyệt, hoặc đã bị cấm." });
    }

    group.pendingMembers.push(...newPending);
    await group.save();
    
    const populatedGroup = await Conversation.findById(groupId).populate("participants pendingMembers", "Username displayName avatarUrl");

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
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (!group.pendingMembers.some(mId => mId.toString() === userId)) {
      return res.status(400).json({ success: false, message: "Bạn không có lời mời tham gia nhóm này" });
    }

    // Chuyển từ pending sang participants
    group.pendingMembers = group.pendingMembers.filter(mId => mId.toString() !== userId);
    if (!group.participants.some(pId => pId.toString() === userId)) {
      group.participants.push(userId);
    }
    
    await group.save();
    
    // Populate để trả về group hợp lệ cho frontend hiển thị
    const populatedGroup = await Conversation.findById(group._id)
      .populate("participants", "Username displayName avatarUrl")
      .populate("pendingMembers", "Username displayName avatarUrl")
      .populate("lastMessage");
      
    const io = req.app.get("io");
    if (io) {
      populatedGroup.participants.forEach(participantId => {
        io.to(participantId._id.toString()).emit("update_group", populatedGroup);
      });
    }

    res.status(200).json({ success: true, message: "Đã tham gia nhóm", group: populatedGroup });
  } catch (error) {
    next(error);
  }
};

// @desc    Từ chối lời mời vào Group
// @route   PUT /api/chat/groups/:id/reject
// @access  Private
export const rejectGroupInvite = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    // Xóa khỏi pendingMembers
    group.pendingMembers = group.pendingMembers.filter(mId => mId.toString() !== userId);
    await group.save();

    const populatedGroup = await Conversation.findById(group._id)
      .populate("participants", "Username displayName avatarUrl")
      .populate("pendingMembers", "Username displayName avatarUrl")
      .populate("lastMessage");
      
    const io = req.app.get("io");
    if (io) {
      populatedGroup.participants.forEach(participantId => {
        io.to(participantId._id.toString()).emit("update_group", populatedGroup);
      });
    }

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
    const { groupId, memberId: targetUserId } = req.params;
    const adminId = req.user.userId;

    const group = await Conversation.findById(groupId);
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
    group.pendingMembers = group.pendingMembers.filter(mId => mId.toString() !== targetUserId);
    await group.save();
    
    const populatedGroup = await Conversation.findById(groupId)
      .populate("participants pendingMembers", "Username displayName avatarUrl")
      .populate("lastMessage");

    const io = req.app.get("io");
    if (io) {
      populatedGroup.participants.forEach(participantId => {
        io.to(participantId._id.toString()).emit("update_group", populatedGroup);
      });
      io.to(targetUserId).emit("kicked_from_group", groupId);
    }

    res.status(200).json({ success: true, message: "Đã xóa thành viên khỏi nhóm" });
  } catch (error) {
    next(error);
  }
};

// @desc    Block thành viên khỏi Group (Kick và cấm quay lại)
// @route   PUT /api/chat/groups/:groupId/block/:memberId
// @access  Private
export const blockFromGroup = async (req, res, next) => {
  try {
    const { groupId, memberId } = req.params;
    const adminId = req.user.userId;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (group.groupAdmin.toString() !== adminId) {
      return res.status(403).json({ success: false, message: "Chỉ Admin mới có quyền block thành viên" });
    }

    if (adminId === memberId) {
      return res.status(400).json({ success: false, message: "Admin không thể tự block chính mình" });
    }

    // Xóa khỏi participants và pendingMembers (nếu có)
    group.participants = group.participants.filter(mId => mId.toString() !== memberId);
    group.pendingMembers = group.pendingMembers.filter(mId => mId.toString() !== memberId);
    
    // Thêm vào bannedMembers
    if (!group.bannedMembers) group.bannedMembers = [];
    if (!group.bannedMembers.some(mId => mId.toString() === memberId)) {
      group.bannedMembers.push(memberId);
    }

    await group.save();
    
    const populatedGroup = await Conversation.findById(groupId)
      .populate("participants pendingMembers", "Username displayName avatarUrl")
      .populate("lastMessage");

    const io = req.app.get("io");
    if (io) {
      populatedGroup.participants.forEach(participantId => {
        io.to(participantId._id.toString()).emit("update_group", populatedGroup);
      });
      // Gửi event riêng cho người bị block để tự động thoát giao diện nếu đang mở
      io.to(memberId).emit("kicked_from_group", groupId);
    }
    
    res.status(200).json({ success: true, message: "Đã block thành viên khỏi nhóm", group: populatedGroup });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa (Giải tán) Group
// @route   DELETE /api/chat/groups/:id
// @access  Private
export const deleteGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const adminId = req.user.userId;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (group.groupAdmin.toString() !== adminId) {
      return res.status(403).json({ success: false, message: "Chỉ Admin mới có quyền xóa nhóm" });
    }

    const participants = [...group.participants];

    // Xóa tất cả tin nhắn thuộc nhóm
    await Message.deleteMany({ conversationId: groupId });
    
    // Xóa nhóm
    await Conversation.findByIdAndDelete(groupId);

    const io = req.app.get("io");
    if (io) {
      participants.forEach(participantId => {
        io.to(participantId.toString()).emit("delete_group", groupId);
      });
    }

    res.status(200).json({ success: true, message: "Đã giải tán nhóm" });
  } catch (error) {
    next(error);
  }
};

// @desc    Tự rời khỏi Group
// @route   PUT /api/chat/groups/:id/leave
// @access  Private
export const leaveGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.userId;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ success: false, message: "Nhóm không tồn tại" });
    }

    if (!group.participants.includes(userId)) {
      return res.status(400).json({ success: false, message: "Bạn không phải là thành viên của nhóm này" });
    }

    // Nếu là Admin rời nhóm
    if (group.groupAdmin.toString() === userId) {
      // Nếu nhóm còn người khác, chuyển quyền Admin cho người tiếp theo
      const otherMembers = group.participants.filter(mId => mId.toString() !== userId);
      if (otherMembers.length > 0) {
        group.groupAdmin = otherMembers[0];
      } else {
        // Nhóm không còn ai -> Có thể xóa nhóm hoặc để trống (ở đây ta cứ xóa mảng participants)
      }
    }

    group.participants = group.participants.filter(mId => mId.toString() !== userId);
    await group.save();
    
    const populatedGroup = await Conversation.findById(groupId)
      .populate("participants pendingMembers", "Username displayName avatarUrl")
      .populate("lastMessage");

    const io = req.app.get("io");
    if (io && populatedGroup.participants.length > 0) {
      populatedGroup.participants.forEach(participantId => {
        io.to(participantId._id.toString()).emit("update_group", populatedGroup);
      });
    }

    res.status(200).json({ success: true, message: "Đã rời nhóm thành công" });
  } catch (error) {
    next(error);
  }
};

// @desc    Ẩn đoạn chat 1-1 (Hide/Delete conversation from view)
// @route   DELETE /api/chat/conversations/:id/hide
// @access  Private
export const hideConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Không tìm thấy cuộc trò chuyện" });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền ẩn cuộc trò chuyện này" });
    }

    // Thêm vào mảng deletedBy nếu chưa có
    if (!conversation.deletedBy.includes(userId)) {
      conversation.deletedBy.push(userId);
      await conversation.save();
    }

    res.status(200).json({ success: true, message: "Đã ẩn đoạn chat thành công" });
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
