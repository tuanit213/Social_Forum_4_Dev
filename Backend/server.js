import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import { verifyToken } from './middlewares/authMiddleware.js';
import authRoutes from './routes/authRoute.js';

import sampleRoutes from './routes/sampleRoutes.js';

// Load cấu hình từ file .env
dotenv.config();

// Khởi tạo kết nối đến MongoDB
connectDB();

const app = express();

// Middleware hỗ trợ parse body có định dạng JSON
app.use(express.json());

// Middleware xử lý Cookie
app.use(cookieParser());

// Middleware hỗ trợ chia sẻ tài nguyên chéo nguồn (CORS)
app.use(cors({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true
}));

// --- Khai báo các Routes ---
app.get('/', (req, res) => {
  res.send('API Server is running...');
});

// Gắn route cho endpoint mẫu
app.use('/api/sample', sampleRoutes);

// public routes
app.use('/api/auth', authRoutes);

// private routes (bắt buộc phải có token mới được truy cập)
app.use('/api/users/profile', verifyToken, (req, res) => {
  res.json({ message: "Đây là thông tin cá nhân bảo mật", user: req.user });
});

// --- Middleware Xử lý Lỗi (Phải đặt ở cuối cùng) ---
// 1. Bắt lỗi 404 cho các route không tồn tại
app.use(notFound);

// 2. Bắt tất cả các lỗi server và trả về client dạng JSON để debug
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});