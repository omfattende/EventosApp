import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatToolbarModule,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatSidenavModule, MatListModule
  ],
  template: `
    <mat-toolbar class="navbar">
      <div class="brand" routerLink="/">
        <mat-icon>event</mat-icon>
        <span>Eventos</span>
      </div>

      <!-- Desktop nav links -->
      <div class="nav-links" *ngIf="isAuthenticated()">
        <a mat-button routerLink="/">Inicio</a>
        <a mat-button routerLink="/events/create">Crear</a>
        <a mat-button routerLink="/my-events">Mis Eventos</a>
      </div>

      <span class="spacer"></span>

      <div class="actions">
        <button mat-icon-button (click)="toggleTheme()" [title]="isDarkMode() ? 'Modo claro' : 'Modo oscuro'">
          <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
        </button>

        <!-- Mobile hamburger menu -->
        <button 
          mat-icon-button 
          class="mobile-menu-btn" 
          (click)="toggleMobileMenu()"
          *ngIf="isAuthenticated()"
        >
          <mat-icon>menu</mat-icon>
        </button>

        <ng-container *ngIf="isAuthenticated(); else guestActions">
          <button mat-button [matMenuTriggerFor]="menu" class="desktop-user-btn">
            <mat-icon>account_circle</mat-icon>
            <span class="username">{{ userName() }}</span>
          </button>
          <mat-menu #menu="matMenu">
            <a mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Perfil</span>
            </a>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar sesión</span>
            </button>
          </mat-menu>
        </ng-container>

        <ng-template #guestActions>
          <button mat-button (click)="router.navigate(['/login'])">Entrar</button>
          <button mat-raised-button color="primary" (click)="router.navigate(['/register'])">Registrarse</button>
        </ng-template>
      </div>
    </mat-toolbar>

    <!-- Mobile side drawer -->
    <div class="mobile-drawer-overlay" [class.open]="mobileMenuOpen()" (click)="closeMobileMenu()"></div>
    <div class="mobile-drawer" [class.open]="mobileMenuOpen()">
      <div class="drawer-header">
        <span class="drawer-title">Menú</span>
        <button mat-icon-button (click)="closeMobileMenu()">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <div class="drawer-user" *ngIf="isAuthenticated()">
        <mat-icon class="user-icon">account_circle</mat-icon>
        <span class="user-name">{{ userName() }}</span>
      </div>

      <nav class="drawer-nav">
        <a class="drawer-link" routerLink="/" (click)="closeMobileMenu()">
          <mat-icon>home</mat-icon>
          <span>Inicio</span>
        </a>
        <a class="drawer-link" routerLink="/events/create" (click)="closeMobileMenu()">
          <mat-icon>add_circle</mat-icon>
          <span>Crear evento</span>
        </a>
        <a class="drawer-link" routerLink="/my-events" (click)="closeMobileMenu()">
          <mat-icon>event_note</mat-icon>
          <span>Mis eventos</span>
        </a>
        <a class="drawer-link" routerLink="/profile" (click)="closeMobileMenu()">
          <mat-icon>person</mat-icon>
          <span>Perfil</span>
        </a>
        <div class="drawer-divider"></div>
        <button class="drawer-link logout" (click)="logout(); closeMobileMenu()">
          <mat-icon>logout</mat-icon>
          <span>Cerrar sesión</span>
        </button>
      </nav>
    </div>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      padding: 0 16px;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      height: 64px;
      position: relative;
      z-index: 100;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-primary);
      text-decoration: none;
    }
    .brand mat-icon { color: var(--primary-color); }
    .brand span { font-weight: 600; font-size: 1.2rem; }

    .nav-links {
      display: flex;
      margin-left: 24px;
      gap: 8px;
    }
    .nav-links a { color: var(--text-secondary); }
    .nav-links a:hover { color: var(--primary-color); }

    .spacer { flex: 1; }

    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .actions button, .actions a { color: var(--text-secondary); }
    .username { margin-left: 4px; }

    .mobile-menu-btn {
      display: none;
    }

    .mobile-drawer-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 200;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
    }

    .mobile-drawer-overlay.open {
      opacity: 1;
      visibility: visible;
    }

    .mobile-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: 280px;
      max-width: 85vw;
      background: var(--bg-secondary);
      border-left: 1px solid var(--border-color);
      z-index: 201;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .mobile-drawer.open {
      transform: translateX(0);
    }

    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .drawer-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .drawer-user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .drawer-user .user-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: var(--primary-color);
    }

    .drawer-user .user-name {
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .drawer-nav {
      display: flex;
      flex-direction: column;
      padding: 8px;
      flex: 1;
    }

    .drawer-link {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      color: var(--text-primary);
      text-decoration: none;
      font-size: 1rem;
      transition: background 0.2s;
      cursor: pointer;
      background: transparent;
      border: none;
      text-align: left;
      width: 100%;
    }

    .drawer-link:hover {
      background: var(--bg-tertiary);
    }

    .drawer-link mat-icon {
      color: var(--text-secondary);
    }

    .drawer-link.logout {
      color: var(--error-color);
      margin-top: auto;
    }

    .drawer-link.logout mat-icon {
      color: var(--error-color);
    }

    .drawer-divider {
      height: 1px;
      background: var(--divider-color);
      margin: 8px 16px;
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .username { display: none; }
      .desktop-user-btn { display: none; }
      .mobile-menu-btn {
        display: inline-flex;
      }
      .brand span { display: none; }
    }

    @media (min-width: 769px) {
      .mobile-drawer,
      .mobile-drawer-overlay {
        display: none !important;
      }
    }
  `]
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  router = inject(Router);

  mobileMenuOpen = signal(false);

  isAuthenticated = this.authService.isAuthenticated;
  userName = computed(() => this.authService.currentUser()?.name || 'Usuario');
  isDarkMode = this.themeService.isDarkMode;

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }
}
