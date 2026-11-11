import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/signup/student', AuthController.studentSignup);
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleAuth);
router.get('/me', authenticateToken, AuthController.getMe);

export default router;
