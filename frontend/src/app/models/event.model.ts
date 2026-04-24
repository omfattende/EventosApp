export interface Event {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  dateTime: string;
  isOnline: boolean;
  maxParticipants: number;
  location?: EventLocation;
  meetingLink?: string;
  creator: EventCreator;
  participants: EventParticipant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EventLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface EventCreator {
  id: string;
  name: string;
  avatar?: string;
}

export interface EventParticipant {
  id: string;
  name: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  eventId: string;
  createdAt: string;
}

export type Category = string;

/** Normaliza un nombre de categoría: minúsculas, sin tildes */
export function normalizeCategory(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Labels amigables para mostrar en UI */
export const CATEGORY_LABELS: Record<string, string> = {
  'deporte': 'Deportes',
  'deportes': 'Deportes',
  'musica': 'Música',
  'música': 'Música',
  'tecnologia': 'Tecnología',
  'tecnología': 'Tecnología',
  'arte': 'Arte',
  'comida': 'Comida',
  'gastronomia': 'Gastronomía',
  'gastronomía': 'Gastronomía',
  'estudios': 'Estudios',
  'fiestas': 'Fiestas',
  'videojuegos': 'Videojuegos',
  'social': 'Social',
  'otros': 'Otros',
  'educacion': 'Educación',
  'educación': 'Educación',
};

export const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'deporte', label: 'Deportes', icon: 'sports_soccer' },
  { value: 'musica', label: 'Música', icon: 'music_note' },
  { value: 'tecnologia', label: 'Tecnología', icon: 'computer' },
  { value: 'arte', label: 'Arte', icon: 'palette' },
  { value: 'comida', label: 'Comida', icon: 'restaurant' },
  { value: 'estudios', label: 'Estudios', icon: 'school' },
  { value: 'fiestas', label: 'Fiestas', icon: 'celebration' },
  { value: 'videojuegos', label: 'Videojuegos', icon: 'sports_esports' },
];

export interface EventFilters {
  category?: string;
  onlineOnly?: boolean;
  nearMe?: boolean;
  latitude?: number;
  longitude?: number;
  radius?: number;
}
