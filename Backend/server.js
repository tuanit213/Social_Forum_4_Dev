import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import { verifyToken } from './middlewares/authMiddleware.js';
import authRoutes from './routes/authRoute.js';
import postRoutes from './routes/postRoute.js';
import sampleRoutes from './routes/sampleRoutes.js';

// Load cấu hình từ file .env
dotenv.config();

// Khởi tạo kết nối đến MongoDB
connectDB();

const app = express();

// Security Middleware: Bảo vệ HTTP Headers (Cho phép CORS)
app.use(helmet({
  crossOriginResourcePolicy: false, // Fix lỗi CORS khi gọi API từ Frontend
}));

// Tạm thời tắt express-mongo-sanitize do xung đột với Express v5 (req.query getter)
// app.use(mongoSanitize());

// Middleware hỗ trợ parse body có định dạng JSON
app.use(express.json());

// Middleware xử lý Cookie
app.use(cookieParser());

// Global Rate Limiting: Chống DDoS cơ bản (100 req / 15 phút)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút" }
});
app.use('/api', globalLimiter);

// Auth Rate Limiting: Chống Brute-force mật khẩu (10 req / 15 phút)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Đăng nhập/Đăng ký quá nhiều lần, vui lòng thử lại sau" }
});

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
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);

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