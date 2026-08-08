import { Queue } from 'bullmq';
import redisClient from './redis.js';

// Khởi tạo hàng đợi xử lý thuật toán phân phối News Feed
export const feedQueue = new Queue('feedQueue', { 
  connection: redisClient 
});

// Hàm hỗ trợ thêm Job vào hàng đợi
export const addJobToFeedQueue = async (jobName, data) => {
  return await feedQueue.add(jobName, data, {
    removeOnComplete: true, // Xóa khỏi queue sau khi xử lý thành công để tiết kiệm RAM
    removeOnFail: false,    // Giữ lại nếu lỗi để debug
    attempts: 3,            // Thử lại 3 lần nếu có lỗi xảy ra
    backoff: {
      type: 'exponential',
      delay: 1000           // Lần 1 đợi 1s, lần 2 đợi 2s, lần 3 đợi 4s...
    }
  });
};
