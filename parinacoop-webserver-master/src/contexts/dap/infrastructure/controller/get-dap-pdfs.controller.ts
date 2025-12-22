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

// ✅ IMPORTANTE: usar el PORT (porque el módulo lo provee con useClass)
import { DapRepository } from '../../domain/ports/dap.repository';

import { DapInstructionsRepository } from '@/database/repositories/dap-instructions.repository';
import { DapPdfService } from '@/archives/pdf/dap-pdf.service';

@ApiTags('DAP PDFs (clientes)')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('clients')
export class GetDapPdfsController {
  constructor(
    private readonly dapRepository: DapRepository,
    private readonly dapInstructionsRepository: DapInstructionsRepository,
    private readonly dapPdfService: DapPdfService,
  ) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Descarga PDF Solicitud del DAP',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No tiene permitido descargar PDF de este cliente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'DAP no encontrado',
  })
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

    const dap = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dap) throw new NotFoundException('DAP no encontrado');

    const buffer = await Promise.resolve(
      this.dapPdfService.solicitud({
        dap,
        usuario: { rut: String(run), nombre: '' },
      }),
    );

    return res
      .header('Content-Type', 'application/pdf')
      .header(
        'Content-Disposition',
        `attachment; filename="solicitud-dap-${dapId}.pdf"`,
      )
      .send(buffer);
  }

  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Descarga PDF Instructivo del DAP',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'No tiene permitido descargar PDF de este cliente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'DAP o configuración no encontrada',
  })
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

    const dap = await this.dapRepository.findByIdAndUserRun(dapId, run);
    if (!dap) throw new NotFoundException('DAP no encontrado');

    const instr = await this.dapInstructionsRepository.getLatest();
    if (!instr) throw new NotFoundException('No hay configuración de DAP');

    const instructions = {
      bankName: instr.bank_name,
      accountType: instr.account_type,
      accountNumber: instr.account_number,
      accountHolderName: instr.account_holder_name,
      accountHolderRut: instr.account_holder_rut,
      email: instr.email,
      description: instr.description,
    };

    const buffer = await Promise.resolve(
      this.dapPdfService.instructivo({ dap, instructions }),
    );

    return res
      .header('Content-Type', 'application/pdf')
      .header(
        'Content-Disposition',
        `attachment; filename="instructivo-dap-${dapId}.pdf"`,
      )
      .send(buffer);
  }
}
