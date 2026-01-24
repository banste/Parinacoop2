export interface UserTable {
  // Ajusta si tus migraciones usan otros nombres, pero estos son los campos básicos
  run: number;
  role: string;
  password?: string | null;
  nombres?: string | null;
  primer_apellido?: string | null;
  segundo_apellido?: string | null;
  email?: string | null;
  celular?: string | null;
  fecha_creacion?: Date | string | null;
  fecha_actualizacion?: Date | string | null;
  id_direccion?: number | null;
  password_attempts?: number;
  enabled?: boolean;
  created_at?: Date | string | null;
  updated_at?: Date | string | null;

}