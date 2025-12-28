import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';

// ✅ pdfkit puede venir como default dependiendo del build
const PDFKitImport = require('pdfkit');
const PDFDocument = PDFKitImport?.default ?? PDFKitImport;

@Injectable()
export class DapPdfService {
  async solicitud(params: {
    dap: any;
    usuario?: { rut?: string; nombre?: string };
  }): Promise<Buffer> {
    const { dap, usuario } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    return this.renderToBuffer(doc, () => {
      doc.fontSize(14).text('SOLICITUD DE INGRESO DEPÓSITO A PLAZO', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10);
      doc.text(`N° Operación: ${dap?.id ?? '-'}`);
      doc.text(`Fecha ingreso: ${this.date(dap?.initial_date)}`);
      doc.moveDown();

      doc.fontSize(12).text('Datos del Solicitante');
      doc.fontSize(10);
      doc.text(`Rut Solicitante: ${usuario?.rut ?? '-'}`);
      doc.text(`Nombre Solicitante: ${usuario?.nombre ?? '-'}`);
      doc.moveDown();

      doc.fontSize(12).text('Datos del Depósito a Plazo');
      doc.fontSize(10);
      doc.text(`Tipo: ${dap?.type ?? '-'}`);
      doc.text(`Moneda: ${dap?.currency_type ?? '-'}`);
      doc.text(`Estado: ${dap?.status ?? '-'}`);
      doc.text(`Plazo (días): ${dap?.days ?? '-'}`);
      doc.text(`Monto Capital: ${this.money(dap?.initial_amount)}`);
      doc.text(`Monto a Recibir: ${this.money(dap?.final_amount)}`);
      doc.text(`Intereses: ${this.money(dap?.profit)}`);
      doc.text(`Tasa periodo: ${this.percent(dap?.interest_rate_in_period)}`);
      doc.text(`Tasa mensual: ${this.percent(dap?.interest_rate_in_month)}`);
      doc.text(`Vencimiento: ${this.date(dap?.due_date)}`);
    });
  }

  async instructivo(params: { dap: any; instructions: any }): Promise<Buffer> {
    const { dap, instructions } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    return this.renderToBuffer(doc, () => {
      doc.fontSize(14).text('INSTRUCTIVO DEPÓSITO A PLAZO', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text('Cuenta destino');
      doc.fontSize(10);
      doc.text(`Banco: ${instructions?.bankName ?? '-'}`);
      doc.text(`Tipo de cuenta: ${instructions?.accountType ?? '-'}`);
      doc.text(`N° de cuenta: ${instructions?.accountNumber ?? '-'}`);
      doc.text(`Titular: ${instructions?.accountHolderName ?? '-'}`);
      doc.text(`RUT titular: ${instructions?.accountHolderRut ?? '-'}`);
      doc.text(`Correo: ${instructions?.email ?? '-'}`);
      doc.moveDown();

      doc.fontSize(12).text('Instrucciones');
      doc.fontSize(10);
      doc.text(instructions?.description ?? '-');
      doc.moveDown();

      doc.fontSize(12).text('Resumen del depósito');
      doc.fontSize(10);
      doc.text(`Operación: ${dap?.id ?? '-'}`);
      doc.text(`Monto capital: ${this.money(dap?.initial_amount)}`);
      doc.text(`Plazo: ${dap?.days ?? '-'} días`);
      doc.text(`Vencimiento: ${this.date(dap?.due_date)}`);
      doc.text(`Monto a recibir: ${this.money(dap?.final_amount)}`);
    });
  }

  /**
   * ✅ Esta función es la clave: espera END del stream
   */
  private renderToBuffer(doc: any, draw: () => void): Promise<Buffer> {
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    doc.pipe(stream);

    return new Promise<Buffer>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', reject);
      doc.on('error', reject);

      // dibuja contenido y cierra
      try {
        draw();
        doc.end();
      } catch (e) {
        reject(e);
      }
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
