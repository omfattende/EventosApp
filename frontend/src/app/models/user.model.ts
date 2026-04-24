export interface User {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  name: string;
  bio?: string;
  avatar?: string;
}
