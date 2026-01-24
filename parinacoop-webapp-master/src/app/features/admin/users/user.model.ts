export interface AdminUser {
  id: number;
  run?: number | string;
  name?: string;
  email?: string;
  role?: string;
  active?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}