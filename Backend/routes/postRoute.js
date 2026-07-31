import express from 'express';
import { createPost, getPosts, updatePost, deletePost, reactPost } from '../controllers/postController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { validateObjectId } from "../middlewares/validateResource.js";

const router = express.Router();

// Endpoint: POST /api/posts - Tạo bài viết mới (Yêu cầu đăng nhập)
router.post('/', verifyToken, createPost);

// Endpoint: GET /api/posts - Lấy danh sách bài viết (Có thể cho phép khách xem hoặc bắt đăng nhập)
// Tạm thời bắt đăng nhập để đồng nhất với layout
router.get('/', verifyToken, getPosts);

// Endpoint: PUT /api/posts/:id - Sửa bài viết (Chỉ tác giả)
router.put('/:id', verifyToken, validateObjectId("id"), updatePost);

// Endpoint: DELETE /api/posts/:id - Xóa bài viết (Chỉ tác giả)
router.delete('/:id', verifyToken, validateObjectId("id"), deletePost);

// Endpoint: POST /api/posts/:id/react - Thả/Hủy thả cảm xúc (Emoji)
router.post('/:id/react', verifyToken, validateObjectId("id"), reactPost);

export default router;
