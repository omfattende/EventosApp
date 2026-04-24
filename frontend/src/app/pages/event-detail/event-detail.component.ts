import { Component, signal, computed, OnInit, OnDestroy, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventService } from '../../services/event.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Event, Message, CATEGORY_LABELS } from '../../models/event.model';
import { DEFAULT_EVENT_IMAGE, DEFAULT_AVATAR_IMAGE } from '../../shared/images';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatInputModule,
    MatListModule,
    MatTooltipModule
  ],
  template: `
    <div class="event-detail-container">
      <div *ngIf="isLoading()" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
      </div>

      <div *ngIf="errorMessage()" class="error-container">
        <mat-icon color="warn">error</mat-icon>
        <p>{{ errorMessage() }}</p>
        <button mat-raised-button color="primary" routerLink="/">
          Volver al inicio
        </button>
      </div>

      <div *ngIf="!isLoading() && !errorMessage() && event()" class="event-content">
        <!-- Event Header -->
        <div class="event-header">
          <div class="event-image-container">
            <img 
              [src]="event()?.image || DEFAULT_EVENT_IMAGE" 
              [alt]="event()?.title"
              class="event-image"
            >
            <div class="event-badges">
              <span class="badge" [class.online]="event()?.isOnline" [class.offline]="!event()?.isOnline">
                {{ event()?.isOnline ? 'Online' : 'Presencial' }}
              </span>
              <span class="badge category">{{ categoryLabel(event()?.category) }}</span>
            </div>
          </div>

          <div class="event-info">
            <h1 class="event-title">{{ event()?.title }}</h1>
            
            <div class="event-meta">
              <div class="meta-item">
                <mat-icon>event</mat-icon>
                <span>{{ formatDate(event()?.dateTime!) }}</span>
              </div>
              <div class="meta-item" *ngIf="event()?.location">
                <mat-icon>location_on</mat-icon>
                <span>{{ event()?.location?.address || 'Ver en mapa' }}</span>
              </div>
              <div class="meta-item" *ngIf="event()?.meetingLink">
                <mat-icon>link</mat-icon>
                <a [href]="event()?.meetingLink" target="_blank" mat-button color="primary">
                  Unirse a la reunión
                </a>
              </div>
            </div>

            <div class="event-stats">
              <div class="stat">
                <mat-icon>people</mat-icon>
                <span>{{ event()?.participants?.length }} / {{ event()?.maxParticipants }} participantes</span>
              </div>
            </div>

            <div class="event-actions">
              <button 
                *ngIf="canJoin()"
                mat-raised-button 
                color="primary"
                (click)="joinEvent()"
                [disabled]="isActionLoading()"
              >
                <mat-icon>person_add</mat-icon>
                Unirse al evento
              </button>

              <button 
                *ngIf="canLeave()"
                mat-raised-button 
                color="warn"
                (click)="leaveEvent()"
                [disabled]="isActionLoading()"
              >
                <mat-icon>exit_to_app</mat-icon>
                Salir del evento
              </button>

              <button 
                *ngIf="isCreator()"
                mat-raised-button 
                color="primary"
                [routerLink]="['/events', event()?.id, 'edit']"
              >
                <mat-icon>edit</mat-icon>
                Editar
              </button>

              <button 
                *ngIf="isCreator()"
                mat-raised-button 
                color="warn"
                (click)="deleteEvent()"
                [disabled]="isActionLoading()"
              >
                <mat-icon>delete</mat-icon>
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Event Description -->
        <div class="event-description-section">
          <h2>Descripción</h2>
          <p class="description-text">{{ event()?.description }}</p>
        </div>

        <!-- Participants -->
        <div class="participants-section">
          <h2>Participantes</h2>
          <div class="participants-list">
            <div class="participant creator">
              <img 
                [src]="event()?.creator?.avatar || DEFAULT_AVATAR_IMAGE" 
                [alt]="event()?.creator?.name"
                class="participant-avatar"
                [matTooltip]="'Creador: ' + event()?.creator?.name"
              >
              <span class="creator-badge">
                <mat-icon>star</mat-icon>
              </span>
            </div>
            <div 
              *ngFor="let participant of event()?.participants" 
              class="participant"
            >
              <img 
                [src]="participant.avatar || DEFAULT_AVATAR_IMAGE" 
                [alt]="participant.name"
                class="participant-avatar"
                [matTooltip]="participant.name"
              >
            </div>
          </div>
        </div>

        <!-- Chat Section -->
        <div class="chat-section">
          <mat-divider></mat-divider>
          <h2>Chat del evento</h2>
          
          <div *ngIf="!isParticipantOrCreator()" class="chat-not-allowed">
            <mat-icon>lock</mat-icon>
            <p>Debes ser participante o creador del evento para ver y enviar mensajes.</p>
            <button *ngIf="canJoin()" mat-raised-button color="primary" (click)="joinEvent()">
              <mat-icon>person_add</mat-icon>
              Unirse al evento para chatear
            </button>
          </div>
          
          <div class="chat-container" *ngIf="isParticipantOrCreator()">
            <div class="messages-list" #messagesContainer>
              <div class="no-messages" *ngIf="messages().length === 0">
                <mat-icon>chat_bubble_outline</mat-icon>
                <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
              </div>
              <div 
                *ngFor="let message of messages()" 
                class="message"
                [class.own]="message.userId === currentUserId()"
              >
                <img 
                  [src]="message.userAvatar || DEFAULT_AVATAR_IMAGE" 
                  [alt]="message.userName"
                  class="message-avatar"
                >
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-author">{{ message.userName }}</span>
                    <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                  </div>
                  <p class="message-text">{{ message.content }}</p>
                </div>
              </div>
            </div>

            <div class="chat-input">
              <mat-form-field appearance="outline" class="message-field">
                <input 
                  matInput 
                  [(ngModel)]="newMessage" 
                  placeholder="Escribe un mensaje..."
                  (keyup.enter)="sendMessage()"
                  maxlength="500"
                  autocomplete="off"
                >
              </mat-form-field>
              <button 
                mat-fab 
                color="primary" 
                (click)="sendMessage()"
                [disabled]="!newMessage.trim()"
              >
                <mat-icon>send</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .event-detail-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 24px;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      gap: 16px;
    }

    .error-container mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .event-content {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .event-header {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .event-image-container {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      height: 300px;

      .event-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .event-badges {
        position: absolute;
        top: 16px;
        left: 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .badge {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 0.875rem;
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

          &.category {
            background-color: var(--bg-secondary);
            color: var(--text-primary);
          }
        }
      }
    }

    .event-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .event-title {
      font-size: 2rem;
      font-weight: 500;
      margin: 0;
      color: var(--text-primary);
    }

    .event-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);

        mat-icon {
          color: var(--text-tertiary);
        }
      }
    }

    .event-stats {
      padding: 16px;
      background-color: var(--bg-tertiary);
      border-radius: 8px;

      .stat {
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          color: var(--text-tertiary);
        }
      }
    }

    .event-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: auto;

      button {
        flex: 1;
        min-width: 150px;
      }
    }

    .event-description-section,
    .participants-section {
      h2 {
        font-size: 1.5rem;
        font-weight: 500;
        margin-bottom: 16px;
        color: var(--text-primary);
      }
    }

    .description-text {
      font-size: 1rem;
      line-height: 1.8;
      color: var(--text-secondary);
      white-space: pre-wrap;
    }

    .participants-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .participant {
        position: relative;

        .participant-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border-color);
          box-shadow: var(--shadow-sm);
        }

        &.creator .creator-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          background-color: var(--warning-color);
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
            color: var(--text-primary);
          }
        }
      }
    }

    .chat-section {
      h2 {
        font-size: 1.5rem;
        font-weight: 500;
        margin: 24px 0 16px;
        color: var(--text-primary);
      }
    }

    .chat-container {
      background-color: var(--bg-tertiary);
      border-radius: 12px;
      overflow: hidden;
    }

    .messages-list {
      height: 400px;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;

      .no-messages {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--text-muted);
        text-align: center;
        gap: 8px;

        mat-icon {
          font-size: 48px;
          width: 48px;
          height: 48px;
        }
      }

      .message {
        display: flex;
        gap: 12px;
        max-width: 80%;

        &.own {
          align-self: flex-end;
          flex-direction: row-reverse;

          .message-content {
            background-color: var(--chat-own-bg);
          }
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }

        .message-content {
          background-color: var(--chat-other-bg);
          padding: 12px;
          border-radius: 12px;
          box-shadow: var(--shadow-sm);

          .message-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            .message-author {
              font-weight: 500;
              font-size: 0.875rem;
              color: var(--text-primary);
            }

            .message-time {
              font-size: 0.75rem;
              color: var(--text-muted);
            }
          }

          .message-text {
            margin: 0;
            color: var(--text-secondary);
            line-height: 1.5;
          }
        }
      }
    }

    .chat-not-allowed {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      gap: 16px;
      text-align: center;
      color: var(--text-secondary);
      background-color: var(--bg-tertiary);
      border-radius: 12px;

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-muted);
      }

      p {
        margin: 0;
        max-width: 400px;
      }
    }

    .chat-input {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background-color: var(--bg-card);
      border-top: 1px solid var(--border-color);

      .message-field {
        flex: 1;
        margin-bottom: -1.25em;
      }
    }
  `]
})
export class EventDetailComponent implements OnInit, OnDestroy {
  readonly DEFAULT_EVENT_IMAGE = DEFAULT_EVENT_IMAGE;
  readonly DEFAULT_AVATAR_IMAGE = DEFAULT_AVATAR_IMAGE;
  
  event = signal<Event | null>(null);
  messages = signal<Message[]>([]);
  isLoading = signal(true);
  isActionLoading = signal(false);
  errorMessage = signal<string | null>(null);
  newMessage = '';

  currentUserId = computed(() => this.authService.getUserId());
  
  isCreator = computed(() => {
    const event = this.event();
    return event?.creator.id === this.currentUserId();
  });

  isParticipant = computed(() => {
    const event = this.event();
    return event?.participants.some(p => p.id === this.currentUserId()) ?? false;
  });

  isParticipantOrCreator = computed(() => this.isCreator() || this.isParticipant());

  canJoin = computed(() => {
    const event = this.event();
    if (!event) return false;
    const notFull = event.participants.length < event.maxParticipants;
    return !this.isCreator() && !this.isParticipant() && notFull;
  });

  canLeave = computed(() => !this.isCreator() && this.isParticipant());

  private chatSetup = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLDivElement>;

  private messageHandler = (message: Message) => {
    this.zone.run(() => {
      this.messages.update(msgs => [...msgs, message]);
      this.scrollToBottom();
    });
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private chatService: ChatService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    const eventId = this.route.snapshot.paramMap.get('id');
    if (eventId) {
      this.loadEvent(eventId);
    } else {
      this.errorMessage.set('ID de evento no válido');
    }
  }

  ngOnDestroy(): void {
    const eventId = this.event()?.id;
    if (eventId) {
      this.chatService.offNewMessage(this.messageHandler);
      this.chatService.leaveRoom(eventId);
    }
    this.chatService.disconnect();
    this.chatSetup = false;
  }

  private loadEvent(eventId: string): void {
    this.eventService.getEvent(eventId).subscribe({
      next: (event) => {
        this.event.set(event);
        this.isLoading.set(false);
        
        console.log('[DEBUG] Evento cargado:', event.title);
        console.log('[DEBUG] Creador ID:', event.creator.id);
        console.log('[DEBUG] Mi userId:', this.currentUserId());
        console.log('[DEBUG] isCreator:', this.isCreator());
        console.log('[DEBUG] isParticipant:', this.isParticipant());
        console.log('[DEBUG] Imagen URL:', event.image);
        
        if (this.isParticipantOrCreator()) {
          console.log('[DEBUG] Inicializando chat...');
          this.setupChat(eventId);
        } else {
          console.log('[DEBUG] No se inicializa chat - no eres participante ni creador');
        }
      },
      error: (error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      }
    });
  }

  private setupChat(eventId: string): void {
    if (this.chatSetup) {
      console.log('[DEBUG] Chat ya inicializado');
      return;
    }
    const token = this.authService.getToken();
    console.log('[DEBUG] Token para chat:', token ? 'SI' : 'NO');
    if (token) {
      this.chatSetup = true;
      this.chatService.connect(token);
      this.chatService.joinRoom(eventId);
      this.chatService.onNewMessage(this.messageHandler);
      console.log('[DEBUG] Chat conectado y unido a sala:', eventId);

      // Load existing messages
      this.eventService.getMessages(eventId).subscribe({
        next: (messages) => {
          console.log('[DEBUG] Mensajes cargados:', messages.length);
          this.messages.set(messages);
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('[DEBUG] Error cargando mensajes:', error);
        }
      });
    } else {
      console.log('[DEBUG] No hay token, no se puede conectar al chat');
    }
  }

  joinEvent(): void {
    const eventId = this.event()?.id;
    if (!eventId) return;

    this.isActionLoading.set(true);
    this.eventService.joinEvent(eventId).subscribe({
      next: () => {
        // Recargar el evento para obtener los datos actualizados
        this.loadEvent(eventId);
        this.isActionLoading.set(false);
        this.snackBar.open('¡Te has unido al evento!', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.isActionLoading.set(false);
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
      }
    });
  }

  leaveEvent(): void {
    const eventId = this.event()?.id;
    if (!eventId) return;

    this.isActionLoading.set(true);
    this.eventService.leaveEvent(eventId).subscribe({
      next: () => {
        // Recargar el evento para obtener los datos actualizados
        this.loadEvent(eventId);
        this.isActionLoading.set(false);
        this.chatService.leaveRoom(eventId);
        this.chatSetup = false;
        this.snackBar.open('Has salido del evento', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        this.isActionLoading.set(false);
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
      }
    });
  }

  deleteEvent(): void {
    const eventId = this.event()?.id;
    if (!eventId) return;

    if (!confirm('¿Estás seguro de que deseas eliminar este evento?')) return;

    this.isActionLoading.set(true);
    this.eventService.deleteEvent(eventId).subscribe({
      next: () => {
        this.snackBar.open('Evento eliminado', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.isActionLoading.set(false);
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
      }
    });
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    const eventId = this.event()?.id;
    
    console.log('[DEBUG] Intentando enviar mensaje:', content, 'eventId:', eventId);
    
    if (!content || !eventId) {
      console.log('[DEBUG] Mensaje vacío o sin eventId');
      return;
    }

    this.chatService.sendMessage(eventId, content);
    this.newMessage = '';
    console.log('[DEBUG] Mensaje enviado');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const el = this.messagesContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 0);
  }

  categoryLabel(category: string | undefined): string {
    if (!category) return 'Otro';
    return CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
