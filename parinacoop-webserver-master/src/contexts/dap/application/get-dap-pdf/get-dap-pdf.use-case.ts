import { Injectable } from '@/contexts/shared/dependency-injection/injectable';
import { DapRepository } from '../../domain/ports/dap.repository';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class GetDapPdfUseCase {
  constructor(private dapRepository: DapRepository) {}

  async execute(run: number, dapId: number): Promise<Buffer> {
    const daps = await this.dapRepository.getDapsByUserRun(run);
    const dapEntity = daps.find((d) => {
      const v = (d as any).toValue();
      return v?.id === dapId || Number(v?.id) === dapId;
    });

    if (!dapEntity) {
      throw new Error('DAP no encontrado');
    }

    // tratar como any para poder leer distintas variantes de nombres de campo
    const data: any = dapEntity.toValue();
    console.log('[GetDapPdfUseCase] data from dap.toValue():', JSON.stringify(data ?? {}, null, 2));
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    /* ===== HEADER ===== */
    doc.font('Helvetica-Bold').fontSize(16).text('SOLICITUD DE INGRESO', {
      align: 'center',
    });
    doc.moveDown(0.2);
    doc.fontSize(14).text('DEPÓSITO A PLAZO', {
      align: 'center',
    });
    doc.moveDown(1.0);

    const leftX = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const halfWidth = pageWidth / 2;

    doc.font('Helvetica').fontSize(11);
    const infoY = doc.y;

    // Left column
    doc.text(`Número de Operación`, leftX, infoY);
    doc.font('Helvetica-Bold').text(`  ${this.padId(data.id ?? data.dap_id ?? '-')}`, leftX, doc.y);
    doc.moveDown(0.3);

    doc.font('Helvetica').text(`Fecha Ingreso`, leftX);
    doc.font('Helvetica-Bold').text(
      `  ${this.formatDate(data.initialDate ?? data.initial_date)}`,
      { continued: false },
    );
    doc.moveDown(0.3);

    // Right column
    const rightColX = leftX + halfWidth;
    doc.y = infoY;
    doc.font('Helvetica').text(`Rut Solicitante`, rightColX);
    doc.font('Helvetica-Bold').text(
      `  ${data.userRun ?? data.user_run ?? data.run ?? '-'}`,
      rightColX,
    );
    doc.moveDown(0.3);

    doc.font('Helvetica').text(`Nombre`, rightColX);
    doc.font('Helvetica-Bold').text(
      `  ${this.getUserNameFromData(data) ?? '-'}`,
      { continued: false },
    );

    // underline divider
    doc.moveDown(1);
    const underlineY = doc.y;
    doc.moveTo(leftX, underlineY).lineTo(leftX + pageWidth, underlineY).stroke();

    doc.moveDown(0.8);

    /* ===== TABLE ===== */
    const tableTop = doc.y;
    const tableLeft = leftX;
    const tableWidth = pageWidth;
    // column widths
    const colWidths = [
      0.18 * tableWidth, // Tipo de Depósito
      0.08 * tableWidth, // Tipo Moneda
      0.08 * tableWidth, // Plazo (días)
      0.14 * tableWidth, // Monto Capital
      0.14 * tableWidth, // Monto Rescate
      0.08 * tableWidth, // Tasa Base
      0.08 * tableWidth, // Tasa Período
      0.12 * tableWidth, // Fecha Vencimiento
    ];
    // last column (intereses) takes remaining
    const used = colWidths.reduce((s, w) => s + w, 0);
    colWidths.push(tableWidth - used);

    const headerHeight = 22;
    const rowHeight = 26;
    const tableHeight = headerHeight + rowHeight;

    // outer box
    doc.rect(tableLeft, tableTop, tableWidth, tableHeight).stroke();

    // Draw headers
    let x = tableLeft;
    doc.fontSize(10).font('Helvetica-Bold');
    const headers = [
      'Tipo de Depósito',
      'Tipo Moneda',
      'Plazo (Días)',
      'Monto Capital',
      'Monto Rescate',
      'Tasa Base',
      'Tasa Período',
      'Fecha Vencimiento',
      'Intereses',
    ];
    for (let i = 0; i < colWidths.length; i++) {
      const w = colWidths[i];
      const headerX = x + 4;
      const headerY = tableTop + 6;
      doc.text(headers[i] ?? '', headerX, headerY, { width: w - 8, align: 'center' });
      x += w;
      if (i < colWidths.length - 1) {
        doc.moveTo(x, tableTop).lineTo(x, tableTop + tableHeight).stroke();
      }
    }

    // Values row (usar múltiples aliases por compatibilidad)
    doc.font('Helvetica').fontSize(10);
    let valueX = tableLeft;
    const values = [
      data.type ?? data.dap_type ?? '-',
      data.currencyType ?? data.currency_type ?? data.currency ?? '-',
      (data.days ?? data.term_days ?? '-')?.toString() ?? '-',
      this.formatCurrency(data.initialAmount ?? data.initial_amount ?? 0),
      this.formatCurrency(data.finalAmount ?? data.final_amount ?? 0),
      this.formatPercent(
        data.interestRateBase ??
          data.interest_rate_base ??
          data.interestRateInMonth ??
          data.interest_rate_in_month,
      ),
      this.formatPercent(
        data.interestRateInPeriod ??
          data.interest_rate_in_period ??
          data.interestRateInPeriod,
      ),
      this.formatDate(data.dueDate ?? data.due_date),
      this.formatCurrency(data.profit ?? data.interest ?? data.profitAmount ?? data.profit_amount ?? 0),
    ];

    const valueY = tableTop + headerHeight + 6;
    for (let i = 0; i < colWidths.length; i++) {
      const w = colWidths[i];
      doc.text(values[i] ?? '-', valueX + 4, valueY, { width: w - 8, align: 'center' });
      valueX += w;
    }

    doc.moveDown(3);

    // Footer text
    doc.fontSize(11).text(
      'Forma de Pago: con transferencia bancaria a la cuenta del solicitante, según las instrucciones indicadas.',
    );
    doc.moveDown(1);
    doc.fontSize(10).text(
      'En caso de los Depósitos a Plazo Renovables el solicitante tendrá 3 días hábiles desde la fecha del vencimiento para cobrar el Depósito a Plazo en caso contrario, se capitalizaran los intereses y se renovara por el mismo periodo a la tasa del momento.',
    );

    doc.moveDown(4);
    const sigX = leftX + (tableWidth / 2) - 120;
    doc.text('____________________________________', sigX);
    doc.text('Firma Cliente', sigX + 40);

    doc.moveDown(6);
    doc.font('Helvetica').fontSize(10).text('Cooperativa de Ahorro y Crédito', { align: 'center' });
    doc.text('De Arica y Parinacota Ltda', { align: 'center' });

    doc.end();
    return endPromise;
  }

  private padId(id: any): string {
    if (id == null) return '-';
    return String(id).padStart(3, '0');
  }

  private getUserNameFromData(data: any): string | undefined {
    return data.userName ?? data.user_name ?? data.user?.name ?? data.profile?.names;
  }

  private formatDate(date: any): string {
    if (!date) return '-';
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${
      (d.getMonth() + 1).toString().padStart(2, '0')
    }/${d.getFullYear()}`;
  }

  private formatCurrency(value: any): string {
    const v = Number(value ?? 0);
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(v);
  }

  private formatPercent(value: any): string {
    if (value == null || value === '') return '-';
    const v = Number(value);
    if (Number.isNaN(v)) return '-';
    const shown = Math.abs(v) < 1 ? (v * 100).toFixed(2) : v.toFixed(2);
    return shown + '%';
  }
  
}