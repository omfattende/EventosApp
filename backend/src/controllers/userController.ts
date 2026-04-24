import { Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest, ApiResponse, SafeUser } from '../types/index';

// GET /me - Obtener perfil del usuario actual
export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<SafeUser>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
      return;
    }

    res.json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el perfil',
    });
  }
}

// PUT /me - Actualizar perfil
export async function updateCurrentUser(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<SafeUser>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autorizado',
      });
      return;
    }

    const { name, bio, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el perfil',
    });
  }
}

// GET /:id - Obtener perfil público de un usuario
export async function getUserById(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<SafeUser>>
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
      res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el perfil',
    });
  }
}
