import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest, AuthMiddleware, SafeUser, JWTPayload } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

export const authenticateToken: AuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ success: false, error: 'Token de autenticación requerido' });
      return;
    }

    console.log('[AUTH] Token received:', token.substring(0, 20) + '...');
    console.log('[AUTH] JWT_SECRET length:', JWT_SECRET.length, 'first char:', JWT_SECRET[0]);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Usuario no encontrado' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ success: false, error: 'Token inválido' });
      return;
    }
    res.status(500).json({ success: false, error: 'Error de autenticación' });
  }
};

export const optionalAuth: AuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    // Si hay error, continuar sin usuario
    next();
  }
};
