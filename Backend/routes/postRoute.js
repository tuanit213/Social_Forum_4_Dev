import express from 'express';
import { createPost, getPosts } from '../controllers/postController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Endpoint: POST /api/posts - Tạo bài viết mới (Yêu cầu đăng nhập)
router.post('/', verifyToken, createPost);

// Endpoint: GET /api/posts - Lấy danh sách bài viết (Có thể cho phép khách xem hoặc bắt đăng nhập)
// Tạm thời bắt đăng nhập để đồng nhất với layout
router.get('/', verifyToken, getPosts);

export default router;
