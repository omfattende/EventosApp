import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
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
    MatSnackBarModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header class="register-header">
          <mat-card-title>
            <mat-icon>person_add</mat-icon>
            <span>Crear cuenta</span>
          </mat-card-title>
          <mat-card-subtitle>Únete a Eventos Sociales</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input matInput type="text" formControlName="name" placeholder="Tu nombre">
              <mat-icon matPrefix>person</mat-icon>
              <mat-error *ngIf="registerForm.get('name')?.hasError('required')">
                El nombre es requerido
              </mat-error>
              <mat-error *ngIf="registerForm.get('name')?.hasError('minlength')">
                Mínimo 2 caracteres
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="tu@email.com">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                El email es requerido
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Ingresa un email válido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="togglePasswordVisibility()">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                La contraseña es requerida
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Mínimo 6 caracteres
              </mat-error>
            </mat-form-field>

            <mat-error *ngIf="errorMessage()" class="error-message">
              {{ errorMessage() }}
            </mat-error>

            <button 
              mat-raised-button 
              color="primary" 
              type="submit" 
              class="full-width register-button"
              [disabled]="registerForm.invalid || isLoading()"
            >
              <mat-spinner *ngIf="isLoading()" diameter="20" class="inline-spinner"></mat-spinner>
              <span *ngIf="!isLoading()">Registrarse</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="register-actions">
          <p>¿Ya tienes cuenta?</p>
          <a mat-button color="accent" routerLink="/login">Inicia sesión</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: var(--gradient-primary);
    }

    .register-card {
      max-width: 400px;
      width: 100%;
      padding: 24px;
    }

    .register-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.5rem;
        margin-bottom: 8px;

        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }

      mat-card-subtitle {
        text-align: center;
      }
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .register-button {
      height: 48px;
      margin-top: 8px;
    }

    .inline-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    .error-message {
      text-align: center;
      margin: 8px 0;
    }

    .register-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 0 0;

      p {
        margin: 0 0 8px;
        color: var(--text-secondary);
      }
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.hidePassword.update(value => !value);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { name, email, password } = this.registerForm.value;

    this.authService.register({ 
      name: name!, 
      email: email!, 
      password: password! 
    }).subscribe({
      next: () => {
        this.snackBar.open('¡Cuenta creada exitosamente!', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/']);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }
}
