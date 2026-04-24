import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';
import { DEFAULT_EVENT_IMAGE, DEFAULT_AVATAR_IMAGE } from '../../shared/images';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule
  ],
  template: `
    <div class="my-events-container">
      <h1 class="page-title">Mis Eventos</h1>

      <mat-tab-group [(selectedIndex)]="selectedTab" animationDuration="300ms">
        <!-- Created Events Tab -->
        <mat-tab label="Creados por mí">
          <div class="tab-content">
            <div *ngIf="isLoadingCreated()" class="loading-container">
              <mat-spinner diameter="48"></mat-spinner>
              <p>Cargando eventos...</p>
            </div>

            <div *ngIf="!isLoadingCreated() && createdEvents().length === 0" class="empty-state">
              <mat-icon class="empty-icon">event_busy</mat-icon>
              <h3>No has creado ningún evento</h3>
              <p>¡Crea tu primer evento y empieza a conectar con personas!</p>
              <button mat-raised-button color="primary" routerLink="/events/create">
                <mat-icon>add</mat-icon>
                Crear Evento
              </button>
            </div>

            <div *ngIf="!isLoadingCreated() && createdEvents().length > 0" class="events-grid">
              <mat-card *ngFor="let event of createdEvents()" class="event-card">
                <div class="event-image-container">
                  <img 
                    [src]="event.image || DEFAULT_EVENT_IMAGE" 
                    [alt]="event.title"
                    class="event-image"
                  >
                  <div class="event-badges">
                    <span class="badge" [class.online]="event.isOnline" [class.offline]="!event.isOnline">
                      {{ event.isOnline ? 'Online' : 'Presencial' }}
                    </span>
                  </div>
                </div>

                <mat-card-content>
                  <h3 class="event-title">{{ event.title }}</h3>
                  <p class="event-date">{{ formatDate(event.dateTime) }}</p>
                  <div class="event-stats">
                    <mat-icon>people</mat-icon>
                    <span>{{ event.participants.length }} / {{ event.maxParticipants }} participantes</span>
                  </div>
                </mat-card-content>

                <mat-card-actions>
                  <button 
                    mat-button 
                    color="primary"
                    [routerLink]="['/events', event.id]"
                  >
                    <mat-icon>visibility</mat-icon>
                    Ver
                  </button>
                  <button 
                    mat-button
                    [routerLink]="['/events', event.id, 'edit']"
                  >
                    <mat-icon>edit</mat-icon>
                    Editar
                  </button>
                  <button 
                    mat-button 
                    color="warn"
                    (click)="deleteEvent(event.id)"
                  >
                    <mat-icon>delete</mat-icon>
                    Eliminar
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>

        <!-- Joined Events Tab -->
        <mat-tab label="A los que me uní">
          <div class="tab-content">
            <div *ngIf="isLoadingJoined()" class="loading-container">
              <mat-spinner diameter="48"></mat-spinner>
              <p>Cargando eventos...</p>
            </div>

            <div *ngIf="!isLoadingJoined() && joinedEvents().length === 0" class="empty-state">
              <mat-icon class="empty-icon">event_busy</mat-icon>
              <h3>No te has unido a ningún evento</h3>
              <p>¡Explora los eventos disponibles y únete a los que te interesen!</p>
              <button mat-raised-button color="primary" routerLink="/">
                <mat-icon>explore</mat-icon>
                Explorar Eventos
              </button>
            </div>

            <div *ngIf="!isLoadingJoined() && joinedEvents().length > 0" class="events-grid">
              <mat-card *ngFor="let event of joinedEvents()" class="event-card">
                <div class="event-image-container">
                  <img 
                    [src]="event.image || DEFAULT_EVENT_IMAGE" 
                    [alt]="event.title"
                    class="event-image"
                  >
                  <div class="event-badges">
                    <span class="badge" [class.online]="event.isOnline" [class.offline]="!event.isOnline">
                      {{ event.isOnline ? 'Online' : 'Presencial' }}
                    </span>
                  </div>
                </div>

                <mat-card-content>
                  <h3 class="event-title">{{ event.title }}</h3>
                  <div class="event-creator">
                    <mat-icon>person</mat-icon>
                    <span>{{ event.creator.name }}</span>
                  </div>
                  <p class="event-date">{{ formatDate(event.dateTime) }}</p>
                  <div class="event-stats">
                    <mat-icon>people</mat-icon>
                    <span>{{ event.participants.length }} / {{ event.maxParticipants }} participantes</span>
                  </div>
                </mat-card-content>

                <mat-card-actions>
                  <button 
                    mat-button 
                    color="primary"
                    [routerLink]="['/events', event.id]"
                  >
                    <mat-icon>visibility</mat-icon>
                    Ver Detalles
                  </button>
                  <button 
                    mat-button 
                    color="warn"
                    (click)="leaveEvent(event.id)"
                  >
                    <mat-icon>exit_to_app</mat-icon>
                    Salir
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background-color: var(--bg-primary);
      min-height: 100vh;
    }

    .my-events-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
      background-color: var(--bg-primary);
    }

    .page-title {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 24px;
      color: var(--text-primary);
    }

    ::ng-deep .mat-mdc-tab-group {
      background-color: var(--bg-primary);
    }

    ::ng-deep .mat-mdc-tab-header {
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    ::ng-deep .mat-mdc-tab .mdc-tab__text-label {
      color: var(--text-secondary) !important;
    }

    ::ng-deep .mat-mdc-tab.mdc-tab--active .mdc-tab__text-label {
      color: var(--primary-color) !important;
    }

    ::ng-deep .mat-mdc-tab-body-wrapper {
      background-color: var(--bg-primary);
    }

    .tab-content {
      padding: 24px 0;
      background-color: var(--bg-primary);
    }

    .loading-container,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      gap: 16px;
      background-color: var(--bg-primary);
    }

    .empty-state {
      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: var(--text-muted);
      }

      h3 {
        font-size: 1.5rem;
        color: var(--text-primary);
      }

      p {
        color: var(--text-secondary);
        max-width: 400px;
      }
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    .event-card {
      background-color: var(--bg-card) !important;
      border: 1px solid var(--border-color);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
      }
    }

    .event-image-container {
      position: relative;
      height: 180px;
      overflow: hidden;

      .event-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .event-badges {
        position: absolute;
        top: 12px;
        left: 12px;
        display: flex;
        gap: 8px;

        .badge {
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;

          &.online {
            background-color: var(--success-color);
            color: white;
          }

          &.offline {
            background-color: var(--warning-color);
            color: white;
          }
        }
      }
    }

    ::ng-deep .mat-mdc-card-content {
      background-color: var(--bg-card) !important;
      color: var(--text-primary) !important;
      padding: 16px !important;

      .event-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--text-primary) !important;
      }

      .event-creator {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--text-secondary) !important;
        font-size: 0.875rem;
        margin-bottom: 8px;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: var(--text-tertiary) !important;
        }
      }

      .event-date {
        color: var(--text-secondary) !important;
        font-size: 0.875rem;
        margin-bottom: 12px;
      }

      .event-stats {
        display: flex;
        align-items: center;
        gap: 4px;
        color: var(--text-secondary) !important;
        font-size: 0.875rem;

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: var(--text-tertiary) !important;
        }
      }
    }

    ::ng-deep .mat-mdc-card-actions {
      background-color: var(--bg-card) !important;
      border-top: 1px solid var(--divider-color);
      padding: 8px 16px 16px !important;
    }

    @media (max-width: 768px) {
      .events-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MyEventsComponent implements OnInit {
  readonly DEFAULT_EVENT_IMAGE = DEFAULT_EVENT_IMAGE;
  readonly DEFAULT_AVATAR_IMAGE = DEFAULT_AVATAR_IMAGE;
  
  createdEvents = signal<Event[]>([]);
  joinedEvents = signal<Event[]>([]);
  isLoadingCreated = signal(true);
  isLoadingJoined = signal(true);
  selectedTab = 0;

  constructor(
    private eventService: EventService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCreatedEvents();
    this.loadJoinedEvents();
  }

  private loadCreatedEvents(): void {
    this.isLoadingCreated.set(true);
    this.eventService.getMyEvents().subscribe({
      next: (events) => {
        this.createdEvents.set(events);
        this.isLoadingCreated.set(false);
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
        this.isLoadingCreated.set(false);
      }
    });
  }

  private loadJoinedEvents(): void {
    this.isLoadingJoined.set(true);
    this.eventService.getJoinedEvents().subscribe({
      next: (events) => {
        this.joinedEvents.set(events);
        this.isLoadingJoined.set(false);
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
        this.isLoadingJoined.set(false);
      }
    });
  }

  deleteEvent(eventId: string): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.createdEvents.update(events => events.filter(e => e.id !== eventId));
        this.snackBar.open('Evento eliminado', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
      }
    });
  }

  leaveEvent(eventId: string): void {
    if (!confirm('¿Estás seguro de que deseas salir de este evento?')) return;

    this.eventService.leaveEvent(eventId).subscribe({
      next: () => {
        this.joinedEvents.update(events => events.filter(e => e.id !== eventId));
        this.snackBar.open('Has salido del evento', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
