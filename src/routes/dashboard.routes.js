import express from 'express';
const router = express.Router();
import { getDashboardData } from '../controllers/dashboardController.js';
import { verifyToken } from '../middleware/auth.middleware.js';

/**
 * @route   GET /api/dashboard/data
 * @desc    대시보드에 필요한 데이터(사용량, 최근 포스트) 가져오기
 * @access  Private
 */
router.get('/data', verifyToken, getDashboardData);

export default router;
