import { Injectable } from '@nestjs/common';
import { PassThrough } from 'stream';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

@Injectable()
export class DapPdfService {
  // Helper: render a PDFDocument using a render function and return a Buffer.
  // Now accepts an optional footerText which will be stamped on every page AFTER rendering.
  private renderToBuffer(doc: any, renderFn: () => void, footerText?: string): Promise<Buffer> {
    // Use PassThrough stream to collect chunks
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    doc.pipe(stream);
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));

    const resultPromise = new Promise<Buffer>((resolve, reject) => {
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
      doc.on('error', reject);
    });

    try {
      // Execute the rendering callback (writes content into buffered pages)
      renderFn();

      // If footerText provided and doc buffered pages are enabled, stamp footer on each page
      if (footerText && typeof doc.bufferedPageRange === 'function') {
        try {
          const range = doc.bufferedPageRange();
          for (let i = 0; i < range.count; i++) {
            doc.switchToPage(i);
            // compute footer position (18px above bottom margin)
            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const footerY = doc.page.height - doc.page.margins.bottom - 18;
            // draw footer without affecting other layout (we explicitly provide coordinates)
            const footerFont = (doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica';
            doc.font(footerFont).fontSize(9).fillColor('#555').text(footerText, doc.page.margins.left, footerY, { width: pageWidth, align: 'center' });
          }
          // switch back to last page so subsequent internal logic (if any) keeps working predictably
          doc.switchToPage(range.count - 1);
        } catch (e) {
          // don't fail the whole PDF if footer stamping fails; log and continue
          // eslint-disable-next-line no-console
          console.warn('Failed to stamp footer on pages:', (e as any)?.message ?? e);
        }
      }
    } catch (err) {
      try {
        doc.end();
      } catch {}
      return Promise.reject(err);
    }

    // finalize document (this will flush buffered pages)
    doc.end();
    return resultPromise;
  }

  // Helpers: money, percent, date, safe lookup
  private money(n: any): string {
    if (n === undefined || n === null || n === '') return '-';
    const v = Number(n);
    if (Number.isNaN(v)) return String(n);
    try {
      return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
    } catch {
      return v.toFixed(0);
    }
  }

  private percent(n: any): string {
    if (n === undefined || n === null || n === '') return '-';
    const v = Number(n);
    if (Number.isNaN(v)) return String(n);
    if (Math.abs(v) <= 1) return `${(v * 100).toFixed(2)}%`;
    return `${v.toFixed(2)}%`;
  }

  private date(d: any): string {
    if (!d) return '-';
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const dd = `${dt.getDate()}`.padStart(2, '0');
    const mm = `${dt.getMonth() + 1}`.padStart(2, '0');
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private safe(obj: any, ...keys: string[]) {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined) return obj[k];
    }
    return undefined;
  }

  private registerFontsIfAvailable(doc: any) {
    try {
      const tryPaths = (paths: string[]) => {
        for (const p of paths) {
          try {
            if (p && fs.existsSync(p)) return p;
          } catch {
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
      // ignore font registration issues
      // eslint-disable-next-line no-console
      console.warn('No se pudieron registrar fuentes Calibri, usando fallback', e);
    }
  }

  // SOLICITUD PDF (3-column header: Folio | InternalId | Run/Nombre) + footer on every page
  async solicitud(params: {
    dap: any;
    usuario?: { rut?: string; nombre?: string };
  }): Promise<Buffer> {
    const { dap, usuario } = params;
    const data: any = dap ?? {};

    // Normalize fields (snake_case / camelCase tolerant)
    const id = this.safe(data, 'id', 'dap_id') ?? '-';
    const internalId = this.safe(data, 'internalId', 'internal_id', 'internal_id_value', 'internalIdValue') ?? null;
    const userRun = this.safe(data, 'userRun', 'user_run', 'run') ?? usuario?.rut ?? '-';
    const initialDate = this.safe(data, 'initialDate', 'initial_date') ?? null;
    const dapType = this.safe(data, 'type', 'dap_type') ?? '-';
    const currency = this.safe(data, 'currencyType', 'currency_type', 'currency') ?? '-';
    const days = this.safe(data, 'days', 'term_days') ?? '-';
    const initialAmount = this.safe(data, 'initialAmount', 'initial_amount') ?? 0;
    const finalAmount = this.safe(data, 'finalAmount', 'final_amount') ?? 0;
    const profit = this.safe(data, 'profit', 'interest', 'profitAmount', 'profit_amount') ?? 0;
    const rateMonth = this.safe(data, 'interestRateInMonth', 'interest_rate_in_month') ?? null;
    const ratePeriod = this.safe(data, 'interestRateInPeriod', 'interest_rate_in_period') ?? null;
    const dueDate = this.safe(data, 'dueDate', 'due_date') ?? null;

    const nombreSolicitante =
      usuario?.nombre ||
      this.safe(data, 'userName', 'user_name', 'name', 'nombre') ||
      (data?.user && (data.user.name ?? data.user.fullName ?? data.user.nombre)) ||
      (data?.profile && (data.profile.names ?? data.profile.name ?? data.profile.nombre)) ||
      this.safe(data, 'names', 'fullName', 'full_name') ||
      '-';

    // Create PDFDocument with buffered pages so we can stamp footer after rendering
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
    this.registerFontsIfAvailable(doc);

    const footerText = 'Cooperativa de Ahorro y Crédito - De Arica y Parinacota Ltda';

    return this.renderToBuffer(
      doc,
      () => {
        // Title
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(16)
          .text('SOLICITUD DE INGRESO', { align: 'center' });
        doc.moveDown(0.1);
        doc.fontSize(14).text('DEPÓSITO A PLAZO', { align: 'center' });
        doc.moveDown(0.4);

        // Top info block: 3 columns layout (Folio | InternalId | Run/Nombre)
        const left = doc.page.margins.left;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidth = Math.floor(pageWidth / 3);

        const leftX = left;
        const centerX = left + colWidth;
        const rightX = left + 2 * colWidth;

        const baselineY = doc.y;

        const labelFont = (doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica';
        const labelBold = (doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold';

        // Left column (Folio / Fecha)
        doc.font(labelFont).fontSize(10).text('Número de Folio', leftX, baselineY, { width: colWidth, align: 'left' });
        doc.font(labelBold).fontSize(10).text(String(id).padStart(3, '0'), leftX, baselineY + 12, { width: colWidth, align: 'left' });

        doc.font(labelFont).fontSize(10).text('Fecha Ingreso', leftX, baselineY + 32, { width: colWidth, align: 'left' });
        doc.font(labelBold).fontSize(10).text(this.date(initialDate), leftX, baselineY + 44, { width: colWidth, align: 'left' });

        // Center column (InternalId)
        doc.font(labelFont).fontSize(10).text('N° Operación interna', centerX, baselineY, { width: colWidth, align: 'left' });
        if (internalId) {
          doc.font(labelBold).fontSize(10).text(String(internalId), centerX, baselineY + 12, { width: colWidth, align: 'left' });
        } else {
          doc.font(labelBold).fontSize(10).text('-', centerX, baselineY + 12, { width: colWidth, align: 'left' });
        }

        // Right column (Run / Nombre)
        doc.font(labelFont).fontSize(10).text('Rut Solicitante', rightX, baselineY, { width: colWidth, align: 'left' });
        doc.font(labelBold).fontSize(10).text(String(userRun), rightX, baselineY + 12, { width: colWidth, align: 'left' });

        doc.font(labelFont).fontSize(10).text('Nombre', rightX, baselineY + 32, { width: colWidth, align: 'left' });
        doc.font(labelBold).fontSize(10).text(nombreSolicitante, rightX, baselineY + 44, { width: colWidth, align: 'left' });

        // Advance doc.y to below header (avoid overlap)
        const headerBottomY = baselineY + 60; // leave comfortable spacing
        doc.y = headerBottomY;

        // Divider
        const dividerY = doc.y;
        doc.moveDown(0.2);
        doc.save();
        doc.moveTo(left, dividerY).lineTo(left + pageWidth, dividerY).lineWidth(1).stroke();
        doc.restore();
        doc.moveDown(0.8);

        // Section title
        doc.font(labelFont).fontSize(12)
          .text('Identificación del Depósito', left, doc.y, { width: pageWidth, align: 'left' });
        doc.moveDown(0.6);

        // TABLE (same layout as before)
        const tableLeft = left;
        const tableTop = doc.y;
        const tableWidth = pageWidth;
        const colProportions = [0.18, 0.08, 0.08, 0.14, 0.14, 0.08, 0.08, 0.12, 0.1];
        const colWidths = colProportions.map((p) => Math.floor(p * tableWidth));
        const usedW = colWidths.reduce((a, b) => a + b, 0);
        if (usedW < tableWidth) colWidths[colWidths.length - 1] += tableWidth - usedW;

        const headerHeight = 42;
        const rowHeight = 40;
        const tableHeight = headerHeight + rowHeight;

        doc.rect(tableLeft, tableTop, tableWidth, tableHeight).lineWidth(0.8).stroke();

        doc.save();
        doc.rect(tableLeft, tableTop, tableWidth, headerHeight).fillOpacity(0.06).fill('#000');
        doc.restore();

        doc.font(labelBold).fontSize(10.5);
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

        doc.font(labelFont).fontSize(10);
        const values = [
          dapType,
          currency,
          String(days),
          this.money(initialAmount),
          this.money(finalAmount),
          (rateMonth != null ? this.percent(rateMonth) : '-'),
          (ratePeriod != null ? this.percent(ratePeriod) : '-'),
          this.date(dueDate),
          this.money(profit),
        ];

        doc.moveTo(tableLeft, tableTop + headerHeight).lineTo(tableLeft + tableWidth, tableTop + headerHeight).lineWidth(0.7).stroke();

        let cellX = tableLeft;
        const valueFontSize = 10;
        const valueY = tableTop + headerHeight + Math.floor((rowHeight - valueFontSize) / 2);
        for (let i = 0; i < colWidths.length; i++) {
          const w = colWidths[i];
          if (i === 0) {
            doc.font(labelBold).fontSize(valueFontSize).text(values[i] ?? '-', cellX + 4, valueY, { width: w - 8, align: 'center' });
          } else {
            doc.font(labelFont).fontSize(valueFontSize).text(values[i] ?? '-', cellX + 4, valueY, { width: w - 8, align: 'center' });
          }
          cellX += w;
        }

        // Info paragraphs
        doc.moveDown((tableHeight / 12) + 1);
        doc.font(labelFont).fontSize(10);
        doc.text(
          'Forma de Pago: con transferencia bancaria a la cuenta del solicitante, según las instrucciones indicadas.',
          left,
          doc.y,
          { width: pageWidth, align: 'justify' },
        );
        doc.moveDown(1);
        doc.text(
          'En caso de los Depósitos a Plazo Renovables el solicitante tendrá 3 días hábiles desde la fecha del vencimiento para cobrar el Depósito a Plazo en caso contrario, se capitalizarán los intereses y se renovará por el mismo período a la tasa del momento.',
          left,
          doc.y,
          { width: pageWidth, align: 'justify' },
        );

        // Note: footer will be stamped automatically by renderToBuffer after rendering
      },
      footerText,
    );
  }

  // INSTRUCTIVO PDF (similar: we create buffered doc and pass footer text)
  async instructivo(params: { dap: any; instructions: any }): Promise<Buffer> {
    const { dap, instructions } = params;
    const data: any = dap ?? {};

    const id = this.safe(data, 'id', 'dap_id') ?? '-';
    const internalId = this.safe(data, 'internalId', 'internal_id', 'internal_id_value') ?? null;
    const initialAmount = this.safe(data, 'initialAmount', 'initial_amount') ?? undefined;
    const days = this.safe(data, 'days', 'term_days') ?? undefined;
    const dueDate = this.safe(data, 'dueDate', 'due_date') ?? undefined;
    const profit = this.safe(data, 'profit') ?? undefined;

    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
    this.registerFontsIfAvailable(doc);

    const footerText = 'Cooperativa de Ahorro y Crédito - De Arica y Parinacota Ltda';

    return this.renderToBuffer(
      doc,
      () => {
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

        // Header
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(16)
          .text('INSTRUCTIVO DEPÓSITO A PLAZO', { align: 'center' });
        doc.moveDown(0.25);

        // Mostrar internalId si existe (centrado, bajo título)
        if (internalId) {
          doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica')
            .fontSize(10)
            .text(`N° Operación interna: ${internalId}`, { align: 'center' });
          doc.moveDown(0.6);
        }

        // Cuenta destino
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(12)
          .text('Cuenta destino');
        doc.moveDown(0.25);

        const labelStyle = { continued: true };

        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(10)
          .text('Banco: ', labelStyle);
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica')
          .fontSize(10)
          .text(instructions?.bankName ?? '-');
        doc.moveDown(0.2);

        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(10)
          .text('Tipo de cuenta: ', labelStyle);
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica')
          .fontSize(10)
          .text(instructions?.accountType ?? '-');
        doc.moveDown(0.2);

        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(10)
          .text('N° de cuenta: ', labelStyle);
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica')
          .fontSize(10)
          .text(instructions?.accountNumber ?? '-');
        doc.moveDown(0.2);

        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(10)
          .text('Titular: ', labelStyle);
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica')
          .fontSize(10)
          .text(instructions?.accountHolderName ?? '-');
        doc.moveDown(0.2);

        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(10)
          .text('RUT titular: ', labelStyle);
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica')
          .fontSize(10)
          .text(instructions?.accountHolderRut ?? '-');
        doc.moveDown(0.2);

        if (instructions?.email) {
          doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
            .fontSize(10)
            .text('Correo: ', labelStyle);
          doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica')
            .fontSize(10)
            .text(instructions.email);
          doc.moveDown(0.2);
        }

        doc.moveDown(0.6);

        // Instructivo content
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(12)
          .text('Instructivo');
        doc.moveDown(0.25);
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica')
          .fontSize(10);

        const description = instructions?.description ?? '';
        if (description) {
          doc.text(description, { width: pageWidth, align: 'left' });
        } else {
          doc.text('-', { width: pageWidth, align: 'left' });
        }

        doc.moveDown(1);

        // Resumen del depósito
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri-Bold'] ? 'Calibri-Bold' : 'Helvetica-Bold')
          .fontSize(12)
          .text('Resumen del depósito');
        doc.moveDown(0.3);
        doc.font((doc as any).fonts && (doc as any).fonts['Calibri'] ? 'Calibri' : 'Helvetica').fontSize(10);
        doc.text(`Operación: ${id ?? '-'}`);
        if (initialAmount !== undefined) doc.text(`Monto capital: ${this.money(initialAmount)}`);
        if (days !== undefined) doc.text(`Plazo: ${days ?? '-'} días`);
        if (dueDate) doc.text(`Vencimiento: ${this.date(dueDate)}`);
        if (profit !== undefined) doc.text(`Intereses: ${this.money(profit)}`);

        doc.moveDown(1);

        // Note: footer will be stamped automatically by renderToBuffer after rendering
      },
      footerText,
    );
  }
}