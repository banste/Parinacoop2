export function calcularDV(rut: number | string): string {
  let suma = 0;
  let multiplo = 2;

  // Limpiar posibles puntos o guión
  const rutLimpio = rut?.toString().replace(/\D/g, '') ?? '';

  for (let i = rutLimpio.length - 1; i >= 0; i--) {
    suma += parseInt(rutLimpio.charAt(i), 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resto = suma % 11;
  const dv = 11 - resto;

  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
}

/**
 * Devuelve el RUT formateado con puntos y guión + DV.
 * Ej: 20218321 -> "20.218.321-2"
 */
export function formatRut(rut: number | string): string {
  const rutLimpio = rut == null ? '' : rut.toString().replace(/\D/g, '');
  if (!rutLimpio) return '';

  // calcular DV
  const dv = calcularDV(rutLimpio);

  // aplicar puntos cada 3 dígitos desde la derecha
  const reversed = rutLimpio.split('').reverse().join('');
  const groups = reversed.match(/.{1,3}/g) || [];
  const withDotsReversed = groups.join('.');
  const withDots = withDotsReversed.split('').reverse().join('');

  return `${withDots}-${dv}`;
}