import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import redisClient, { createRedisConnection } from '../config/redis.js';
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

export const processFeedJob = async (job) => {
  const { userId } = job.data;
  console.log(`[Worker] Đang tính toán News Feed cho User: ${userId}`);

  try {
    // 1. Lấy thông tin Target User
    const targetUser = await User.findById(userId).lean();
    if (!targetUser) return;
    
    // Lấy danh sách ID những người đang follow
    const followingIds = (targetUser.following || []).map(id => id.toString());

    // Lấy dữ liệu 7 ngày gần nhất để tối ưu RAM thay vì lấy toàn bộ DB
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Sử dụng mongoose.trusted() để bypass sanitizeFilter toàn cục
    const recentInteractions = await Interaction.find({ 
      createdAt: mongoose.trusted({ $gte: sevenDaysAgo }) 
    }).lean();
    
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
};

let feedWorker = null;
let feedWorkerConnection = null;

export const startFeedWorker = async () => {
  if (feedWorker) return feedWorker;

  feedWorkerConnection = createRedisConnection("social-forum-feed-worker");
  feedWorker = new Worker('feedQueue', processFeedJob, {
    connection: feedWorkerConnection,
    concurrency: Number.parseInt(process.env.FEED_WORKER_CONCURRENCY || "2", 10),
  });

  feedWorker.on('failed', (job, err) => {
    console.error(`Feed job ${job?.id || "unknown"} failed: ${err.message}`);
  });
  feedWorker.on('error', (error) => {
    console.error(`Feed worker error: ${error.message}`);
  });

  await feedWorker.waitUntilReady();
  return feedWorker;
};

export const stopFeedWorker = async () => {
  if (!feedWorker) return;
  await feedWorker.close();
  feedWorker = null;
  if (feedWorkerConnection && !["end", "wait"].includes(feedWorkerConnection.status)) {
    await feedWorkerConnection.quit();
  }
  feedWorkerConnection = null;
};

export const isFeedWorkerReady = () => Boolean(feedWorker && !feedWorker.closing);

export default startFeedWorker;
