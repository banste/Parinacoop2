import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class DapPdfService {
  /**
   * Genera el PDF de Solicitud de DAP
   */
  async solicitud(params: {
    dap: any;
    usuario?: { rut?: string; nombre?: string };
  }): Promise<Buffer> {
    const { dap, usuario } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    // ✅ la forma correcta con pdfkit
    doc.pipe(stream);

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));

    const resultPromise = new Promise<Buffer>((resolve, reject) => {
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      doc.on('error', reject);
    });

    // ===== CONTENIDO PDF (demo, tú lo adaptas al DOCX) =====
    doc.fontSize(14).text('SOLICITUD DE INGRESO DEPÓSITO A PLAZO', { align: 'center' });
    doc.moveDown();

    doc.fontSize(11).text(`RUT: ${usuario?.rut ?? '-'}`);
    doc.text(`Nombre: ${usuario?.nombre ?? '-'}`);
    doc.moveDown();

    doc.text(`DAP ID: ${dap?.id ?? '-'}`);
    doc.text(`Tipo: ${dap?.type ?? dap?.dap_type ?? '-'}`);
    doc.text(`Moneda: ${dap?.currency_type ?? dap?.currencyType ?? '-'}`);
    doc.text(`Plazo (días): ${dap?.days ?? dap?.term_days ?? '-'}`);
    doc.text(`Monto capital: ${this.money(dap?.initial_amount ?? dap?.initialAmount)}`);
    doc.text(`Intereses: ${this.money(dap?.profit)}`);
    doc.text(`Tasa mensual: ${this.percent(dap?.interest_rate_in_month ?? dap?.interestRateInMonth)}`);
    doc.text(`Vencimiento: ${this.date(dap?.due_date ?? dap?.dueDate)}`);

    // Cierra y “flush”
    doc.end();

    return resultPromise;
  }

  /**
   * Genera el PDF del Instructivo
   */
  async instructivo(params: { dap: any; instructions: any }): Promise<Buffer> {
    const { dap, instructions } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    doc.pipe(stream);
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));

    const resultPromise = new Promise<Buffer>((resolve, reject) => {
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      doc.on('error', reject);
    });

    // ===== CONTENIDO PDF (demo) =====
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

    doc.end();

    return resultPromise;
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
