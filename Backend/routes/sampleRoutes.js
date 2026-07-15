import express from 'express';
import { getSample, createSample } from '../controllers/sampleController.js';

const router = express.Router();

/**
 * Định nghĩa router cho các endpoint API.
 * Liên kết URL cụ thể với logic xử lý tại Controller.
 */
router.route('/')
  .get(getSample)
  .post(createSample);

export default router;
