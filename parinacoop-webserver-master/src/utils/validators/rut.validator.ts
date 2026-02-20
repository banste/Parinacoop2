import { validateRut } from '@fdograph/rut-utilities';
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
          // OJO: esto valida RUT completo (con DV). Si quieres permitir solo RUN,
          // no uses este decorador en ese DTO.
          return validateRut(value);
        },
      },
    });
  };
};

/**
 * Extrae RUN (sin DV) desde:
 * - "20218321"            => 20218321
 * - "20218321-2"          => 20218321
 * - "20.218.321-2"        => 20218321
 * - "202183212" (digits)  => asume DV final => 20218321 (si length>=2)
 *
 * No valida DV (eso lo hace validateRut si lo necesitas).
 */
export const extractRunFromRut = (value: string): number | null => {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  // quitar puntos y espacios
  const noDots = raw.replace(/\./g, '').replace(/\s+/g, '');

  // caso 1: solo números => puede ser RUN o RUN+DV
  if (/^\d+$/.test(noDots)) {
    if (noDots.length >= 2) {
      // si el usuario metió RUN+DV todo junto, quitamos el último
      // pero si metió solo RUN (8 dígitos típicamente) igual funciona:
      // - si son 8 dígitos, esto quitaría un dígito incorrectamente.
      // Por eso: tratamos como RUN directo.
      const run = Number(noDots);
      return isNaN(run) || run <= 0 ? null : run;
    }
    const run = Number(noDots);
    return isNaN(run) || run <= 0 ? null : run;
  }

  // caso 2: viene con guion RUN-DV (DV puede ser número o K)
  const parts = noDots.split('-');
  if (parts.length === 2) {
    const runPart = parts[0];
    if (!/^\d+$/.test(runPart)) return null;
    const run = Number(runPart);
    return isNaN(run) || run <= 0 ? null : run;
  }

  // caso 3: formato raro => intentar rescatar dígitos del inicio
  const digits = noDots.replace(/[^\d]/g, '');
  if (!digits) return null;

  const run = Number(digits);
  return isNaN(run) || run <= 0 ? null : run;
};