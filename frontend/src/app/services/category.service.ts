import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

const API_URL = environment.apiUrl;

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${API_URL}/categories`).pipe(
      map(response => response.data),
      catchError(error => {
        const message = error.error?.error || 'Error al obtener las categorías';
        return throwError(() => new Error(message));
      })
    );
  }
}
