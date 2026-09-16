import Post from '../models/Post.js';
import Interaction from '../models/Interaction.js';
import redisClient from '../config/redis.js';
import { addJobToFeedQueue } from '../config/queue.js';
import User from '../models/User.js';
import xss from 'xss';

// Tạo bài viết mới
export const createPost = async (req, res) => {
  try {
    const { title, content, codeSnippet, mediaUrls, tags, status } = req.body;
    const userId = req.user.userId;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ success: false, message: "Nội dung bài viết không hợp lệ." });
    }

    const safeTitle = title && typeof title === 'string' ? xss(title.trim()) : "";
    const safeContent = xss(content.trim());
    const safeCodeSnippet = codeSnippet && typeof codeSnippet === 'string' ? xss(codeSnippet) : "";
    const safeTags = Array.isArray(tags) ? tags.filter(t => typeof t === 'string').map(t => xss(t.trim())) : [];
    const safeMediaUrls = Array.isArray(mediaUrls) ? mediaUrls.filter(u => typeof u === 'string').map(u => xss(u.trim())) : [];

    const newPost = new Post({
      userId,
      title: safeTitle,
      content: safeContent,
      codeSnippet: safeCodeSnippet,
      mediaUrls: safeMediaUrls,
      tags: safeTags,
      status: status === 'private' ? 'private' : 'public'
    });

    const savedPost = await newPost.save();
    
    // Đẩy Job để update feed cho những người theo dõi User này
    const author = await User.findById(userId).select('followers').lean();
    if (author?.followers?.length) {
      await Promise.allSettled(author.followers.map((followerId) =>
        addJobToFeedQueue('update-feed-follower', { userId: followerId.toString() })
      ));
    }

    res.status(201).json({
      success: true,
      message: "Tạo bài viết thành công",
      post: savedPost
    });
  } catch (error) {
    console.error("Lỗi khi tạo bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getPosts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;
    const userId = req.user.userId;
    const tab = req.query.tab || 'feed'; // 'feed', 'following', 'explore'

    if (tab === 'following') {
      const currentUser = await User.findById(userId).select('following');
      const followingIds = currentUser ? currentUser.following : [];
      
      const posts = await Post.find({ userId: { $in: followingIds }, status: 'public' })
        .populate('userId', 'Username displayName avatarUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
      const total = await Post.countDocuments({ userId: { $in: followingIds }, status: 'public' });
      
      return res.status(200).json({
        success: true,
        posts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
      });
    }

    if (tab === 'explore') {
      // Sắp xếp theo views và lượt upvotes giả lập bằng cách sort theo views giảm dần
      const posts = await Post.find({ status: 'public' })
        .populate('userId', 'Username displayName avatarUrl')
        .sort({ views: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
      const total = await Post.countDocuments({ status: 'public' });
      
      return res.status(200).json({
        success: true,
        posts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
      });
    }

    // Default 'feed' tab logic
    const redisKey = `feed:user:${userId}`;
    
    // 1. Kiểm tra News Feed trong Redis
    const postIds = await redisClient.zrevrange(redisKey, skip, skip + limit - 1);
    
    if (postIds && postIds.length > 0) {
      // Có dữ liệu phân phối -> Lấy bài viết từ MongoDB theo list ID
      const posts = await Post.find({ _id: { $in: postIds }, status: 'public' })
        .populate('userId', 'Username displayName avatarUrl');
        
      // Sắp xếp lại đúng thứ tự điểm số của Redis
      const orderedPosts = postIds.map(id => posts.find(p => p._id.toString() === id)).filter(Boolean);

      const total = await redisClient.zcard(redisKey);

      return res.status(200).json({
        success: true,
        posts: orderedPosts,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total
      });
    }

    // 2. Fallback: Nếu Redis trống (User mới vào), trả về bài viết mới nhất
    // Đồng thời kích hoạt Worker chạy ngầm để tính toán Feed cho User này
    await addJobToFeedQueue('build-feed-initial', { userId });

    const posts = await Post.find({ status: 'public' })
      .populate('userId', 'Username displayName avatarUrl')
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
    res.status(500).json({ success: false, message: "Lỗi Server" });
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

    if (post.userId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền chỉnh sửa bài viết này" });
    }

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ success: false, message: "Nội dung bài viết không hợp lệ" });
      }
      post.content = xss(content.trim());
    }

    if (title !== undefined && typeof title === 'string') {
      post.title = xss(title.trim());
    }

    if (tags !== undefined && Array.isArray(tags)) {
      post.tags = tags.filter(t => typeof t === 'string').map(t => xss(t.trim()));
    }

    const updatedPost = await post.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật bài viết thành công",
      post: updatedPost
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
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
    res.status(500).json({ success: false, message: "Lỗi Server" });
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

    const oldReaction = post.reactions.find(r => r.users.some((id) => id.toString() === userId.toString()));
    const oldEmoji = oldReaction ? oldReaction.emoji : null;

    post.reactions.forEach(r => {
      r.users = r.users.filter(id => id.toString() !== userId.toString());
    });
    post.reactions = post.reactions.filter(r => r.users.length > 0);

    let isNewInteraction = false;
    if (emoji !== oldEmoji) {
      const existingReaction = post.reactions.find(r => r.emoji === emoji);
      if (existingReaction) {
        existingReaction.users.push(userId);
      } else {
        post.reactions.push({ emoji, users: [userId] });
      }
      isNewInteraction = true;
    }

    post.reactions = post.reactions.filter(r => r && r.emoji && typeof r.emoji === 'string');
    const updatedPost = await post.save();

    // LƯU LẠI NHẬT KÝ TƯƠNG TÁC ĐỂ PHỤC VỤ THUẬT TOÁN
    if (isNewInteraction) {
        await Interaction.create({
            userId: userId,
            postId: post._id,
            postAuthorId: post.userId,
            type: 'reaction'
        });
        
        // Kích hoạt tính lại Feed vì Sở thích của User vừa thay đổi
        await addJobToFeedQueue('update-feed-after-interaction', { userId });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật cảm xúc thành công",
      reactions: updatedPost.reactions
    });
  } catch (error) {
    console.error("Lỗi khi react bài viết:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};
