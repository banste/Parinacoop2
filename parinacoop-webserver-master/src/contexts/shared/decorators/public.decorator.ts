import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'authorization';

/**
 * Decorador que permite que ciertas rutas de un controlador pueda saltearse el AuthGuard
 * @returns
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
