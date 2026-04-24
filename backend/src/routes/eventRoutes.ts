import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getMyEvents,
  getJoinedEvents,
  getMessages
} from '../controllers/eventController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Rutas públicas
router.get('/', optionalAuth, getEvents);
router.get('/my-events', authenticateToken, getMyEvents);
router.get('/joined', authenticateToken, getJoinedEvents);
router.get('/:id', optionalAuth, getEventById);
router.get('/:id/messages', authenticateToken, getMessages);

// Rutas protegidas
router.post('/', authenticateToken, upload.single('image'), createEvent);
router.put('/:id', authenticateToken, upload.single('image'), updateEvent);
router.delete('/:id', authenticateToken, deleteEvent);
router.post('/:id/join', authenticateToken, joinEvent);
router.delete('/:id/leave', authenticateToken, leaveEvent);

export default router;
