export function rutToNumber(rut: string): number {
  // Elimina puntos, guión y retorna todo como número
  return Number(rut.replace(/[.-]/g, ''));
}