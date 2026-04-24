import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'theme';
  private platformId = inject(PLATFORM_ID);
  isDarkMode = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Cargar tema guardado o preferencia del sistema
      const savedTheme = localStorage.getItem(this.THEME_KEY);
      if (savedTheme) {
        this.isDarkMode.set(savedTheme === 'dark');
      } else {
        this.isDarkMode.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
      }

      // Aplicar tema inicial
      this.applyTheme();
    }
  }

  toggleTheme(): void {
    this.isDarkMode.update(current => !current);
    this.applyTheme();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.THEME_KEY, this.isDarkMode() ? 'dark' : 'light');
    }
  }

  setDarkMode(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    this.applyTheme();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');
    }
  }

  private applyTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      const html = document.documentElement;
      if (this.isDarkMode()) {
        html.classList.add('dark-theme');
        html.classList.remove('light-theme');
      } else {
        html.classList.add('light-theme');
        html.classList.remove('dark-theme');
      }
    }
  }
}
