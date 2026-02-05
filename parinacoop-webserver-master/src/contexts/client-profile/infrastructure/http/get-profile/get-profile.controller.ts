import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  UnauthorizedException,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { UserRequest } from '@/utils/interfaces/user-request.interface';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrimitiveClient } from '@/contexts/client-profile/domain/models/Client';
import { GetProfileUseCase } from '@/contexts/client-profile/application/get-profile/get-profile.use-case';
import { ClientNotFoundError } from '@/contexts/client-profile/domain/client-not-found.exception';
import { Public } from '@/contexts/shared/decorators/public.decorator';

@ApiTags('Perfil de cliente')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('profile')
export class GetProfileController {
  constructor(private getProfileUseCase: GetProfileUseCase) {}

  // Ping público para comprobar registro del controlador
  @Public()
  @Get('ping')
  ping() {
    return { ok: true, context: 'client-profile' };
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Perfil de cliente encontrado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Perfil de cliente no encontrado',
  })
  @Get(':run')
  async run(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
  ): Promise<{ profile: PrimitiveClient } | never> {
    // Log inicial: quién pide qué
    console.debug('[GetProfileController] incoming request', {
      requestedRun: run,
      authUser: user,
    });

    // Permitir acceso cuando:
    // - el usuario autenticado coincide con el run solicitado, o
    // - el usuario tiene rol ADMIN
    const userRun = (user as any)?.run ?? null;
    const role = (user as any)?.role ?? (user as any)?.roles ?? null;

    const isSameUser = userRun === run;
    let isAdmin = false;
    if (role) {
      if (Array.isArray(role)) {
        isAdmin = role.map((r) => String(r).toUpperCase()).includes('ADMIN');
      } else {
        isAdmin = String(role).toUpperCase() === 'ADMIN';
      }
    }

    if (!isSameUser && !isAdmin) {
      console.warn('[GetProfileController] unauthorized access attempt', {
        requestedRun: run,
        authUser: user,
      });
      throw new UnauthorizedException('No tiene permitido ver este perfil');
    }

    try {
      const result = await this.getProfileUseCase.execute({ run });

      // Log resultado del use-case
      console.debug('[GetProfileController] use-case result', { run, result });

      if (!result || (result as any).profile == null) {
        // Devolvemos NotFound con cuerpo para facilitar debugging desde cliente/curl
        console.info('[GetProfileController] profile not found for run', run);
        throw new NotFoundException({ message: `Perfil no encontrado para run ${run}` });
      }

      return result as { profile: PrimitiveClient };
    } catch (error) {
      if (error instanceof ClientNotFoundError) {
        console.info('[GetProfileController] ClientNotFoundError', { run, message: error.message });
        throw new NotFoundException({ message: error.message });
      }

      console.error('[GetProfileController] Unexpected error', error);
      throw new InternalServerErrorException('Error al obtener perfil de cliente');
    }
  }
}