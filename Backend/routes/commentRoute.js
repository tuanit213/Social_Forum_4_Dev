import express from 'express';
import { createComment, getCommentsByPostId, updateComment, deleteComment, reactComment } from '../controllers/commentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Lấy danh sách bình luận (Public)
router.get('/post/:postId', getCommentsByPostId);

// Các thao tác cần đăng nhập
router.post('/', verifyToken, createComment);
router.put('/:id', verifyToken, updateComment);
router.delete('/:id', verifyToken, deleteComment);
router.post('/:id/react', verifyToken, reactComment);

export default router;
