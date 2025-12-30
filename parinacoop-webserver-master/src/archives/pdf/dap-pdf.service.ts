import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

@Injectable()
export class DapPdfService {
  async solicitud(params: {
    dap: any;
    usuario?: { rut?: string; nombre?: string };
  }): Promise<Buffer> {
    const { dap, usuario } = params;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    // Intentar registrar Calibri si está disponible en el sistema.
    // Si no se encuentra, usamos los fonts nativos (Helvetica).
    try {
      const tryPaths = (paths: string[]) => {
        for (const p of paths) {
          try {
            if (p && fs.existsSync(p)) return p;
          } catch (e) {
            // ignore
          }
        }
        return null;
      };

      const calibriPath = tryPaths([
        'C:\\Windows\\Fonts\\calibri.ttf',
        'C:\\Windows\\Fonts\\Calibri.ttf',
        '/usr/share/fonts/truetype/msttcorefonts/Calibri.ttf',
        '/usr/share/fonts/truetype/msttcorefonts/calibri.ttf',
        '/usr/share/fonts/truetype/calibri.ttf',
        '/Library/Fonts/Calibri.ttf',
      ]);
      const calibriBoldPath = tryPaths([
        'C:\\Windows\\Fonts\\calibrib.ttf',
        '/usr/share/fonts/truetype/msttcorefonts/Calibri_Bold.ttf',
        '/usr/share/fonts/truetype/calibrib.ttf',
        '/Library/Fonts/Calibri Bold.ttf',
      ]);

      if (calibriPath) {
        doc.registerFont('Calibri', calibriPath);
      }
      if (calibriBoldPath) {
        doc.registerFont('Calibri-Bold', calibriBoldPath);
      }
    } catch (e) {
      // no bloquear si falla el registro de fuentes
      // eslint-disable-next-line no-console
      console.warn('No se pudieron registrar fuentes Calibri, usando fallback', e);
    }

    doc.pipe(stream);
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));

    const resultPromise = new Promise<Buffer>((resolve, reject) => {
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      doc.on('error', reject);
    });

    // Helpers
    const money = (n: any) => {
      const v = Number(n ?? 0);
      if (Number.isNaN(v)) return '-';
      return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(v);
    };
    const pct = (n: any) => {
      if (n == null || n === '') return '-';
      const v = Number(n);
      if (Number.isNaN(v)) return String(n ?? '-');
      const shown = Math.abs(v) < 1 ? (v * 100).toFixed(2) : v.toFixed(2);
      return `${shown}%`;
    };
    const fmtDate = (d: any) => {
      if (!d) return '-';
      const dt = d instanceof Date ? d : new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      const dd = dt.getDate().toString().padStart(2, '0');
      const mm = (dt.getMonth() + 1).toString().padStart(2, '0');
      const yy = dt.getFullYear();
      return `${dd}/${mm}/${yy}`;
    };
    const safe = (obj: any, ...keys: string[]) => {
      if (!obj) return undefined;
      for (const k of keys) if (obj[k] !== undefined) return obj[k];
      return undefined;
    };

    // normalize fields
    const data: any = dap ?? {};
    const id = safe(data, 'id', 'dap_id') ?? '-';
    const userRun = safe(data, 'userRun', 'user_run', 'run') ?? usuario?.rut ?? '-';
    const initialDate = safe(data, 'initialDate', 'initial_date') ?? null;
    const dapType = safe(data, 'type', 'dap_type') ?? '-';
    const currency = safe(data, 'currencyType', 'currency_type', 'currency') ?? '-';
    const days = safe(data, 'days', 'term_days') ?? '-';
    const initialAmount = safe(data, 'initialAmount', 'initial_amount') ?? 0;
    const finalAmount = safe(data, 'finalAmount', 'final_amount') ?? 0;
    const profit = safe(data, 'profit', 'interest', 'profitAmount', 'profit_amount') ?? 0;
    const rateMonth = safe(data, 'interestRateInMonth', 'interest_rate_in_month') ?? null;
    const ratePeriod = safe(data, 'interestRateInPeriod', 'interest_rate_in_period') ?? null;
    const dueDate = safe(data, 'dueDate', 'due_date') ?? null;

    const nombreSolicitante =
      usuario?.nombre ||
      safe(data, 'userName', 'user_name', 'name', 'nombre') ||
      (data?.user && (data.user.name ?? data.user.fullName ?? data.user.nombre)) ||
      (data?.profile && (data.profile.names ?? data.profile.name ?? data.profile.nombre)) ||
      safe(data, 'names', 'fullName', 'full_name') ||
      '-';

    // Decide font names (fall back to Helvetica if Calibri not registered)
    const fontRegular = (doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica';
    const fontBold = (doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold';

    // HEADER
    doc.font(fontBold).fontSize(16).text('SOLICITUD DE INGRESO', { align: 'center' });
    doc.moveDown(0.1);
    doc.fontSize(14).text('DEPÓSITO A PLAZO', { align: 'center' });
    doc.moveDown(1.0);

    // TOP INFO
    const left = doc.page.margins.left;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / 2;

    doc.fontSize(10).font(fontRegular);
    const topY = doc.y;

    // Left
    doc.text('Número de Operación', left, topY, { width: colWidth, align: 'left' });
    doc.font(fontBold).text(`  ${String(id).padStart(3, '0')}`, left, doc.y, { width: colWidth, align: 'left' });
    doc.moveDown(0.15);
    doc.font(fontRegular).text('Fecha Ingreso', left, doc.y, { width: colWidth, align: 'left' });
    doc.font(fontBold).text(`  ${fmtDate(initialDate)}`, left, doc.y, { width: colWidth, align: 'left' });

    // Right
    doc.y = topY;
    const rightX = left + colWidth;
    doc.font(fontRegular).text('Rut Solicitante', rightX, topY, { width: colWidth, align: 'left' });
    doc.font(fontBold).text(`  ${userRun}`, rightX, doc.y, { width: colWidth, align: 'left' });
    doc.moveDown(0.15);
    doc.font(fontRegular).text('Nombre', rightX, doc.y, { width: colWidth, align: 'left' });
    doc.font(fontBold).text(`  ${nombreSolicitante}`, rightX, doc.y, { width: colWidth, align: 'left' });

    // Divider
    doc.moveDown(0.8);
    const dividerY = doc.y;
    doc.save();
    doc.moveTo(left, dividerY).lineTo(left + pageWidth, dividerY).lineWidth(1).stroke();
    doc.restore();
    doc.moveDown(0.8);

    // Section title (alineado a la izquierda)
    doc.font(fontRegular).fontSize(12).text('Identificación del Depósito', left, doc.y, { width: pageWidth, align: 'left' });
    doc.moveDown(0.6);

    // TABLE
    const tableLeft = left;
    const tableTop = doc.y;
    const tableWidth = pageWidth;
    const colProportions = [0.18, 0.08, 0.08, 0.14, 0.14, 0.08, 0.08, 0.12, 0.1];
    const colWidths = colProportions.map((p) => Math.floor(p * tableWidth));
    const usedW = colWidths.reduce((a, b) => a + b, 0);
    if (usedW < tableWidth) colWidths[colWidths.length - 1] += (tableWidth - usedW);

    // headerHeight (títulos) aumentado; rowHeight (valores) moderado
    const headerHeight = 42;
    const rowHeight = 40;
    const tableHeight = headerHeight + rowHeight;

    // outer rect
    doc.rect(tableLeft, tableTop, tableWidth, tableHeight).lineWidth(0.8).stroke();

    // header background (subtle)
    doc.save();
    doc.rect(tableLeft, tableTop, tableWidth, headerHeight).fillOpacity(0.06).fill('#000');
    doc.restore();

    // headers (Calibri 10.5 / fallback), centered
    doc.font(fontBold).fontSize(10.5);
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

    let cursorX = tableLeft;
    for (let i = 0; i < colWidths.length; i++) {
      const w = colWidths[i];
      doc.fillColor('#000').text(headers[i], cursorX + 4, tableTop + 8, { width: w - 8, align: 'center' });
      cursorX += w;
      if (i < colWidths.length - 1) {
        doc.moveTo(cursorX, tableTop).lineTo(cursorX, tableTop + tableHeight).lineWidth(0.7).stroke();
      }
    }

    // values row: USAR fuente regular (Calibri 10) y centrar verticalmente
    doc.font(fontRegular).fontSize(10);
    const values = [
      dapType,
      currency,
      String(days),
      money(initialAmount),
      money(finalAmount),
      (rateMonth != null ? pct(rateMonth) : '-'),
      (ratePeriod != null ? pct(ratePeriod) : '-'),
      fmtDate(dueDate),
      money(profit),
    ];

    // separator between header and values
    doc.moveTo(tableLeft, tableTop + headerHeight).lineTo(tableLeft + tableWidth, tableTop + headerHeight).lineWidth(0.7).stroke();

    let cellX = tableLeft;
    // vertical centering (consider font size 10)
    const valueFontSize = 10;
    const valueY = tableTop + headerHeight + Math.floor((rowHeight - valueFontSize) / 2);
    for (let i = 0; i < colWidths.length; i++) {
      const w = colWidths[i];
      // Solo primera columna (tipo) la dejamos en negrita si quieres destacar:
      if (i === 0) {
        doc.font(fontBold).fontSize(valueFontSize).text(values[i] ?? '-', cellX + 4, valueY, { width: w - 8, align: 'center' });
      } else {
        doc.font(fontRegular).fontSize(valueFontSize).text(values[i] ?? '-', cellX + 4, valueY, { width: w - 8, align: 'center' });
      }
      cellX += w;
    }

    // Info párrafos ancho completo
    doc.moveDown((tableHeight / 12) + 1);
    doc.font(fontRegular).fontSize(10);
    doc.text(
      'Forma de Pago: con transferencia bancaria a la cuenta del solicitante, según las instrucciones indicadas.',
      left,
      doc.y,
      { width: pageWidth, align: 'left' },
    );
    doc.moveDown(1);
    doc.text(
      'En caso de los Depósitos a Plazo Renovables el solicitante tendrá 3 días hábiles desde la fecha del vencimiento para cobrar el Depósito a Plazo en caso contrario, se capitalizarán los intereses y se renovará por el mismo período a la tasa del momento.',
      left,
      doc.y,
      { width: pageWidth, align: 'left' },
    );

    // Firma y footer centrado
    doc.moveDown(4);
    const sigX = left + pageWidth / 2 - 120;
    doc.font(fontRegular).fontSize(10).text('Firma Cliente: ______________________________', sigX);
    doc.moveDown(2);
    // Centrar el pie usando width=pageWidth y align center
    doc.font(fontRegular).fontSize(10).text('Cooperativa de Ahorro y Crédito', left, doc.y, { width: pageWidth, align: 'center' });
    doc.text('De Arica y Parinacota Ltda', left, doc.y, { width: pageWidth, align: 'center' });

    doc.end();
    return resultPromise;
  }

  async instructivo(params: { dap: any; instructions: any }): Promise<Buffer> {
    const { dap, instructions } = params;
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    doc.pipe(stream);
    stream.on('data', (c: Buffer) => chunks.push(c));
    const resultPromise = new Promise<Buffer>((resolve, reject) => {
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      doc.on('error', reject);
    });

    doc.font('Helvetica-Bold').fontSize(14).text('INSTRUCTIVO DEPÓSITO A PLAZO', { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica').fontSize(10);
    doc.text(`DAP ID: ${dap?.id ?? '-'}`);
    doc.moveDown();
    doc.text(`Banco: ${instructions?.bankName ?? '-'}`);
    doc.text(`N° cuenta: ${instructions?.accountNumber ?? '-'}`);
    doc.moveDown();
    doc.text(instructions?.description ?? '-');
    doc.end();

    return resultPromise;
  }
}