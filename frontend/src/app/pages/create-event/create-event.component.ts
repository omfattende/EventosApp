import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { EventService } from '../../services/event.service';
import { GeolocationService } from '../../services/geolocation.service';
import { CategoryService, Category } from '../../services/category.service';

@Component({
  selector: 'app-create-event',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <div class="create-event-container">
      <mat-card class="create-event-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>add_circle</mat-icon>
            <span>Crear nuevo evento</span>
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="eventForm" (ngSubmit)="onSubmit()" class="create-event-form">
            <!-- Title -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Título del evento</mat-label>
              <input matInput formControlName="title" placeholder="Ej: Fiesta de verano">
              <mat-icon matPrefix>title</mat-icon>
              <mat-error *ngIf="eventForm.get('title')?.hasError('required')">
                El título es requerido
              </mat-error>
              <mat-error *ngIf="eventForm.get('title')?.hasError('minlength')">
                Mínimo 3 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Description -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea 
                matInput 
                formControlName="description" 
                placeholder="Describe tu evento..."
                rows="4"
              ></textarea>
              <mat-icon matPrefix>description</mat-icon>
              <mat-error *ngIf="eventForm.get('description')?.hasError('required')">
                La descripción es requerida
              </mat-error>
              <mat-error *ngIf="eventForm.get('description')?.hasError('minlength')">
                Mínimo 10 caracteres
              </mat-error>
            </mat-form-field>

            <!-- Image -->
            <div class="image-upload-section">
              <label class="image-label">
                <mat-icon>image</mat-icon>
                Imagen del evento
              </label>
              <input 
                type="file" 
                accept="image/*" 
                (change)="onFileSelected($event)"
                class="file-input"
                #fileInput
              >
              <button 
                mat-stroked-button 
                type="button" 
                (click)="fileInput.click()"
                class="upload-button"
              >
                <mat-icon>upload</mat-icon>
                {{ selectedFile() ? 'Cambiar imagen' : 'Seleccionar imagen' }}
              </button>
              <span *ngIf="selectedFile()" class="file-name">
                {{ selectedFile()?.name }}
              </span>
              <div *ngIf="imagePreview()" class="image-preview">
                <img [src]="imagePreview()" alt="Preview">
              </div>
            </div>

            <!-- Category -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Categoría</mat-label>
              <mat-select formControlName="category">
                <mat-option *ngFor="let cat of categories()" [value]="cat.id">
                  <mat-icon>{{ cat.icon || 'category' }}</mat-icon>
                  {{ cat.name }}
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>category</mat-icon>
              <mat-error *ngIf="eventForm.get('category')?.hasError('required')">
                La categoría es requerida
              </mat-error>
            </mat-form-field>

            <!-- Date & Time -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Fecha y hora</mat-label>
              <input 
                matInput 
                type="datetime-local" 
                formControlName="dateTime"
              >
              <mat-icon matPrefix>event</mat-icon>
              <mat-error *ngIf="eventForm.get('dateTime')?.hasError('required')">
                La fecha es requerida
              </mat-error>
            </mat-form-field>

            <!-- Max Participants -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Máximo de participantes</mat-label>
              <input 
                matInput 
                type="number" 
                formControlName="maxParticipants"
                min="2"
                max="1000"
              >
              <mat-icon matPrefix>people</mat-icon>
              <mat-error *ngIf="eventForm.get('maxParticipants')?.hasError('required')">
                El máximo de participantes es requerido
              </mat-error>
              <mat-error *ngIf="eventForm.get('maxParticipants')?.hasError('min')">
                Mínimo 2 participantes
              </mat-error>
            </mat-form-field>

            <!-- Online Toggle -->
            <div class="toggle-section">
              <mat-slide-toggle formControlName="isOnline" color="primary">
                Evento Online
              </mat-slide-toggle>
            </div>

            <!-- Meeting Link (if online) -->
            <mat-form-field 
              *ngIf="eventForm.get('isOnline')?.value" 
              appearance="outline" 
              class="full-width"
            >
              <mat-label>Link de la reunión</mat-label>
              <input 
                matInput 
                formControlName="meetingLink" 
                placeholder="https://zoom.us/j/..."
              >
              <mat-icon matPrefix>link</mat-icon>
              <mat-error *ngIf="eventForm.get('meetingLink')?.hasError('required')">
                El link es requerido para eventos online
              </mat-error>
            </mat-form-field>

            <!-- Location (if not online) -->
            <div *ngIf="!eventForm.get('isOnline')?.value" class="location-section">
              <h3>Ubicación</h3>
              
              <div class="location-coordinates">
                <mat-form-field appearance="outline">
                  <mat-label>Latitud</mat-label>
                  <input matInput type="number" formControlName="latitude" step="any">
                  <mat-icon matPrefix>explore</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Longitud</mat-label>
                  <input matInput type="number" formControlName="longitude" step="any">
                  <mat-icon matPrefix>explore</mat-icon>
                </mat-form-field>
              </div>

              <button 
                mat-stroked-button 
                type="button" 
                (click)="useMyLocation()"
                [disabled]="isGettingLocation() || !geolocationSupported()"
                class="location-button"
              >
                <mat-icon *ngIf="!isGettingLocation()">my_location</mat-icon>
                <mat-spinner *ngIf="isGettingLocation()" diameter="20"></mat-spinner>
                {{ isGettingLocation() ? 'Obteniendo ubicación...' : 'Usar mi ubicación' }}
              </button>

              <mat-error *ngIf="locationError()" class="location-error">
                {{ locationError() }}
              </mat-error>
            </div>

            <mat-error *ngIf="errorMessage()" class="form-error">
              {{ errorMessage() }}
            </mat-error>

            <!-- Submit Buttons -->
            <div class="form-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="isSubmitting()"
                class="submit-button"
              >
                <mat-spinner *ngIf="isSubmitting()" diameter="20"></mat-spinner>
                <span *ngIf="!isSubmitting()">Crear Evento</span>
              </button>

              <button 
                mat-stroked-button 
                type="button"
                routerLink="/"
              >
                Cancelar
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-event-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      background-color: var(--bg-primary);
      min-height: 100vh;
    }

    .create-event-card {
      padding: 24px;
      background-color: var(--bg-card);
      color: var(--text-primary);

      mat-card-header {
        margin-bottom: 24px;

        mat-card-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 1.5rem;
          color: var(--text-primary);

          mat-icon {
            font-size: 32px;
            width: 32px;
            height: 32px;
            color: var(--primary-color);
          }
        }
      }
    }

    .create-event-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    .image-upload-section {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .image-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .file-input {
        display: none;
      }

      .upload-button {
        align-self: flex-start;
      }

      .file-name {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .image-preview {
        width: 100%;
        max-width: 400px;
        height: 200px;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid var(--border-color);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .toggle-section {
      padding: 8px 0;
      color: var(--text-primary);
    }

    .location-section {
      padding: 16px;
      background-color: var(--bg-tertiary);
      border-radius: 8px;
      border: 1px solid var(--border-color);

      h3 {
        font-size: 1rem;
        font-weight: 500;
        margin-bottom: 16px;
        color: var(--text-primary);
      }

      .location-coordinates {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .location-button {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .location-error {
        margin-top: 8px;
        font-size: 0.875rem;
        color: var(--error-color);
      }
    }

    .form-error {
      text-align: center;
      margin: 8px 0;
      color: var(--error-color);
    }

    .form-actions {
      display: flex;
      gap: 16px;
      margin-top: 16px;

      .submit-button {
        flex: 1;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      @media (max-width: 600px) {
        flex-direction: column;
      }
    }

    // Input text colors
    ::ng-deep .mat-mdc-form-field .mat-mdc-input-element {
      color: var(--text-primary) !important;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-floating-label {
      color: var(--text-secondary) !important;
    }

    ::ng-deep .mat-mdc-select-value {
      color: var(--text-primary) !important;
    }

    ::ng-deep .mat-mdc-slide-toggle .mdc-switch__label {
      color: var(--text-primary) !important;
    }

    // Fix select dropdown panel
    ::ng-deep .mat-mdc-select-panel {
      background-color: var(--bg-card) !important;
      border: 1px solid var(--border-color);
    }

    ::ng-deep .mat-mdc-option {
      background-color: var(--bg-card) !important;
      color: var(--text-primary) !important;
    }

    ::ng-deep .mat-mdc-option:hover,
    ::ng-deep .mat-mdc-option.mat-mdc-option-active {
      background-color: var(--bg-tertiary) !important;
    }

    ::ng-deep .mat-mdc-option.mdc-list-item--selected {
      background-color: var(--primary-color) !important;
      color: white !important;
    }

    ::ng-deep .mat-mdc-option .mat-icon {
      color: var(--text-secondary) !important;
      margin-right: 8px;
    }
  `]
})
export class CreateEventComponent {
  private fb = inject(FormBuilder);
  private eventService = inject(EventService);
  private geolocationService = inject(GeolocationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  categories = signal<Category[]>([
    { id: 'deporte', name: 'Deportes', icon: 'sports_soccer' },
    { id: 'musica', name: 'Música', icon: 'music_note' },
    { id: 'tecnologia', name: 'Tecnología', icon: 'computer' },
    { id: 'arte', name: 'Arte', icon: 'palette' },
    { id: 'comida', name: 'Comida', icon: 'restaurant' },
    { id: 'estudios', name: 'Estudios', icon: 'school' },
    { id: 'fiestas', name: 'Fiestas', icon: 'celebration' },
    { id: 'videojuegos', name: 'Videojuegos', icon: 'sports_esports' },
  ]);
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  isSubmitting = signal(false);
  isGettingLocation = signal(false);
  errorMessage = signal<string | null>(null);
  locationError = signal<string | null>(null);
  geolocationSupported = signal(false);

  eventForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    category: ['', Validators.required],
    dateTime: ['', Validators.required],
    maxParticipants: [50, [Validators.required, Validators.min(2), Validators.max(1000)]],
    isOnline: [false],
    meetingLink: [''],
    latitude: [''],
    longitude: ['']
  });

  constructor() {
    this.geolocationSupported.set(this.geolocationService.isSupported());

    // Update validators when isOnline changes
    this.eventForm.get('isOnline')?.valueChanges.subscribe((isOnline: boolean | null) => {
      const meetingLinkControl = this.eventForm.get('meetingLink');
      if (isOnline) {
        meetingLinkControl?.setValidators([Validators.required]);
      } else {
        meetingLinkControl?.clearValidators();
      }
      meetingLinkControl?.updateValueAndValidity();
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Categories are hardcoded statically - no server call needed

  useMyLocation(): void {
    this.isGettingLocation.set(true);
    this.locationError.set(null);

    this.geolocationService.getCurrentPosition()
      .then((coords) => {
        this.eventForm.patchValue({
          latitude: coords.latitude.toString(),
          longitude: coords.longitude.toString()
        });
        this.isGettingLocation.set(false);
        this.snackBar.open('Ubicación obtenida correctamente', 'Cerrar', { duration: 3000 });
      })
      .catch((error: Error) => {
        this.locationError.set(error.message);
        this.isGettingLocation.set(false);
      });
  }

  onSubmit(): void {
    // Marcar todos los campos como touched para mostrar errores
    this.eventForm.markAllAsTouched();
    
    if (this.eventForm.invalid) {
      // Mostrar mensaje de error específico
      const controls = this.eventForm.controls;
      if (controls.title.invalid) {
        this.errorMessage.set('El título es requerido (mínimo 3 caracteres)');
      } else if (controls.description.invalid) {
        this.errorMessage.set('La descripción es requerida (mínimo 10 caracteres)');
      } else if (controls.category.invalid) {
        this.errorMessage.set('Selecciona una categoría');
      } else if (controls.dateTime.invalid) {
        this.errorMessage.set('Selecciona fecha y hora del evento');
      } else {
        this.errorMessage.set('Por completa todos los campos requeridos');
      }
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formValue = this.eventForm.value;

    // Validate location for non-online events
    if (!formValue.isOnline && (!formValue.latitude || !formValue.longitude)) {
      this.errorMessage.set('Para eventos presenciales, ingresa la ubicación o usa "Mi ubicación"');
      this.isSubmitting.set(false);
      return;
    }

    // Validar fecha
    if (!formValue.dateTime) {
      this.errorMessage.set('La fecha y hora son requeridas');
      this.isSubmitting.set(false);
      return;
    }

    const dateObj = new Date(formValue.dateTime);
    if (isNaN(dateObj.getTime())) {
      this.errorMessage.set('La fecha y hora no son válidas');
      this.isSubmitting.set(false);
      return;
    }

    const eventData = {
      title: formValue.title!,
      description: formValue.description!,
      category: formValue.category!,
      dateTime: dateObj.toISOString(),
      isOnline: formValue.isOnline!,
      maxParticipants: formValue.maxParticipants!,
      image: this.selectedFile() || undefined,
      meetingLink: formValue.meetingLink || undefined,
      location: !formValue.isOnline ? {
        latitude: parseFloat(formValue.latitude!),
        longitude: parseFloat(formValue.longitude!)
      } : undefined
    };

    this.eventService.createEvent(eventData).subscribe({
      next: (event) => {
        this.snackBar.open('¡Evento creado exitosamente!', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/events', event.id]);
      },
      error: (error: Error) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }
}
