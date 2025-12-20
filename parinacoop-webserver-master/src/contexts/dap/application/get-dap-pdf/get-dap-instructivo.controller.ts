import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@/contexts/shared/guards/auth.guard';
import * as PDFDocument from 'pdfkit';


@ApiTags('DAP de clientes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('clients/:run/daps')
export class GetDapInstructivoController {
  @Get('instructivo-pdf')
  async run(@Res() res: Response) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (c: Buffer<ArrayBufferLike>) => chunks.push(c));
    doc.on('end', () => {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=Instructivo_Deposito_DAP.pdf',
      );
      res.send(Buffer.concat(chunks));
    });

    doc.fontSize(16).text('INSTRUCTIVO DEPÓSITO A PLAZO', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(11).list([
      'Descargue la Solicitud de Depósito a Plazo.',
      'Firme la solicitud.',
      'Realice el depósito en la cuenta indicada.',
      'Guarde el comprobante de transferencia.',
      'Adjunte o entregue el comprobante según corresponda.',
    ]);

    doc.moveDown();
    doc.text('Cuenta de Depósito:');
    doc.text('Banco: __________________________');
    doc.text('Cuenta: _________________________');
    doc.text('RUT: ____________________________');
    doc.text('Glosa: DEPÓSITO A PLAZO');

    doc.end();
  }
}
