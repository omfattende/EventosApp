import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Event, EventFilters, Message, normalizeCategory } from '../models/event.model';

import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface BackendEvent {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  category: { id: string; name: string; icon: string | null };
  dateTime: string;
  isOnline: boolean;
  maxParticipants: number;
  location: { latitude: number; longitude: number } | null;
  locationUrl: string | null;
  creator: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    bio: string | null;
    createdAt: string;
  };
  participants?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      avatar: string | null;
    };
  }>;
  _count?: { participants: number };
  createdAt: string;
}

interface BackendMessage {
  id: string;
  content: string;
  eventId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  createdAt: string;
}

interface CreateEventData {
  title: string;
  description: string;
  image?: File;
  category: string;
  dateTime: string;
  isOnline: boolean;
  maxParticipants: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  meetingLink?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  constructor(private http: HttpClient) {}

  private mapBackendEventToEvent(backendEvent: BackendEvent): Event {
    return {
      id: backendEvent.id,
      title: backendEvent.title,
      description: backendEvent.description,
      image: backendEvent.imageUrl ? `${environment.socketUrl}${backendEvent.imageUrl}` : undefined,
      category: normalizeCategory(backendEvent.category.name),
      dateTime: backendEvent.dateTime,
      isOnline: backendEvent.isOnline,
      maxParticipants: backendEvent.maxParticipants,
      location: backendEvent.location ? {
        latitude: backendEvent.location.latitude,
        longitude: backendEvent.location.longitude
      } : undefined,
      meetingLink: backendEvent.locationUrl || undefined,
      creator: {
        id: backendEvent.creator.id,
        name: backendEvent.creator.name,
        avatar: backendEvent.creator.avatar || undefined
      },
      participants: backendEvent.participants?.map(p => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar || undefined
      })) || [],
      createdAt: backendEvent.createdAt
    };
  }

  getEvents(filters?: EventFilters): Observable<Event[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.category) {
        params = params.set('category', filters.category);
      }
      if (filters.onlineOnly) {
        params = params.set('isOnline', 'true');
      }
      if (filters.nearMe && filters.latitude !== undefined && filters.longitude !== undefined) {
        params = params.set('lat', filters.latitude.toString());
        params = params.set('lng', filters.longitude.toString());
        params = params.set('radiusKm', (filters.radius || 10).toString());
      }
    }

    return this.http.get<ApiResponse<BackendEvent[]>>(`${API_URL}/events`, { params }).pipe(
      map(response => response.data.map(e => this.mapBackendEventToEvent(e))),
      catchError(error => {
        const message = error.error?.error || 'Error al obtener los eventos';
        return throwError(() => new Error(message));
      })
    );
  }

  getEvent(id: string): Observable<Event> {
    return this.http.get<ApiResponse<BackendEvent>>(`${API_URL}/events/${id}`).pipe(
      map(response => this.mapBackendEventToEvent(response.data)),
      catchError(error => {
        const message = error.error?.error || 'Error al obtener el evento';
        return throwError(() => new Error(message));
      })
    );
  }

  createEvent(data: CreateEventData): Observable<Event> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('categoryId', data.category);
    formData.append('dateTime', data.dateTime);
    formData.append('isOnline', data.isOnline.toString());
    formData.append('maxParticipants', data.maxParticipants.toString());
    if (data.image) {
      formData.append('image', data.image);
    }
    if (data.isOnline && data.meetingLink) {
      formData.append('locationUrl', data.meetingLink);
    }
    if (!data.isOnline && data.location) {
      formData.append('latitude', data.location.latitude.toString());
      formData.append('longitude', data.location.longitude.toString());
    }

    return this.http.post<ApiResponse<BackendEvent>>(`${API_URL}/events`, formData).pipe(
      map(response => this.mapBackendEventToEvent(response.data)),
      catchError(error => {
        const message = error.error?.error || 'Error al crear el evento';
        return throwError(() => new Error(message));
      })
    );
  }

  updateEvent(id: string, data: Partial<CreateEventData>): Observable<Event> {
    const formData = new FormData();
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.category) formData.append('categoryId', data.category);
    if (data.dateTime) formData.append('dateTime', data.dateTime);
    if (data.maxParticipants !== undefined) formData.append('maxParticipants', data.maxParticipants.toString());
    if (data.image) formData.append('image', data.image);
    if (data.isOnline !== undefined) formData.append('isOnline', data.isOnline.toString());
    if (data.meetingLink) formData.append('locationUrl', data.meetingLink);
    if (data.location) {
      formData.append('latitude', data.location.latitude.toString());
      formData.append('longitude', data.location.longitude.toString());
    }

    return this.http.put<ApiResponse<BackendEvent>>(`${API_URL}/events/${id}`, formData).pipe(
      map(response => this.mapBackendEventToEvent(response.data)),
      catchError(error => {
        const message = error.error?.error || 'Error al actualizar el evento';
        return throwError(() => new Error(message));
      })
    );
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${API_URL}/events/${id}`).pipe(
      map(() => undefined),
      catchError(error => {
        const message = error.error?.error || 'Error al eliminar el evento';
        return throwError(() => new Error(message));
      })
    );
  }

  joinEvent(id: string): Observable<void> {
    return this.http.post<ApiResponse<{ message: string }>>(`${API_URL}/events/${id}/join`, {}).pipe(
      map(() => undefined),
      catchError(error => {
        const message = error.error?.error || 'Error al unirse al evento';
        return throwError(() => new Error(message));
      })
    );
  }

  leaveEvent(id: string): Observable<void> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${API_URL}/events/${id}/leave`).pipe(
      map(() => undefined),
      catchError(error => {
        const message = error.error?.error || 'Error al salir del evento';
        return throwError(() => new Error(message));
      })
    );
  }

  getMessages(eventId: string): Observable<Message[]> {
    return this.http.get<ApiResponse<BackendMessage[]>>(`${API_URL}/events/${eventId}/messages`).pipe(
      map(response => response.data.map(m => ({
        id: m.id,
        content: m.content,
        userId: m.userId,
        userName: m.user.name,
        userAvatar: m.user.avatar || undefined,
        eventId: m.eventId,
        createdAt: m.createdAt
      }))),
      catchError(error => {
        const message = error.error?.error || 'Error al obtener los mensajes';
        return throwError(() => new Error(message));
      })
    );
  }

  getMyEvents(): Observable<Event[]> {
    return this.http.get<ApiResponse<BackendEvent[]>>(`${API_URL}/events/my-events`).pipe(
      map(response => response.data.map(e => this.mapBackendEventToEvent(e))),
      catchError(error => {
        const message = error.error?.error || 'Error al obtener mis eventos';
        return throwError(() => new Error(message));
      })
    );
  }

  getJoinedEvents(): Observable<Event[]> {
    return this.http.get<ApiResponse<BackendEvent[]>>(`${API_URL}/events/joined`).pipe(
      map(response => response.data.map(e => this.mapBackendEventToEvent(e))),
      catchError(error => {
        const message = error.error?.error || 'Error al obtener los eventos unidos';
        return throwError(() => new Error(message));
      })
    );
  }
}
