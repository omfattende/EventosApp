# Eventos App - Angular + PostgreSQL

Aplicación full-stack para crear y unirse a eventos sociales en tiempo real, con chat grupal, geolocalización y categorías.

## Características

- 🔐 Autenticación JWT (registro/login)
- 🎉 Crear y gestionar eventos (título, descripción, imagen, fecha, ubicación)
- 📍 Eventos presenciales (con geolocalización) o en línea
- 🔍 Filtro de eventos por categoría y cercanía geográfica
- 👥 Unirse/salir de eventos con límite de participantes
- 💬 Chat grupal en tiempo real (Socket.io)
- 👤 Perfiles de usuario

## Stack Tecnológico

- **Frontend:** Angular 20, Angular Material, RxJS
- **Backend:** Node.js 22, Express 4, TypeScript, Socket.io
- **Base de datos:** PostgreSQL 16 + PostGIS
- **ORM:** Prisma 6

## Requisitos Previos

- Node.js 18+
- Docker Desktop
- Angular CLI (`npm install -g @angular/cli`)

## Instrucciones de Instalación

### 1. Clonar y entrar al directorio

```bash
cd EventosFE
```

### 2. Iniciar PostgreSQL con Docker

```bash
docker compose up -d
```

Esto iniciará PostgreSQL con PostGIS en el puerto 5433.

### 3. Configurar Backend

```bash
cd backend
npm install

# Configurar base de datos (ya debería estar hecho)
npx prisma db push
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

El backend estará disponible en `http://localhost:3000`.

### 4. Configurar Frontend (en otra terminal)

```bash
cd frontend
npm install
ng serve
```

El frontend estará disponible en `http://localhost:4200`.

## Estructura de la API

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Usuarios
- `GET /api/users/me` - Obtener perfil actual
- `PUT /api/users/me` - Actualizar perfil
- `GET /api/users/:id` - Perfil público de usuario

### Eventos
- `GET /api/events` - Listar eventos (con filtros opcionales: category, isOnline, lat, lng, radiusKm)
- `GET /api/events/:id` - Detalle de evento
- `POST /api/events` - Crear evento (requiere auth, soporta multipart/form-data para imagen)
- `PUT /api/events/:id` - Actualizar evento (requiere ser creador)
- `DELETE /api/events/:id` - Eliminar evento (requiere ser creador)
- `POST /api/events/:id/join` - Unirse a evento
- `DELETE /api/events/:id/leave` - Salir de evento
- `GET /api/events/my-events` - Eventos creados por el usuario
- `GET /api/events/joined` - Eventos a los que el usuario se unió
- `GET /api/events/:id/messages` - Historial de chat

### WebSocket (Socket.io)
- `join-room` - Unirse a la sala de un evento
- `leave-room` - Salir de la sala
- `send-message` - Enviar mensaje al chat
- `new-message` - Evento recibido cuando hay nuevo mensaje

## Categorías Disponibles

- Videojuegos
- Deporte
- Estudios
- Fiestas
- Música
- Arte
- Tecnología
- Comida

## Notas

- Las imágenes de eventos se guardan en `backend/uploads/`
- El puerto de PostgreSQL es 5433 (para evitar conflictos con PostgreSQL nativo)
- El chat usa Socket.io para comunicación en tiempo real
- La geolocalización usa PostGIS para búsquedas eficientes por proximidad

## Desarrollo

Para detener los servicios:
```bash
# Backend (Ctrl+C en la terminal)

# Frontend (Ctrl+C en la terminal)

# PostgreSQL
docker compose down
```
