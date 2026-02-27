import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/contexts/shared/decorators/roles.decorator';
import { Role } from '@/contexts/shared/enums/roles.enum';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { RolesGuard } from '@/contexts/shared/guards/roles.guard';

import { DapRepository } from '@/contexts/dap/domain/ports/dap.repository';
import { ClientRepository } from '@/contexts/client-profile/domain/ports/client.repository';

@ApiTags('DAP (admin home)')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@UseGuards(AuthGuard, RolesGuard)
@Controller('admin/daps')
export class AdminDapHomeController {
  constructor(
    private readonly dapRepo: DapRepository,
    private readonly clientRepo: ClientRepository,
  ) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Datos para el home admin: (1) PENDING con attachments, (2) EXPIRED-PENDING (por cobrar), con datos del usuario',
  })
  @HttpCode(HttpStatus.OK)
  @Get('home')
  async home(): Promise<{
    pendingWithAttachments: any[];
    expiredPending: any[];
  }> {
    const pendingWithAttachments =
      typeof (this.dapRepo as any).adminListPendingWithAttachments === 'function'
        ? await (this.dapRepo as any).adminListPendingWithAttachments()
        : [];

    const expiredPending =
      typeof (this.dapRepo as any).adminListExpiredPending === 'function'
        ? await (this.dapRepo as any).adminListExpiredPending()
        : [];

    // enriquecer con perfil usuario (N+1, pero el home suele tener pocos)
    const enrich = async (rows: any[]) => {
      const cache = new Map<number, any>();

      return Promise.all(
        (rows ?? []).map(async (r: any) => {
          const run = Number(r?.userRun ?? r?.user_run ?? 0);
          if (!run) return { ...r, user: null };

          if (cache.has(run)) return { ...r, user: cache.get(run) };

          try {
            const profile = await this.clientRepo.getProfileByRun(run);
            const p: any = profile?.toValue?.() ?? null;
            const user = p
              ? {
                  run: p.run ?? run,
                  names: p.names ?? null,
                  firstLastName: p.firstLastName ?? null,
                  secondLastName: p.secondLastName ?? null,
                  email: p.email ?? null,
                  cellphone: p.cellphone ?? null,
                }
              : null;

            cache.set(run, user);
            return { ...r, user };
          } catch {
            cache.set(run, null);
            return { ...r, user: null };
          }
        }),
      );
    };

    return {
      pendingWithAttachments: await enrich(pendingWithAttachments),
      expiredPending: await enrich(expiredPending),
    };
  }
}