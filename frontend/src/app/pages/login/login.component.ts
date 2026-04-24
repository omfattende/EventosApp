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
  selector: 'app-login',
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
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header class="login-header">
          <mat-card-title>
            <mat-icon>event</mat-icon>
            <span>Eventos Sociales</span>
          </mat-card-title>
          <mat-card-subtitle>Inicia sesión para continuar</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="tu@email.com">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                El email es requerido
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
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
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                La contraseña es requerida
              </mat-error>
              <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
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
              class="full-width login-button"
              [disabled]="loginForm.invalid || isLoading()"
            >
              <mat-spinner *ngIf="isLoading()" diameter="20" class="inline-spinner"></mat-spinner>
              <span *ngIf="!isLoading()">Iniciar sesión</span>
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="login-actions">
          <p>¿No tienes cuenta?</p>
          <a mat-button color="accent" routerLink="/register">Regístrate aquí</a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: var(--gradient-primary);
    }

    .login-card {
      max-width: 400px;
      width: 100%;
      padding: 24px;
    }

    .login-header {
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

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .login-button {
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

    .login-actions {
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  hidePassword = signal(true);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePasswordVisibility(): void {
    this.hidePassword.update(value => !value);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.snackBar.open('¡Bienvenido!', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/']);
      },
      error: (error: Error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }
}
