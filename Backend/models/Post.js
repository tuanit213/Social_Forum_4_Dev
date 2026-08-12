import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  // 1. Thông tin người đăng
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },

  // 2. Nội dung cơ bản
  title: { 
    type: String, 
    trim: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  
  // 3. Nội dung nâng cao
  codeSnippet: { 
    type: String 
  },
  mediaUrls: [{ 
    type: String 
  }],
  tags: [{ 
    type: String 
  }],

  // 4. Phân loại & Trạng thái
  status: { 
    type: String, 
    enum: ['public', 'private', 'draft', 'archived'], 
    default: 'public' 
  },

  // 5. Tương tác
  upvotes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  downvotes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // Bày tỏ cảm xúc khác (reactions linh hoạt với Emoji)
  reactions: [{
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],

  views: { 
    type: Number, 
    default: 0 
  },

  // 6. Bình luận
  commentsCount: { 
    type: Number, 
    default: 0 
  }
}, {
  // Tự động sinh createdAt và updatedAt
  timestamps: true 
});

// Thêm Text Index phục vụ cho Search toàn cục
postSchema.index({ title: 'text', content: 'text', tags: 'text' }, {
  weights: {
    title: 10,
    tags: 5,
    content: 1
  },
  name: "PostTextIndex"
});

const Post = mongoose.model('Post', postSchema);
export default Post;
