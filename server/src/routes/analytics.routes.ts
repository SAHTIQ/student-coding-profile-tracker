import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticateToken, requireFacultyOrAdmin } from '../middleware/auth';

const router = Router();

router.get('/categories', authenticateToken, requireFacultyOrAdmin, AnalyticsController.getCategories);
router.get('/coding-activity', authenticateToken, requireFacultyOrAdmin, AnalyticsController.getCodingActivity);

export default router;
