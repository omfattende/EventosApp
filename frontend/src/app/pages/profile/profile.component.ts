import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../services/user.service';
import { DEFAULT_AVATAR_IMAGE } from '../../shared/images';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="profile-container">
      <h1 class="page-title">Mi Perfil</h1>

      <div *ngIf="isLoading()" class="loading-container">
        <mat-spinner diameter="48"></mat-spinner>
        <p>Cargando perfil...</p>
      </div>

      <div *ngIf="!isLoading() && user()" class="profile-content">
        <!-- Profile Card -->
        <mat-card class="profile-card">
          <mat-card-header class="profile-header">
            <div class="avatar-container">
              <img 
                [src]="user()?.avatar || DEFAULT_AVATAR_IMAGE" 
                [alt]="user()?.name"
                class="profile-avatar"
              >
            </div>
            <div class="profile-info">
              <mat-card-title>{{ user()?.name }}</mat-card-title>
              <mat-card-subtitle>{{ user()?.email }}</mat-card-subtitle>
            </div>
          </mat-card-header>

          <mat-divider></mat-divider>

          <mat-card-content>
            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
              <!-- Name -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="name" placeholder="Tu nombre">
                <mat-icon matPrefix>person</mat-icon>
                <mat-error *ngIf="profileForm.get('name')?.hasError('required')">
                  El nombre es requerido
                </mat-error>
                <mat-error *ngIf="profileForm.get('name')?.hasError('minlength')">
                  Mínimo 2 caracteres
                </mat-error>
              </mat-form-field>

              <!-- Email (readonly) -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput [value]="user()?.email" readonly>
                <mat-icon matPrefix>email</mat-icon>
              </mat-form-field>

              <!-- Bio -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Biografía</mat-label>
                <textarea 
                  matInput 
                  formControlName="bio" 
                  placeholder="Cuéntanos sobre ti..."
                  rows="4"
                  maxlength="500"
                ></textarea>
                <mat-icon matPrefix>description</mat-icon>
                <mat-hint align="end">{{ profileForm.get('bio')?.value?.length || 0 }} / 500</mat-hint>
              </mat-form-field>

              <!-- Avatar URL -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>URL del avatar</mat-label>
                <input matInput formControlName="avatar" placeholder="https://ejemplo.com/avatar.jpg">
                <mat-icon matPrefix>image</mat-icon>
                <mat-hint>Ingresa la URL de tu imagen de perfil</mat-hint>
              </mat-form-field>

              <!-- Preview -->
              <div *ngIf="profileForm.get('avatar')?.value" class="avatar-preview">
                <label>Vista previa:</label>
                <img 
                  [src]="profileForm.get('avatar')?.value" 
                  alt="Avatar preview"
                  (error)="onImageError($event)"
                >
              </div>

              <mat-error *ngIf="errorMessage()" class="form-error">
                {{ errorMessage() }}
              </mat-error>

              <div class="form-actions">
                <button 
                  mat-raised-button 
                  color="primary" 
                  type="submit"
                  [disabled]="profileForm.invalid || isSaving() || !profileForm.dirty"
                  class="save-button"
                >
                  <mat-spinner *ngIf="isSaving()" diameter="20"></mat-spinner>
                  <mat-icon *ngIf="!isSaving()">save</mat-icon>
                  <span>{{ isSaving() ? 'Guardando...' : 'Guardar cambios' }}</span>
                </button>

                <button 
                  mat-stroked-button 
                  type="button"
                  routerLink="/"
                >
                  <mat-icon>arrow_back</mat-icon>
                  Volver
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Stats Card -->
        <mat-card class="stats-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>insights</mat-icon>
              Estadísticas
            </mat-card-title>
          </mat-card-header>

          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <mat-icon>event</mat-icon>
                <span class="stat-value">{{ userStats().createdEvents }}</span>
                <span class="stat-label">Eventos creados</span>
              </div>
              <div class="stat-item">
                <mat-icon>emoji_people</mat-icon>
                <span class="stat-value">{{ userStats().joinedEvents }}</span>
                <span class="stat-label">Eventos unidos</span>
              </div>
              <div class="stat-item">
                <mat-icon>calendar_today</mat-icon>
                <span class="stat-value">{{ formatDate(user()?.createdAt) }}</span>
                <span class="stat-label">Miembro desde</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 500;
      margin-bottom: 24px;
      color: var(--text-primary);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      gap: 16px;
    }

    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .profile-card {
      .profile-header {
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 24px;

        .avatar-container {
          .profile-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid var(--border-color);
          }
        }

        .profile-info {
          mat-card-title {
            font-size: 1.5rem;
            margin-bottom: 4px;
          }

          mat-card-subtitle {
            color: var(--text-secondary);
          }
        }
      }

      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
        padding: 24px;

        .full-width {
          width: 100%;
        }

        .avatar-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;

          label {
            font-size: 0.875rem;
            color: var(--text-secondary);
          }

          img {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--border-color);
          }
        }

        .form-error {
          text-align: center;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          margin-top: 16px;

          .save-button {
            flex: 1;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
        }
      }
    }

    .stats-card {
      mat-card-header {
        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px;
        padding: 24px;

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          padding: 16px;
          background-color: var(--bg-tertiary);
          border-radius: 8px;

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: var(--text-tertiary);
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 500;
            color: var(--text-primary);
          }

          .stat-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
          }
        }
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  readonly DEFAULT_AVATAR_IMAGE = DEFAULT_AVATAR_IMAGE;
  
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  user = signal<User | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  userStats = signal({ createdEvents: 0, joinedEvents: 0 });

  profileForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
    bio: ['', Validators.maxLength(500)],
    avatar: ['']
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.isLoading.set(true);
    
    this.userService.getProfile().subscribe({
      next: (user: User) => {
        this.user.set(user);
        this.profileForm.patchValue({
          name: user.name,
          bio: user.bio || '',
          avatar: user.avatar || ''
        });
        this.isLoading.set(false);
        
        // Load stats (mock data for now, should come from backend)
        this.userStats.set({
          createdEvents: 0, // TODO: Get from backend
          joinedEvents: 0   // TODO: Get from backend
        });
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid || !this.profileForm.dirty) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);

    const formValue = this.profileForm.value;

    this.userService.updateProfile({
      name: formValue.name!,
      bio: formValue.bio || undefined,
      avatar: formValue.avatar || undefined
    }).subscribe({
      next: (updatedUser: User) => {
        this.user.set(updatedUser);
        this.isSaving.set(false);
        this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.profileForm.markAsPristine();
      },
      error: (error: Error) => {
        this.isSaving.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.DEFAULT_AVATAR_IMAGE;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
