import { Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Interaction from '../models/Interaction.js';
import { calculateEdgeRank } from '../services/edgeRankService.js';
import { 
  buildUserProfileTags, 
  calculateContentScore, 
  buildUserItemMatrix, 
  findSimilarUsers, 
  calculateCollaborativeScore 
} from '../services/recommendationService.js';

// Worker chạy ngầm để tính toán News Feed
const feedWorker = new Worker('feedQueue', async (job) => {
  const { userId } = job.data;
  console.log(`[Worker] Đang tính toán News Feed cho User: ${userId}`);

  try {
    // 1. Lấy thông tin Target User
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) return;
    
    // Lấy danh sách ID những người đang follow
    const followingIds = (targetUser.following || []).map(id => id.toString());

    // 2. Lấy dữ liệu 7 ngày gần nhất để tối ưu RAM thay vì lấy toàn bộ DB
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const recentInteractions = await Interaction.find({ createdAt: { $gte: sevenDaysAgo } }).lean();
    
    // Lấy 500 bài viết mới nhất để chấm điểm
    const recentPosts = await Post.find().sort({ createdAt: -1 }).limit(500).lean();

    // 3. Chuẩn bị dữ liệu cho Thuật toán Gợi ý
    const userTags = buildUserProfileTags(userId, recentInteractions, recentPosts);
    const matrix = buildUserItemMatrix(recentInteractions);
    const similarUsers = findSimilarUsers(userId, matrix, 10); // Lấy top 10 người giống nhất

    const scoredPosts = [];

    // 4. Chạy vòng lặp chấm điểm
    for (const post of recentPosts) {
      if (post.userId.toString() === userId.toString()) continue; // Bỏ qua bài của chính mình

      // a. EdgeRank Score
      const edgeRankResult = calculateEdgeRank(userId, followingIds, post, recentInteractions);
      
      // b. Content-Based Score (Nhân 10 để cân bằng tỉ trọng)
      const cScore = calculateContentScore(userTags, post.tags) * 10;
      
      // c. Collaborative Filtering Score
      const cfScore = calculateCollaborativeScore(post, similarUsers, matrix);
      
      // d. Hybrid Score
      const finalScore = (edgeRankResult.eScore * 0.4) + (cScore * 0.3) + (cfScore * 0.3);
      
      scoredPosts.push({
        postId: post._id.toString(),
        score: finalScore
      });
    }

    // 5. Cập nhật vào Redis Sorted Set (ZSET)
    const redisKey = `feed:user:${userId}`;
    
    // Xóa Feed cũ
    await redisClient.del(redisKey);
    
    if (scoredPosts.length > 0) {
      // Đẩy vào ZSET: ZADD key score member score member...
      const zaddArgs = [];
      scoredPosts.forEach(p => {
        zaddArgs.push(p.score, p.postId);
      });
      
      await redisClient.zadd(redisKey, ...zaddArgs);
      
      // Giới hạn Feed mỗi người chỉ giữ 200 bài để tiết kiệm RAM Redis
      await redisClient.zremrangebyrank(redisKey, 0, -201); 
    }

    console.log(`[Worker] ✅ Hoàn tất tạo Feed cho User ${userId}. Tổng: ${scoredPosts.length} bài.`);

  } catch (error) {
    console.error(`[Worker] ❌ Lỗi tính toán Feed cho User ${userId}:`, error);
    throw error;
  }
}, { 
  connection: redisClient 
});

feedWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} thất bại:`, err.message);
});

export default feedWorker;
