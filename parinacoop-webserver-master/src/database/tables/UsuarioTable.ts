import { Role } from '@/contexts/shared/enums/roles.enum';

export interface UsuarioTable {
  run: string;                // PK, ej: "12.345.678-5"
  primer_apellido: string;
  segundo_apellido: string;
  celular: string;
  contrasena: string;         // hash bcrypt
  fecha_creacion: Date;
  fecha_actualizacion: Date;
  nombres: string;
  email: string;
  id_direccion: number;
}