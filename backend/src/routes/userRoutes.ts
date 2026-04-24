import { Router } from 'express';
import { getCurrentUser, updateCurrentUser, getUserById } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/users/me
router.get('/me', authenticateToken, getCurrentUser);

// PUT /api/users/me
router.put('/me', authenticateToken, updateCurrentUser);

// GET /api/users/:id
router.get('/:id', authenticateToken, getUserById);

export default router;
