import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';
import { authenticateToken, requireSuperAdmin, requireFacultyOrAdmin } from '../middleware/auth';

const router = Router();

// Super Admin only routes
router.post('/students', authenticateToken, requireSuperAdmin, AdminController.addStudent);
router.post('/students/bulk', authenticateToken, requireSuperAdmin, AdminController.bulkAddStudents);
router.post('/sync-all', authenticateToken, requireSuperAdmin, AdminController.syncAllStudents);
router.post('/faculty', authenticateToken, requireSuperAdmin, AdminController.addFaculty);
router.patch('/faculty/:id/permissions', authenticateToken, requireSuperAdmin, AdminController.updateFacultyPermissions);
router.get('/faculty', authenticateToken, requireSuperAdmin, AdminController.listFaculties);
router.delete('/students/:id', authenticateToken, requireSuperAdmin, AdminController.deleteStudent);
router.delete('/faculty/:id', authenticateToken, requireSuperAdmin, AdminController.deleteFaculty);

// Shared Admin & Faculty routes (with department scoping)
router.get('/students', authenticateToken, requireFacultyOrAdmin, AdminController.listStudents);
router.post('/students/:id/sync', authenticateToken, requireFacultyOrAdmin, AdminController.syncStudent);

export default router;
