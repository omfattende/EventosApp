import { Request, Response, NextFunction } from 'express';
import { User, Event, Category, Message, EventLocation, EventParticipant } from '@prisma/client';

// Re-exportar tipos de Prisma
export type { User, Event, Category, Message, EventLocation, EventParticipant };

// Tipo para Event con relaciones
export interface EventWithRelations extends Event {
  category: Category;
  creator: User;
  participants?: (EventParticipant & { user: User })[];
  location?: EventLocation | null;
  _count?: {
    participants: number;
  };
}

// Tipo para Message con usuario
export interface MessageWithUser extends Message {
  user: User;
}

// Usuario sin password (para respuestas seguras)
export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  createdAt: Date;
}

// Payload del JWT
export interface JWTPayload {
  userId: string;
  email: string;
}

// Request con usuario autenticado
export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
}

// Tipo para middleware
export type AuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Tipo para filtros de eventos
export interface EventFilters {
  category?: string;
  isOnline?: boolean;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

// Tipo para crear evento
export interface CreateEventData {
  title: string;
  description: string;
  categoryId: string;
  maxParticipants: number;
  isOnline: boolean;
  locationUrl?: string;
  dateTime: string;
  latitude?: number;
  longitude?: number;
}

// Respuesta API estándar
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Tipo para Socket.io
export interface SocketMessageData {
  eventId: string;
  content: string;
}
