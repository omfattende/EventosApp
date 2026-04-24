import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma';
import { ApiResponse, SafeUser, JWTPayload } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';
const SALT_ROUNDS = 10;

export async function register(
  req: Request,
  res: Response<ApiResponse<{ user: SafeUser; token: string }>>
): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Validaciones
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'Email, contraseña y nombre son requeridos',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'El email ya está registrado',
      });
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
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

    // Generar JWT
    const payload: JWTPayload = { userId: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      data: { user, token },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el usuario',
    });
  }
}

export async function login(
  req: Request,
  res: Response<ApiResponse<{ user: SafeUser; token: string }>>
): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos',
      });
      return;
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
      return;
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
      return;
    }

    // Generar JWT
    const payload: JWTPayload = { userId: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // Respuesta sin password
    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    res.json({
      success: true,
      data: { user: safeUser, token },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión',
    });
  }
}
