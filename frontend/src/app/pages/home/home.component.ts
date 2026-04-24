import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../services/event.service';
import { Event, CATEGORIES, Category } from '../../models/event.model';
import { DEFAULT_EVENT_IMAGE, DEFAULT_AVATAR_IMAGE } from '../../shared/images';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule
  ],
  template: `
    <div class="home-container">
      <!-- Hero -->
      <section class="hero" [style.background-image]="'url(assets/large_Rhapsody_reunion_2017.jpg)'">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1>Eventos en Monterrey</h1>
          <p>Descubre y únete a eventos cerca de ti</p>
        </div>
      </section>

      <!-- Filters -->
      <section class="filters">
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar eventos..." [(ngModel)]="searchQuery" (input)="onSearch()">
        </div>
        <div class="chips">
          <button class="chip" [class.active]="!selectedCategory()" (click)="clearCategory()">Todos</button>
          <button *ngFor="let cat of categories" class="chip" [class.active]="selectedCategory() === cat.value" (click)="setCategory(cat.value)">{{ cat.label }}</button>
        </div>
      </section>

      <!-- Events -->
      <section class="events">
        <div class="events-header">
          <h2>Eventos disponibles ({{ filteredEvents().length }})</h2>
        </div>

        <div class="loading" *ngIf="isLoading()">
          <mat-spinner diameter="50"></mat-spinner>
        </div>

        <div class="grid" *ngIf="!isLoading() && filteredEvents().length > 0">
          <div *ngFor="let event of filteredEvents()" class="card" [routerLink]="['/events', event.id]">
            <div class="card-image">
              <img [src]="event.image || defaultEventImage" [alt]="event.title">
              <span class="badge" [class.online]="event.isOnline">{{ event.isOnline ? 'Online' : 'Presencial' }}</span>
            </div>
            <div class="card-body">
              <h3>{{ event.title }}</h3>
              <p>{{ event.description | slice:0:80 }}...</p>
              <div class="card-footer">
                <div class="user">
                  <img [src]="event.creator.avatar || defaultAvatarImage">
                  <span>{{ event.creator.name }}</span>
                </div>
                <span class="count">{{ event.participants.length }}/{{ event.maxParticipants }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="empty" *ngIf="!isLoading() && filteredEvents().length === 0">
          <mat-icon>event_busy</mat-icon>
          <p>No hay eventos</p>
          <button mat-raised-button color="primary" routerLink="/events/create">Crear Evento</button>
        </div>
      </section>

      <button mat-fab color="primary" class="fab" routerLink="/events/create">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .home-container { min-height: 100vh; background: var(--bg-primary); padding-bottom: 80px; }
    
    .hero { 
      position: relative;
      padding: 80px 20px; 
      text-align: center; 
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      color: white;
      min-height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgb(6 6 6 / 0%) 0%, rgb(103 103 103 / 85%) 100%);
      z-index: 1;
    }
    .hero-content {
      position: relative;
      z-index: 2;
    }
    .hero h1 { 
      font-size: 2.5rem; 
      margin: 0 0 10px; 
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .hero p { 
      font-size: 1.1rem; 
      margin: 0; 
      opacity: 0.95;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }
    @media (max-width: 768px) {
      .hero { padding: 60px 20px; min-height: 250px; }
      .hero h1 { font-size: 1.8rem; }
    }

    .filters { 
      padding: 20px; 
      background: var(--bg-secondary); 
      border-bottom: 1px solid var(--border-color);
    }
    .search-box { 
      display: flex; 
      align-items: center; 
      gap: 10px; 
      padding: 12px 16px; 
      background: var(--bg-tertiary); 
      border-radius: 25px; 
      margin-bottom: 15px;
    }
    .search-box input { 
      flex: 1; 
      border: none; 
      background: transparent; 
      font-size: 16px; 
      outline: none;
      color: var(--text-primary);
    }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chip { 
      padding: 8px 16px; 
      background: var(--bg-tertiary); 
      border: none; 
      border-radius: 20px; 
      cursor: pointer;
      color: var(--text-secondary);
    }
    .chip.active { background: var(--primary-color); color: white; }

    .events { padding: 20px; max-width: 1200px; margin: 0 auto; }
    .events-header { margin-bottom: 20px; }
    .events-header h2 { font-size: 1.3rem; color: var(--text-primary); margin: 0; }
    
    .loading { display: flex; justify-content: center; padding: 40px; }
    
    .grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
      gap: 20px; 
    }
    
    .card { 
      background: var(--bg-card); 
      border-radius: 12px; 
      overflow: hidden; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover { 
      transform: translateY(-4px); 
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    
    .card-image { 
      position: relative; 
      height: 160px; 
      overflow: hidden;
    }
    .card-image img { 
      width: 100%; 
      height: 100%; 
      object-fit: cover;
    }
    .badge { 
      position: absolute; 
      top: 10px; 
      left: 10px; 
      padding: 4px 10px; 
      border-radius: 12px; 
      font-size: 12px; 
      font-weight: 600;
      background: var(--warning-color);
      color: white;
    }
    .badge.online { background: var(--success-color); }
    
    .card-body { padding: 16px; }
    .card-body h3 { 
      font-size: 1.1rem; 
      margin: 0 0 8px; 
      color: var(--text-primary);
    }
    .card-body p { 
      font-size: 0.9rem; 
      color: var(--text-secondary); 
      margin: 0 0 12px;
    }
    
    .card-footer { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
    }
    .user { display: flex; align-items: center; gap: 8px; }
    .user img { width: 28px; height: 28px; border-radius: 50%; }
    .user span { font-size: 0.85rem; color: var(--text-secondary); }
    .count { font-size: 0.85rem; color: var(--text-tertiary); }
    
    .empty { text-align: center; padding: 60px 20px; }
    .empty mat-icon { font-size: 64px; color: var(--text-tertiary); margin-bottom: 16px; }
    .empty p { color: var(--text-secondary); margin-bottom: 20px; }
    
    .fab { 
      position: fixed; 
      bottom: 24px; 
      right: 24px;
      background: var(--gradient-primary) !important;
    }

    @media (max-width: 600px) {
      .hero h1 { font-size: 1.5rem; }
      .grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HomeComponent implements OnInit {
  events = signal<Event[]>([]);
  filteredEvents = signal<Event[]>([]);
  isLoading = signal(true);
  selectedCategory = signal<Category | null>(null);
  searchQuery = '';

  categories = CATEGORIES;
  defaultEventImage = DEFAULT_EVENT_IMAGE;
  defaultAvatarImage = DEFAULT_AVATAR_IMAGE;

  constructor(
    private eventService: EventService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading.set(true);
    this.eventService.getEvents().subscribe({
      next: (events) => {
        this.events.set(events);
        this.filterEvents();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
        this.isLoading.set(false);
      }
    });
  }

  onSearch(): void {
    this.filterEvents();
  }

  filterEvents(): void {
    let filtered = this.events();
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(e => e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query));
    }
    this.filteredEvents.set(filtered);
  }

  clearCategory(): void {
    this.selectedCategory.set(null);
    this.loadEvents();
  }

  setCategory(cat: Category): void {
    this.selectedCategory.set(cat);
    this.loadEvents();
  }
}
