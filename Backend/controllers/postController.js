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
