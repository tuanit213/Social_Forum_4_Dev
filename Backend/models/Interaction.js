import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Tối ưu query tìm tất cả tương tác của một User
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    index: true // Tối ưu query tìm tất cả tương tác trên một bài viết
  },
  postAuthorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Tối ưu query tìm Affinity (U) giữa 2 người
  },
  type: {
    type: String,
    enum: ['view', 'like', 'comment', 'share', 'reaction'],
    required: true
  }
}, {
  timestamps: true // Tự động tạo createdAt, updatedAt (Dùng cho Time Decay)
});

// Index gộp để tối ưu việc tìm kiếm lịch sử tương tác giữa 2 user cụ thể
interactionSchema.index({ userId: 1, postAuthorId: 1 });
interactionSchema.index({ createdAt: -1 });

const Interaction = mongoose.model('Interaction', interactionSchema);
export default Interaction;
