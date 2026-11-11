import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticateToken, requireFacultyOrAdmin } from '../middleware/auth';

const router = Router();

router.get('/problems', authenticateToken, requireFacultyOrAdmin, ExportController.exportProblemHistory);

export default router;
