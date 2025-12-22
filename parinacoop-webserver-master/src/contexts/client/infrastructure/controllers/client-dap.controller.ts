import { Controller, Get, NotFoundException, Param, ParseIntPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { DapInstructionsRepository } from '@/database/repositories/dap-instructions.repository';
import { DapRepository } from '@/database/repositories/dap.repository';
import { DapPdfService } from 'src/archives/pdf/dap-pdf.service';

@Controller()
export class ClientDapController {
  constructor(
    private readonly instrRepo: DapInstructionsRepository,
    private readonly dapRepo: DapRepository,
    private readonly pdf: DapPdfService,
  ) {}

  // ✅ cliente obtiene cuenta destino + instructivo
  @Get('dap-instructions')
  async getInstructions() {
    const row = await this.instrRepo.getLatest();
    if (!row) throw new NotFoundException('No hay configuración de DAP');

    return {
      bankName: row.bank_name,
      accountType: row.account_type,
      accountNumber: row.account_number,
      accountHolderName: row.account_holder_name,
      accountHolderRut: row.account_holder_rut,
      email: row.email,
      description: row.description,
      updatedAt: row.updated_at,
    };
  }

  // ✅ solicitud PDF (usa user_run + dapId(id))
  @Get('clients/:userRun/daps/:dapId/solicitud-pdf')
  async solicitudPdf(
    @Param('userRun', ParseIntPipe) userRun: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Res() res: Response,
  ) {
    const dap = await this.dapRepo.findByIdAndUserRun(dapId, userRun);
    if (!dap) throw new NotFoundException('DAP no encontrado');

    // Si luego quieres poner rut/nombre real, aquí se consulta a tu tabla de usuario/cliente.
    const buffer = this.pdf.solicitud({
      dap,
      usuario: { rut: String(userRun), nombre: '' },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="solicitud-dap-${dapId}.pdf"`);
    return res.send(buffer);
  }

  // ✅ instructivo PDF (usa instrucciones + resumen DAP)
  @Get('clients/:userRun/daps/:dapId/instructivo-pdf')
  async instructivoPdf(
    @Param('userRun', ParseIntPipe) userRun: number,
    @Param('dapId', ParseIntPipe) dapId: number,
    @Res() res: Response,
  ) {
    const dap = await this.dapRepo.findByIdAndUserRun(dapId, userRun);
    if (!dap) throw new NotFoundException('DAP no encontrado');

    const instr = await this.instrRepo.getLatest();
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

    const buffer = this.pdf.instructivo({ dap, instructions });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="instructivo-dap-${dapId}.pdf"`);
    return res.send(buffer);
  }
}
