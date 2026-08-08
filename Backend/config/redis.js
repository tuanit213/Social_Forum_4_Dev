import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Sử dụng cổng mặc định 6379 mà người dùng vừa cài đặt
const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null // Bắt buộc phải có khi dùng BullMQ
});

redisClient.on('connect', () => {
  console.log('✅ Kết nối Redis Server thành công');
});

redisClient.on('error', (err) => {
  console.error('❌ Lỗi kết nối Redis:', err);
});

export default redisClient;
