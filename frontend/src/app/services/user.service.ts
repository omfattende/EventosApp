import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { User, UserProfile } from '../models/user.model';

import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface BackendUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) {}

  private mapBackendUser(backendUser: BackendUser): User {
    return {
      id: backendUser.id,
      name: backendUser.name,
      email: backendUser.email,
      avatar: backendUser.avatar || undefined,
      bio: backendUser.bio || undefined
    };
  }

  getProfile(): Observable<User> {
    return this.http.get<ApiResponse<BackendUser>>(`${API_URL}/users/me`).pipe(
      map(response => this.mapBackendUser(response.data)),
      catchError(error => {
        const message = error.error?.error || 'Error al obtener el perfil';
        return throwError(() => new Error(message));
      })
    );
  }

  updateProfile(data: UserProfile): Observable<User> {
    return this.http.put<ApiResponse<BackendUser>>(`${API_URL}/users/me`, data).pipe(
      map(response => this.mapBackendUser(response.data)),
      catchError(error => {
        const message = error.error?.error || 'Error al actualizar el perfil';
        return throwError(() => new Error(message));
      })
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<BackendUser>>(`${API_URL}/users/${id}`).pipe(
      map(response => this.mapBackendUser(response.data)),
      catchError(error => {
        const message = error.error?.error || 'Error al obtener el usuario';
        return throwError(() => new Error(message));
      })
    );
  }
}
