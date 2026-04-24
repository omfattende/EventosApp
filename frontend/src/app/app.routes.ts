import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';

export const routes: Routes = [
  // Auth routes (without layout)
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent)
  },
  
  // Main routes (with layout)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'events/create',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/create-event/create-event.component').then(m => m.CreateEventComponent)
      },
      {
        path: 'events/:id/edit',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/create-event/create-event.component').then(m => m.CreateEventComponent)
      },
      {
        path: 'events/:id',
        loadComponent: () => import('./pages/event-detail/event-detail.component').then(m => m.EventDetailComponent)
      },
      {
        path: 'my-events',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/my-events/my-events.component').then(m => m.MyEventsComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },

  // Redirect to home for unknown routes
  {
    path: '**',
    redirectTo: ''
  }
];
