import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { DapRepository } from '../../domain/ports/dap.repository';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class GetDapPdfUseCase {
  constructor(private dapRepository: DapRepository) {}

  async execute(run: number, dapId: number): Promise<Buffer> {
    const daps = await this.dapRepository.getDapsByUserRun(run);
    const dap = daps.find((d) => d.toValue().id === dapId);

    if (!dap) {
      throw new Error('DAP no encontrado');
    }

    const data = dap.toValue();
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer<ArrayBufferLike>) => chunks.push(c));
    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    /* ===== CONTENIDO PDF ===== */

    doc.fontSize(16).text('SOLICITUD DE INGRESO', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).text('DEPÓSITO A PLAZO', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(11);
    doc.text(`Número de Operación: ${data.id}`);
    doc.text(`RUN Cliente: ${data.userRun}`);
    doc.text(`Fecha Ingreso: ${this.formatDate(data.initialDate)}`);
    doc.moveDown();

    doc.fontSize(12).text('Identificación del Depósito', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(11);
    doc.text(`Tipo: ${data.type}`);
    doc.text(`Moneda: ${data.currencyType}`);
    doc.text(`Plazo (días): ${data.days}`);
    doc.text(`Monto Capital: ${this.formatCurrency(data.initialAmount)}`);
    doc.text(`Intereses: ${this.formatCurrency(data.profit)}`);
    doc.text(`Monto a Recibir: ${this.formatCurrency(data.finalAmount)}`);
    doc.text(`Tasa Mensual: ${(data.interestRateInMonth * 100).toFixed(2)}%`);
    doc.text(`Tasa Período: ${(data.interestRateInPeriod * 100).toFixed(2)}%`);
    doc.text(`Fecha Vencimiento: ${this.formatDate(data.dueDate)}`);

    doc.moveDown(2);
    doc.text('Firma Cliente: ______________________________');
    doc.moveDown();
    doc.text('Fecha: ____ / ____ / ______');

    doc.end();
    return endPromise;
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${
      (d.getMonth() + 1).toString().padStart(2, '0')
    }/${d.getFullYear()}`;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(value);
  }
}
