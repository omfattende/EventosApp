import { Injectable } from '@angular/core';

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  constructor() {}

  getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La geolocalización no está disponible en este navegador'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let message = 'Error al obtener la ubicación';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permiso de ubicación denegado';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Información de ubicación no disponible';
              break;
            case error.TIMEOUT:
              message = 'Tiempo de espera agotado al obtener ubicación';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  watchPosition(callback: (coords: Coordinates) => void): number {
    if (!navigator.geolocation) {
      throw new Error('La geolocalización no está disponible en este navegador');
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        console.error('Error watching position:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  clearWatch(watchId: number): void {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  isSupported(): boolean {
    return 'geolocation' in navigator;
  }
}
