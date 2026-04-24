import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest, ApiResponse, EventWithRelations, SafeUser } from '../types/index';
import fs from 'fs';
import path from 'path';

// GET /api/events - Listar eventos con filtros
export async function getEvents(
  req: Request,
  res: Response<ApiResponse<EventWithRelations[]>>
): Promise<void> {
  try {
    const { category, isOnline, lat, lng, radiusKm, search } = req.query;

    const where: any = {};

    if (category) {
      where.category = {
        name: { equals: category as string, mode: 'insensitive' }
      };
    }

    if (isOnline !== undefined) {
      where.isOnline = isOnline === 'true';
    }

    // Filtro por cercanía (si se proporcionan lat, lng y radiusKm)
    if (lat && lng && radiusKm) {
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const radius = parseFloat(radiusKm as string);

      // Usar raw query para PostGIS
      const eventsNearby = await prisma.$queryRaw<EventWithRelations[]>`
        SELECT e.*, 
          ST_Distance(
            ST_MakePoint(${longitude}, ${latitude})::geography,
            ST_MakePoint(el.longitude, el.latitude)::geography
          ) / 1000 as distance
        FROM "Event" e
        LEFT JOIN "EventLocation" el ON e.id = el."eventId"
        WHERE e."isOnline" = false
        AND ST_DWithin(
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ST_MakePoint(el.longitude, el.latitude)::geography,
          ${radius * 1000}
        )
        ORDER BY distance
      `;

      // Obtener relaciones completas para estos eventos
      const eventIds = eventsNearby.map(e => e.id);
      const eventsWithRelations = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        include: {
          category: true,
          creator: {
            select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
          },
          location: true,
          _count: { select: { participants: true } }
        },
        orderBy: { dateTime: 'asc' }
      });

      res.json({ success: true, data: eventsWithRelations as EventWithRelations[] });
      return;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
        },
        location: true,
        _count: { select: { participants: true } }
      },
      orderBy: { dateTime: 'asc' }
    });

    res.json({ success: true, data: events as EventWithRelations[] });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los eventos' });
  }
}

// GET /api/events/:id - Obtener detalle de un evento
export async function getEventById(
  req: Request,
  res: Response<ApiResponse<EventWithRelations>>
): Promise<void> {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
        },
        location: true,
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
            }
          }
        },
        _count: { select: { participants: true } }
      }
    });

    if (!event) {
      res.status(404).json({ success: false, error: 'Evento no encontrado' });
      return;
    }

    res.json({ success: true, data: event as EventWithRelations });
  } catch (error) {
    console.error('Error al obtener evento:', error);
    res.status(500).json({ success: false, error: 'Error al obtener el evento' });
  }
}

// POST /api/events - Crear evento
export async function createEvent(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<EventWithRelations>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autorizado' });
      return;
    }

    const { title, description, categoryId, maxParticipants, isOnline, locationUrl, dateTime, latitude, longitude } = req.body;

    // Validaciones
    if (!title || !description || !categoryId || !maxParticipants || !dateTime) {
      res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
      return;
    }

    // Buscar categoría por nombre (si no es UUID) o por ID
    let resolvedCategoryId = categoryId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(categoryId)) {
      const normalizedInput = categoryId
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      // Buscar todas las categorías y comparar normalizando ambos lados
      const allCategories = await prisma.category.findMany();
      const category = allCategories.find(c =>
        c.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') === normalizedInput
      );
      if (!category) {
        res.status(400).json({ success: false, error: `Categoría no encontrada: ${categoryId}` });
        return;
      }
      resolvedCategoryId = category.id;
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        categoryId: resolvedCategoryId,
        maxParticipants: parseInt(maxParticipants),
        isOnline: isOnline === 'true' || isOnline === true,
        locationUrl: locationUrl || null,
        dateTime: new Date(dateTime),
        imageUrl,
        creatorId: req.user.id,
        ...(latitude && longitude && !isOnline ? {
          location: {
            create: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            }
          }
        } : {})
      },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
        },
        location: true,
        _count: { select: { participants: true } }
      }
    });

    res.status(201).json({ success: true, data: event as EventWithRelations });
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({ success: false, error: 'Error al crear el evento' });
  }
}

// PUT /api/events/:id - Actualizar evento
export async function updateEvent(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<EventWithRelations>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autorizado' });
      return;
    }

    const { id } = req.params;
    const { title, description, maxParticipants, isOnline, locationUrl, dateTime, latitude, longitude, categoryId } = req.body;

    // Verificar que el evento existe y pertenece al usuario
    const existingEvent = await prisma.event.findUnique({
      where: { id },
      include: { location: true }
    });

    if (!existingEvent) {
      res.status(404).json({ success: false, error: 'Evento no encontrado' });
      return;
    }

    if (existingEvent.creatorId !== req.user.id) {
      res.status(403).json({ success: false, error: 'No tienes permiso para editar este evento' });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (maxParticipants !== undefined) updateData.maxParticipants = parseInt(maxParticipants);
    if (isOnline !== undefined) updateData.isOnline = isOnline === 'true' || isOnline === true;
    if (locationUrl !== undefined) updateData.locationUrl = locationUrl;
    if (dateTime !== undefined) updateData.dateTime = new Date(dateTime);
    if (categoryId !== undefined) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(categoryId)) {
        const normalizedInput = categoryId
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const allCategories = await prisma.category.findMany();
        const category = allCategories.find(c =>
          c.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') === normalizedInput
        );
        if (category) {
          updateData.categoryId = category.id;
        }
      } else {
        updateData.categoryId = categoryId;
      }
    }
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;

    // Actualizar o crear ubicación si es evento presencial
    if (!updateData.isOnline && latitude && longitude) {
      updateData.location = {
        upsert: {
          create: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          update: { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
        }
      };
    } else if (updateData.isOnline && existingEvent.location) {
      // Eliminar ubicación si cambia a online
      await prisma.eventLocation.delete({ where: { eventId: id } });
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
        },
        location: true,
        _count: { select: { participants: true } }
      }
    });

    res.json({ success: true, data: event as EventWithRelations });
  } catch (error) {
    console.error('Error al actualizar evento:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el evento' });
  }
}

// DELETE /api/events/:id - Eliminar evento
export async function deleteEvent(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ message: string }>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autorizado' });
      return;
    }

    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      res.status(404).json({ success: false, error: 'Evento no encontrado' });
      return;
    }

    if (event.creatorId !== req.user.id) {
      res.status(403).json({ success: false, error: 'No tienes permiso para eliminar este evento' });
      return;
    }

    // Eliminar imagen si existe
    if (event.imageUrl) {
      const imagePath = path.join(process.cwd(), event.imageUrl.replace('/uploads/', 'uploads/'));
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await prisma.event.delete({ where: { id } });

    res.json({ success: true, data: { message: 'Evento eliminado correctamente' } });
  } catch (error) {
    console.error('Error al eliminar evento:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar el evento' });
  }
}

// POST /api/events/:id/join - Unirse a un evento
export async function joinEvent(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ message: string }>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autorizado' });
      return;
    }

    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } }
    });

    if (!event) {
      res.status(404).json({ success: false, error: 'Evento no encontrado' });
      return;
    }

    // Verificar si ya está lleno
    if (event._count.participants >= event.maxParticipants) {
      res.status(400).json({ success: false, error: 'El evento ha alcanzado el límite de participantes' });
      return;
    }

    // Verificar si ya está unido
    const existingParticipant = await prisma.eventParticipant.findFirst({
      where: { eventId: id, userId: req.user.id }
    });

    if (existingParticipant) {
      res.status(400).json({ success: false, error: 'Ya estás unido a este evento' });
      return;
    }

    await prisma.eventParticipant.create({
      data: { eventId: id, userId: req.user.id }
    });

    res.json({ success: true, data: { message: 'Te has unido al evento correctamente' } });
  } catch (error) {
    console.error('Error al unirse a evento:', error);
    res.status(500).json({ success: false, error: 'Error al unirse al evento' });
  }
}

// DELETE /api/events/:id/leave - Salir de un evento
export async function leaveEvent(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ message: string }>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autorizado' });
      return;
    }

    const { id } = req.params;

    const participant = await prisma.eventParticipant.findFirst({
      where: { eventId: id, userId: req.user.id }
    });

    if (!participant) {
      res.status(400).json({ success: false, error: 'No estás unido a este evento' });
      return;
    }

    await prisma.eventParticipant.delete({ where: { id: participant.id } });

    res.json({ success: true, data: { message: 'Has salido del evento correctamente' } });
  } catch (error) {
    console.error('Error al salir de evento:', error);
    res.status(500).json({ success: false, error: 'Error al salir del evento' });
  }
}

// GET /api/events/my-events - Eventos creados por el usuario
export async function getMyEvents(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<EventWithRelations[]>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autorizado' });
      return;
    }

    const events = await prisma.event.findMany({
      where: { creatorId: req.user.id },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
        },
        location: true,
        _count: { select: { participants: true } }
      },
      orderBy: { dateTime: 'desc' }
    });

    res.json({ success: true, data: events as EventWithRelations[] });
  } catch (error) {
    console.error('Error al obtener mis eventos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener tus eventos' });
  }
}

// GET /api/events/joined - Eventos a los que el usuario se ha unido
export async function getJoinedEvents(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<EventWithRelations[]>>
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autorizado' });
      return;
    }

    const participations = await prisma.eventParticipant.findMany({
      where: { userId: req.user.id },
      select: { eventId: true }
    });

    const eventIds = participations.map(p => p.eventId);

    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      include: {
        category: true,
        creator: {
          select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
        },
        location: true,
        _count: { select: { participants: true } }
      },
      orderBy: { dateTime: 'asc' }
    });

    res.json({ success: true, data: events as EventWithRelations[] });
  } catch (error) {
    console.error('Error al obtener eventos unidos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los eventos' });
  }
}

// GET /api/events/:id/messages - Obtener mensajes del chat
export async function getMessages(
  req: Request,
  res: Response<ApiResponse<any[]>>
): Promise<void> {
  try {
    const { id } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    const messages = await prisma.message.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({ success: true, data: messages.reverse() });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los mensajes' });
  }
}
