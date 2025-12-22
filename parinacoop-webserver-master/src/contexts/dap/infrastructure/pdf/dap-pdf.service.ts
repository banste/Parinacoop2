import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class DapPdfService {
  async solicitud(params: { dap: any; usuario?: { rut?: string; nombre?: string } }): Promise<Buffer> {
    const { dap, usuario } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c: any) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      // ======== TU CONTENIDO PDF ========
      doc.fontSize(14).text('SOLICITUD DE INGRESO DEPÓSITO A PLAZO', { align: 'center' });
      doc.moveDown();

      doc.fontSize(11).text(`RUT: ${usuario?.rut ?? '-'}`);
      doc.text(`Nombre: ${usuario?.nombre ?? '-'}`);
      doc.moveDown();

      doc.text(`DAP ID: ${dap?.id ?? '-'}`);
      doc.text(`Tipo: ${dap?.type ?? '-'}`);
      doc.text(`Moneda: ${dap?.currency_type ?? '-'}`);
      doc.text(`Plazo (días): ${dap?.days ?? '-'}`);
      doc.text(`Monto capital: ${this.money(dap?.initial_amount)}`);
      doc.text(`Intereses: ${this.money(dap?.profit)}`);
      doc.text(`Tasa mensual: ${this.percent(dap?.interest_rate_in_month)}`);
      doc.text(`Vencimiento: ${this.date(dap?.due_date)}`);

      // ================================
      doc.end();
    });
  }

  async instructivo(params: { dap: any; instructions: any }): Promise<Buffer> {
    const { dap, instructions } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (c: any) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));

      // ======== TU CONTENIDO PDF ========
      doc.fontSize(14).text('INSTRUCTIVO DEPÓSITO A PLAZO', { align: 'center' });
      doc.moveDown();

      doc.fontSize(11).text(`DAP ID: ${dap?.id ?? '-'}`);
      doc.moveDown();

      doc.text(`Banco: ${instructions?.bankName ?? '-'}`);
      doc.text(`Tipo cuenta: ${instructions?.accountType ?? '-'}`);
      doc.text(`N° cuenta: ${instructions?.accountNumber ?? '-'}`);
      doc.text(`Titular: ${instructions?.accountHolderName ?? '-'}`);
      doc.text(`RUT Titular: ${instructions?.accountHolderRut ?? '-'}`);
      doc.text(`Email: ${instructions?.email ?? '-'}`);
      doc.moveDown();

      doc.text('Descripción:', { underline: true });
      doc.moveDown(0.5);
      doc.text(`${instructions?.description ?? '-'}`);

      // ================================
      doc.end();
    });
  }

  private money(n: any) {
    const num = Number(n);
    if (Number.isNaN(num)) return String(n ?? '-');
    return num.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  }

  private percent(n: any) {
    const num = Number(n);
    if (Number.isNaN(num)) return String(n ?? '-');
    return `${(num * 100).toFixed(2)}%`;
  }

  private date(d: any) {
    if (!d) return '-';
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toISOString().slice(0, 10);
  }
}
