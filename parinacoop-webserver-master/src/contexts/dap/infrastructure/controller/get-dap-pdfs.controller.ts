import {
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import { User } from '@/contexts/shared/decorators/user.decorator';
import { UserRequest } from '@/utils/interfaces/user-request.interface';

import { DapRepository } from '../../domain/ports/dap.repository';
import { DapInstructionsRepository } from '@/database/repositories/dap-instructions.repository';
import { DapPdfService } from '@/archives/pdf/dap-pdf.service';
import { DapInstructionsStore } from '../dap-instructions.store';

// Usamos el repositorio de perfil de cliente para obtener el nombre exacto que guarda la app
import { ClientRepository } from '@/contexts/client-profile/domain/ports/client.repository';

/**
 * Helpers para RUT (módulo 11)
 */
function computeRutDV(runNumber: number | string): string {
  let n = Number(String(runNumber).replace(/\D/g, ''));
  let m = 2;
  let s = 0;
  while (n > 0) {
    s += (n % 10) * m;
    n = Math.floor(n / 10);
    m = m === 7 ? 2 : m + 1;
  }
  const r = 11 - (s % 11);
  if (r === 11) return '0';
  if (r === 10) return 'K';
  return String(r);
}

function formatRutWithDv(runNumber: number | string, withDots = true): string {
  const digits = String(runNumber).replace(/\D/g, '');
  const dv = computeRutDV(digits);
  if (!withDots) return `${digits}-${dv}`;
  const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

@ApiTags('DAP PDFs (clientes)')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('clients')
export class GetDapPdfsController {
  constructor(
    private readonly dapRepository: DapRepository,
    private readonly dapInstructionsRepository: DapInstructionsRepository,
    private readonly dapPdfService: DapPdfService,
    private readonly dapInstructionsStore: DapInstructionsStore,
    private readonly clientRepository: ClientRepository, // INYECTAMOS client repository
  ) {}

  @ApiResponse({ status: HttpStatus.OK, description: 'Descarga PDF Solicitud del DAP' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No tiene permitido descargar PDF de este cliente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'DAP no encontrado' })
  @Get(':run/daps/:dapId/solicitud-pdf')
  async solicitudPdf(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Res() res: FastifyReply,
  ) {
    if (Number(user.run) !== run) {
      throw new UnauthorizedException('No está autorizado');
    }

    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new NotFoundException('DAP no encontrado');

    const dap: any =
      typeof (dapEntity as any)?.toValue === 'function' ? (dapEntity as any).toValue() : dapEntity;

    // Obtener el perfil del cliente y componer nombre
    let nombre = '-';
    try {
      const profileEntity = await this.clientRepository.getProfileByRun(run);
      if (profileEntity) {
        const p: any = typeof (profileEntity as any)?.toValue === 'function'
          ? (profileEntity as any).toValue()
          : profileEntity;
        // profile tiene: names, firstLastName, secondLastName (según Profile.ts y SQL del repo)
        const a = p?.names ?? '';
        const b = p?.firstLastName ?? p?.first_last_name ?? '';
        const c = p?.secondLastName ?? p?.second_last_name ?? '';
        const composed = [a, b, c].filter(Boolean).join(' ').trim();
        if (composed) nombre = composed;
      }
    } catch (e) {
      console.warn('No se pudo obtener perfil cliente para nombre en PDF', e);
    }

    // formatear RUT con DV (la DB guarda el número sin DV)
    const rutConDv = formatRutWithDv(run, true); // true -> con puntos

    const buffer = await this.dapPdfService.solicitud({
      dap,
      usuario: { rut: rutConDv, nombre },
    });

    // Debug opcional
    // eslint-disable-next-line no-console
    console.log('[solicitudPdf] bytes=', buffer?.length ?? -1, 'head=', buffer?.subarray(0, 8)?.toString('hex'));

    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename="solicitud-dap-${dapId}.pdf"`);
    return res.send(buffer);
  }

  @ApiResponse({ status: HttpStatus.OK, description: 'Descarga PDF Instructivo del DAP' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'No tiene permitido descargar PDF de este cliente' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'DAP o configuración no encontrada' })
  @Get(':run/daps/:dapId/instructivo-pdf')
  async instructivoPdf(
    @User() user: UserRequest,
    @Param('run', ParseIntPipe) run: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Res() res: FastifyReply,
  ) {
    if (Number(user.run) !== run) {
      throw new UnauthorizedException('No está autorizado');
    }

    const dapEntity = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dapEntity) throw new NotFoundException('DAP no encontrado');

    const dap: any =
      typeof (dapEntity as any)?.toValue === 'function' ? (dapEntity as any).toValue() : dapEntity;

    // Leer la última configuración desde la BD (sin fallback a store)
    const instrRow = await this.dapInstructionsRepository.getLatest();

    // Log crudo del row devuelto por repo (útil para comparar con GET /dap-instructions)
    // eslint-disable-next-line no-console
    console.debug('[instructivoPdf] instrRow (raw DB row) =', instrRow);

    if (!instrRow) {
      // Evitar usar store con datos posiblemente obsoletos: requerimos configuración en DB
      throw new NotFoundException('No hay configuración de DAP para generar instructivo');
    }

    const instructions = {
      bankName: instrRow.bank_name ?? instrRow.bankName,
      accountType: instrRow.account_type ?? instrRow.accountType,
      accountNumber: instrRow.account_number ?? instrRow.accountNumber,
      accountHolderName: instrRow.account_holder_name ?? instrRow.accountHolderName,
      accountHolderRut: instrRow.account_holder_rut ?? instrRow.accountHolderRut,
      email: instrRow.email,
      description: instrRow.description,
    };

    // Log final que pasamos al generador de PDF
    // eslint-disable-next-line no-console
    console.debug('[instructivoPdf] instructions passed to DapPdfService =', instructions);

    const buffer = await this.dapPdfService.instructivo({ dap, instructions });

    // Debug útil (puedes borrar después)
    // eslint-disable-next-line no-console
    console.log('[instructivoPdf] bytes=', buffer?.length ?? -1, 'head=', buffer?.subarray(0, 8)?.toString('hex'));

    res.header('Content-Type', 'application/pdf');
    res.header('Content-Disposition', `attachment; filename="instructivo-dap-${dapId}.pdf"`);
    return res.send(buffer);
  }
}