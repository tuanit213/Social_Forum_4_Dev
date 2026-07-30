import Post from '../models/Post.js';

// Tạo bài viết mới
export const createPost = async (req, res) => {
  try {
    const { title, content, codeSnippet, mediaUrls, tags, status } = req.body;
    
    // req.user được gán từ middleware verifyToken
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ success: false, message: "Nội dung bài viết không được để trống." });
    }

    const newPost = new Post({
      userId,
      title,
      content,
      codeSnippet,
      mediaUrls: mediaUrls || [],
      tags: tags || [],
      status: status || 'public'
    });

    const savedPost = await newPost.save();
    
    res.status(201).json({
      success: true,
      message: "Tạo bài viết thành công",
      post: savedPost
    });
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
  }
};

// Lấy danh sách bài viết (Có phân trang đơn giản)
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Chỉ lấy bài viết public, sắp xếp mới nhất lên đầu
    const posts = await Post.find({ status: 'public' })
      .populate('userId', 'Username displayName avatarUrl') // Lấy thêm thông tin người đăng
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ status: 'public' });

    res.status(200).json({
      success: true,
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
  }
};

// Chỉnh sửa bài viết
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const userId = req.user.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    // Kiểm tra quyền (chỉ tác giả mới được sửa)
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa bài viết này" });
    }

    if (!content) {
      return res.status(400).json({ success: false, message: "Nội dung bài viết không được để trống" });
    }

    post.title = title !== undefined ? title : post.title;
    post.content = content !== undefined ? content : post.content;
    post.tags = tags !== undefined ? tags : post.tags;

    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật bài viết thành công",
      post: updatedPost
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
  }
};

// Xóa bài viết
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    // Kiểm tra quyền (chỉ tác giả mới được xóa)
    if (post.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa bài viết này" });
    }

    await Post.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Xóa bài viết thành công"
    });
  } catch (error) {
    console.error("Lỗi khi xóa bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
  }
};

// Toggle Emoji Reaction
export const reactPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    if (!emoji) {
      return res.status(400).json({ success: false, message: "Emoji không hợp lệ" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết" });
    }

    // 1. Lưu lại emoji cũ mà user đã thả (nếu có)
    const oldReaction = post.reactions.find(r => r.users.includes(userId));
    const oldEmoji = oldReaction ? oldReaction.emoji : null;

    // 2. Xóa user khỏi tất cả các reaction hiện tại (đảm bảo chỉ có 1 emoji duy nhất)
    post.reactions.forEach(r => {
      r.users = r.users.filter(id => id.toString() !== userId.toString());
    });
    // Xóa các reaction trống (không có user nào)
    post.reactions = post.reactions.filter(r => r.users.length > 0);

    // 3. Nếu emoji mới KHÁC emoji cũ -> Thêm vào
    // Nếu GIỐNG emoji cũ -> Tức là hành động Hủy (Toggle off), không thêm vào nữa
    if (emoji !== oldEmoji) {
      const existingReaction = post.reactions.find(r => r.emoji === emoji);
      if (existingReaction) {
        existingReaction.users.push(userId);
      } else {
        post.reactions.push({ emoji, users: [userId] });
      }
    }

    // Dọn dẹp dữ liệu cũ bị lỗi (nếu có) để tránh lỗi Mongoose ValidationError
    post.reactions = post.reactions.filter(r => r && r.emoji && typeof r.emoji === 'string');

    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật cảm xúc thành công",
      reactions: updatedPost.reactions
    });
  } catch (error) {
    console.error("Lỗi khi react bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", error: error.message });
  }
};
