import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { LoginRequest, RegisterRequest, AuthResponse, AuthState } from '../models/auth.model';

import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface BackendAuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    bio: string | null;
    createdAt: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly _state = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  readonly state = computed(() => this._state());
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly currentUser = computed(() => this._state().user);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          this._state.set({
            isAuthenticated: true,
            user,
            token
          });
        } catch {
          this.clearStorage();
        }
      }
    }
  }

  private setAuth(authResponse: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, authResponse.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authResponse.user));
    
    this._state.set({
      isAuthenticated: true,
      user: authResponse.user,
      token: authResponse.token
    });
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private mapBackendAuth(response: BackendAuthResponse): AuthResponse {
    return {
      token: response.token,
      user: {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email
      }
    };
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<BackendAuthResponse>>(`${API_URL}/auth/login`, credentials).pipe(
      map(response => this.mapBackendAuth(response.data)),
      tap(authResponse => this.setAuth(authResponse)),
      catchError(error => {
        const message = error.error?.error || 'Error al iniciar sesión';
        return throwError(() => new Error(message));
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<BackendAuthResponse>>(`${API_URL}/auth/register`, data).pipe(
      map(response => this.mapBackendAuth(response.data)),
      tap(authResponse => this.setAuth(authResponse)),
      catchError(error => {
        const message = error.error?.error || 'Error al registrarse';
        return throwError(() => new Error(message));
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this._state.set({
      isAuthenticated: false,
      user: null,
      token: null
    });
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this._state().token;
  }

  getUserId(): string | null {
    return this._state().user?.id || null;
  }
}
