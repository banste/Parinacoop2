export interface AdminUser {
  id: number;
  run?: string; // usar string para preservar ceros y dígitos completos
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}