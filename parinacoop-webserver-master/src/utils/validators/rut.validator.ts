import { getRutDigits, validateRut } from '@fdograph/rut-utilities';
import { registerDecorator } from 'class-validator';

export const IsValidRun = () => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidRun',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message: 'El run dado no es válido',
      },
      validator: {
        validate: (value: string) => {
          return validateRut(value);
        },
      },
    });
  };
};

/**
 * Extrae el RUN (sin dígito verificador) desde un RUT string.
 * - Acepta formatos con puntos/guion.
 * - Retorna número RUN (sin DV) o null si no es válido.
 */
export const extractRunFromRut = (rut: string): number | null => {
  if (!rut) return null;

  const raw = String(rut).trim();
  if (!raw) return null;

  // Primero validamos rut completo (incluye DV)
  if (!validateRut(raw)) return null;

  // getRutDigits: devuelve solo dígitos (incluye DV como último caracter si es numérico;
  // en rut chileno DV puede ser 'K'. OJO: esta lib lo maneja igual y puede devolver '12345678K'.
  const digits = String(getRutDigits(raw) ?? '').trim();
  if (!digits || digits.length < 2) return null;

  // El último caracter es DV (puede ser K). El resto es el RUN numérico.
  const runPart = digits.slice(0, -1);
  if (!/^\d+$/.test(runPart)) return null;

  const run = Number(runPart);
  return !run || isNaN(run) ? null : run;
};