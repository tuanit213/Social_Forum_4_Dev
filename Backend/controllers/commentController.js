import Comment from '../models/Comment.js';

// Tạo bình luận mới
export const createComment = async (req, res) => {
  try {
    const { postId, content, parentCommentId } = req.body;
    const userId = req.user.userId;

    if (!postId || !content) {
      return res.status(400).json({ success: false, message: "postId và content là bắt buộc" });
    }

    const newComment = new Comment({
      content,
      userId,
      postId,
      parentCommentId: parentCommentId || null
    });

    const savedComment = await newComment.save();
    
    // Tăng commentsCount của Post
    await import('../models/Post.js').then(module => {
      module.default.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }).exec();
    });

    // Populate thông tin user để trả về ngay
    await savedComment.populate('userId', 'Username displayName avatarUrl');

    res.status(201).json({
      success: true,
      message: "Đã thêm bình luận",
      comment: savedComment
    });
  } catch (error) {
    console.error("Lỗi khi tạo bình luận:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
  }
};

// Lấy danh sách bình luận của 1 bài viết
export const getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;
    
    // Chỉ lấy comment đang active
    const comments = await Comment.find({ postId, status: 'active' })
      .populate('userId', 'Username displayName avatarUrl')
      .sort({ createdAt: -1 }); // Sắp xếp mới nhất lên trước

    res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    console.error("Lỗi khi lấy bình luận:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
  }
};

// Sửa bình luận
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Không có quyền sửa bình luận này" });
    }

    comment.content = content || comment.content;
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật thành công",
      comment
    });
  } catch (error) {
    console.error("Lỗi sửa bình luận:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// Xoá bình luận (Soft delete hoặc Hard delete)
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Không có quyền xoá bình luận này" });
    }

    // Hard delete
    await Comment.findByIdAndDelete(id);

    // Giảm commentsCount của Post
    await import('../models/Post.js').then(module => {
      module.default.findByIdAndUpdate(comment.postId, { $inc: { commentsCount: -1 } }).exec();
    });

    res.status(200).json({
      success: true,
      message: "Đã xoá bình luận"
    });
  } catch (error) {
    console.error("Lỗi xoá bình luận:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

// Toggle Emoji Reaction cho Bình luận
export const reactComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    if (!emoji) {
      return res.status(400).json({ success: false, message: "Emoji không hợp lệ" });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bình luận" });
    }

    // 1. Lưu lại emoji cũ mà user đã thả (nếu có)
    const oldReaction = comment.reactions.find(r => r.users.includes(userId));
    const oldEmoji = oldReaction ? oldReaction.emoji : null;

    // 2. Xóa user khỏi tất cả các reaction hiện tại (đảm bảo chỉ có 1 emoji duy nhất)
    comment.reactions.forEach(r => {
      r.users = r.users.filter(uid => uid.toString() !== userId.toString());
    });
    // Xóa các reaction trống
    comment.reactions = comment.reactions.filter(r => r.users.length > 0);

    // 3. Nếu emoji mới KHÁC emoji cũ -> Thêm vào
    // Nếu GIỐNG emoji cũ -> Hủy (Toggle off)
    if (emoji !== oldEmoji) {
      const existingReaction = comment.reactions.find(r => r.emoji === emoji);
      if (existingReaction) {
        existingReaction.users.push(userId);
      } else {
        comment.reactions.push({ emoji, users: [userId] });
      }
    }

    // Dọn dẹp dữ liệu cũ bị lỗi
    comment.reactions = comment.reactions.filter(r => r && r.emoji && typeof r.emoji === 'string');

    const updatedComment = await comment.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật cảm xúc thành công",
      reactions: updatedComment.reactions
    });
  } catch (error) {
    console.error("Lỗi khi react bình luận:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
  }
};
