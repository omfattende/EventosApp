import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';
import { SocketMessageData } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_change_in_production';

let io: SocketIOServer | null = null;

interface JWTPayload {
  userId: string;
  email: string;
}

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Autenticar socket
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      console.log(`Socket ${socket.id} sin token, desconectando`);
      socket.disconnect();
      return;
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      socket.data.userId = decoded.userId;
    } catch (error) {
      console.log(`Socket ${socket.id} token inválido, desconectando`);
      socket.disconnect();
      return;
    }

    // Unirse a la sala de un evento
    socket.on('join_event', (eventId: string) => {
      socket.join(eventId);
      console.log(`Socket ${socket.id} se unió a la sala ${eventId}`);
    });

    // Salir de la sala de un evento
    socket.on('leave_event', (eventId: string) => {
      socket.leave(eventId);
      console.log(`Socket ${socket.id} salió de la sala ${eventId}`);
    });

    // Enviar mensaje
    socket.on('send_message', async (data: SocketMessageData) => {
      try {
        const { eventId, content } = data;
        const userId = socket.data.userId as string;

        if (!userId) {
          socket.emit('error', { message: 'No autenticado' });
          return;
        }

        // Validar que el usuario es participante del evento o el creador
        const event = await prisma.event.findUnique({
          where: { id: eventId },
          select: { creatorId: true },
        });

        if (!event) {
          socket.emit('error', { message: 'Evento no encontrado' });
          return;
        }

        const isCreator = event.creatorId === userId;

        if (!isCreator) {
          const participant = await prisma.eventParticipant.findFirst({
            where: {
              eventId,
              userId,
            },
          });

          if (!participant) {
            socket.emit('error', { message: 'No eres participante de este evento' });
            return;
          }
        }

        // Guardar mensaje en la base de datos
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            eventId,
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                email: true,
                bio: true,
                createdAt: true,
              },
            },
          },
        });

        // Emitir el mensaje a todos en la sala con el formato que espera el frontend
        const messageToEmit = {
          id: message.id,
          content: message.content,
          userId: message.userId,
          userName: message.user.name,
          userAvatar: message.user.avatar || undefined,
          eventId: message.eventId,
          createdAt: message.createdAt.toISOString(),
        };

        io?.to(eventId).emit('new_message', messageToEmit);
      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar el mensaje' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io no ha sido inicializado');
  }
  return io;
}
