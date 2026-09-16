import express from 'express';
import { createComment, getCommentsByPostId, updateComment, deleteComment, reactComment } from '../controllers/commentController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { validateObjectId } from "../middlewares/validateResource.js";
import { commentCreateSchema, commentUpdateSchema, reactionSchema, validateApiBody } from "../middlewares/validateApiRequest.js";

const router = express.Router();

// Endpoint: GET /api/comments/post/:postId - Lấy comment của 1 bài (Không yêu cầu đăng nhập nếu muốn public, hiện tại cứ để verifyToken)
router.get('/post/:postId', verifyToken, validateObjectId("postId"), getCommentsByPostId);

// Các thao tác cần đăng nhập
router.post('/', verifyToken, validateApiBody(commentCreateSchema), createComment);

// Endpoint: PUT /api/comments/:id - Sửa bình luận
router.put('/:id', verifyToken, validateObjectId("id"), validateApiBody(commentUpdateSchema), updateComment);

// Endpoint: DELETE /api/comments/:id - Xoá bình luận
router.delete('/:id', verifyToken, validateObjectId("id"), deleteComment);

// Endpoint: POST /api/comments/:id/react - Thả/Hủy thả cảm xúc (Emoji)
router.post('/:id/react', verifyToken, validateObjectId("id"), validateApiBody(reactionSchema), reactComment);

export default router;
