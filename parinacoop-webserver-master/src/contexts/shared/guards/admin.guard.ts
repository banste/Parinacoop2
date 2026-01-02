import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

/**
 * AdminGuard
 * - No tiene dependencias en el constructor (evitamos errores de inyección).
 * - Comprueba req.user que debe establecer el AuthGuard / estrategia JWT.
 * - Detecta admin por cualquiera de estas propiedades (ajusta si tu UserRequest usa otra):
 *    - user.role === 'admin' | 'ADMIN'
 *    - user.is_admin === true
 *    - user.isAdmin === true
 *    - user.roles is array and includes 'admin'
 *
 * Uso:
 *  @UseGuards(AuthGuard, AdminGuard)
 *  @Controller('admin/...')
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    const user = req?.user ?? null;

    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    const isAdmin =
      user.role === 'admin' ||
      user.role === 'ADMIN' ||
      user.is_admin === true ||
      user.isAdmin === true ||
      (Array.isArray(user.roles) && user.roles.includes('admin'));

    if (!isAdmin) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}