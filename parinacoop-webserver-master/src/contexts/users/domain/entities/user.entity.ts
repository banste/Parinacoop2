export class User {
  id!: number;
  name?: string | null;
  // Mantener run como string para preservar dígitos y formatos (consistente con la API)
  run?: string | null;
  email?: string | null;
  role?: string | null;
  active?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}