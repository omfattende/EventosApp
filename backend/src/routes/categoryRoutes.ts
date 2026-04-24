import { Router } from 'express';
import { prisma } from '../services/prisma';

const router = Router();

// GET /api/categories - Listar todas las categorías
router.get('/', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las categorías'
    });
  }
});

export default router;
