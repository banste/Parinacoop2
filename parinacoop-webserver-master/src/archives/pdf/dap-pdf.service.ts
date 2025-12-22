import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

@Injectable()
export class DapPdfService {
  solicitud(params: { dap: any; usuario?: { rut?: string; nombre?: string } }) {
    const { dap, usuario } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: any) => chunks.push(c as Buffer));

    doc.fontSize(14).text('SOLICITUD DE INGRESO DEPÓSITO A PLAZO', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`N° Operación: ${dap.id}`);
    doc.text(`Fecha ingreso: ${this.date(dap.initial_date)}`);
    doc.moveDown();

    doc.fontSize(12).text('Datos del Solicitante');
    doc.fontSize(10);
    doc.text(`Rut Solicitante: ${usuario?.rut ?? '-'}`);
    doc.text(`Nombre Solicitante: ${usuario?.nombre ?? '-'}`);
    doc.moveDown();

    doc.fontSize(12).text('Datos del Depósito a Plazo');
    doc.fontSize(10);
    doc.text(`Tipo de Depósito: ${dap.type}`);
    doc.text(`Moneda: ${dap.currency_type}`);
    doc.text(`Estado: ${dap.status}`);
    doc.text(`Plazo (días): ${dap.days}`);
    doc.text(`Monto Capital: ${this.money(dap.initial_amount)}`);
    doc.text(`Monto a Recibir: ${this.money(dap.final_amount)}`);
    doc.text(`Intereses: ${this.money(dap.profit)}`);
    doc.text(`Tasa periodo: ${this.percent(dap.interest_rate_in_period)}`);
    doc.text(`Tasa mensual: ${this.percent(dap.interest_rate_in_month)}`);
    doc.text(`Fecha vencimiento: ${this.date(dap.due_date)}`);
    doc.moveDown();

    doc.fontSize(9).text(
      'Forma de pago: El pago de intereses y capital se realizará de acuerdo a la información registrada en el sistema.',
      { align: 'justify' },
    );

    doc.end();
    return Buffer.concat(chunks);
  }

  instructivo(params: { dap: any; instructions: any }) {
    const { dap, instructions } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: any) => chunks.push(c as Buffer));

    doc.fontSize(14).text('INSTRUCTIVO DEPÓSITO A PLAZO', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text('Cuenta destino');
    doc.fontSize(10);
    doc.text(`Banco: ${instructions.bankName ?? '-'}`);
    doc.text(`Tipo de cuenta: ${instructions.accountType ?? '-'}`);
    doc.text(`N° de cuenta: ${instructions.accountNumber ?? '-'}`);
    doc.text(`Titular: ${instructions.accountHolderName ?? '-'}`);
    doc.text(`RUT titular: ${instructions.accountHolderRut ?? '-'}`);
    doc.text(`Correo: ${instructions.email ?? '-'}`);
    doc.moveDown();

    doc.fontSize(12).text('Instrucciones');
    doc.fontSize(10);
    doc.text(instructions.description ?? '-');
    doc.moveDown();

    doc.fontSize(12).text('Resumen del depósito');
    doc.fontSize(10);
    doc.text(`Operación: ${dap.id}`);
    doc.text(`Monto capital: ${this.money(dap.initial_amount)}`);
    doc.text(`Plazo: ${dap.days} días`);
    doc.text(`Vencimiento: ${this.date(dap.due_date)}`);
    doc.text(`Monto a recibir: ${this.money(dap.final_amount)}`);

    doc.end();
    return Buffer.concat(chunks);
  }

  private money(n: any) {
    const num = Number(n);
    if (Number.isNaN(num)) return String(n ?? '-');
    return num.toLocaleString('es-CL', { maximumFractionDigits: 0 });
  }

  private percent(n: any) {
    const num = Number(n);
    if (Number.isNaN(num)) return String(n ?? '-');
    // tus tasas parecen venir como 0.0040 -> 0.40%
    return `${(num * 100).toFixed(2)}%`;
  }

  private date(d: any) {
    if (!d) return '-';
    // si ya es Date, ok; si es string, también
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    return dt.toISOString().slice(0, 10);
  }
}
