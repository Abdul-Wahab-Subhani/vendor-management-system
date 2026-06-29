import PDFDocument from "pdfkit";

const NAVY = "#14213D";
const GOLD = "#FCA311";
const GRAY = "#6B7280";
const LIGHT = "#F4F5F7";
const BORDER = "#E5E7EB";

interface TableColumn {
  header: string;
  key: string;
  width: number;
  align?: "left" | "right" | "center";
}

interface PdfReportOptions {
  title: string;
  subtitle?: string;
  companyName?: string;
  columns: TableColumn[];
  rows: Record<string, string>[];
  summary?: { label: string; value: string }[];
  recommendation?: string;
  watermark?: string;
  includeSignature?: boolean;
}

const PAGE_MARGIN = 40;

function drawHeader(doc: PDFKit.PDFDocument, title: string, subtitle?: string, companyName?: string) {
  doc.save();
  doc.rect(0, 0, doc.page.width, 90).fill(NAVY);

  // "Logo" mark — a simple geometric badge since no real asset is provided
  doc.save();
  doc.circle(PAGE_MARGIN + 16, 32, 16).fill(GOLD);
  doc
    .fillColor(NAVY)
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("V", PAGE_MARGIN + 9, 23);
  doc.restore();

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(18)
    .text(companyName ?? "Vendor Management System", PAGE_MARGIN + 42, 18);

  doc
    .fillColor(GOLD)
    .font("Helvetica")
    .fontSize(10)
    .text("PROCUREMENT REPORT", PAGE_MARGIN + 42, 40);

  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(title, PAGE_MARGIN, 110, { width: doc.page.width - PAGE_MARGIN * 2 });

  if (subtitle) {
    doc.font("Helvetica").fontSize(10).fillColor(GRAY).text(subtitle, PAGE_MARGIN, 130);
  }

  doc.restore();
  doc.y = 150;
}

function drawFooter(doc: PDFKit.PDFDocument, pageNumber: number, totalPagesPlaceholder = true) {
  const bottom = doc.page.height - 50;
  doc.save();
  doc
    .moveTo(PAGE_MARGIN, bottom)
    .lineTo(doc.page.width - PAGE_MARGIN, bottom)
    .strokeColor(BORDER)
    .stroke();
  doc
    .fontSize(8)
    .fillColor(GRAY)
    .text(`Generated ${new Date().toLocaleString()}`, PAGE_MARGIN, bottom + 8);
  doc.text(`Page ${pageNumber}`, doc.page.width - PAGE_MARGIN - 60, bottom + 8, {
    width: 60,
    align: "right",
  });
  doc.restore();
}

function drawWatermark(doc: PDFKit.PDFDocument, text: string) {
  doc.save();
  doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
  doc
    .fontSize(64)
    .fillColor(LIGHT)
    .opacity(0.5)
    .text(text, 0, doc.page.height / 2 - 40, { width: doc.page.width, align: "center" });
  doc.opacity(1);
  doc.restore();
}

function drawTable(doc: PDFKit.PDFDocument, columns: TableColumn[], rows: Record<string, string>[]) {
  const startX = PAGE_MARGIN;
  let y = doc.y + 10;
  const rowHeight = 26;
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);

  function ensureSpace(height: number) {
    if (y + height > doc.page.height - 70) {
      doc.addPage();
      y = PAGE_MARGIN + 20;
    }
  }

  function drawHeaderRow() {
    ensureSpace(rowHeight);
    doc.rect(startX, y, tableWidth, rowHeight).fill(NAVY);
    let x = startX;
    columns.forEach((col) => {
      doc
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(9)
        .text(col.header.toUpperCase(), x + 8, y + 8, { width: col.width - 16, align: col.align ?? "left" });
      x += col.width;
    });
    y += rowHeight;
  }

  drawHeaderRow();

  rows.forEach((row, idx) => {
    ensureSpace(rowHeight);
    if (idx % 2 === 0) {
      doc.rect(startX, y, tableWidth, rowHeight).fill(LIGHT);
    }
    let x = startX;
    columns.forEach((col) => {
      doc
        .fillColor("#1B1F27")
        .font("Helvetica")
        .fontSize(9)
        .text(row[col.key] ?? "", x + 8, y + 8, { width: col.width - 16, align: col.align ?? "left" });
      x += col.width;
    });
    doc
      .moveTo(startX, y + rowHeight)
      .lineTo(startX + tableWidth, y + rowHeight)
      .strokeColor(BORDER)
      .stroke();
    y += rowHeight;
  });

  doc.y = y + 16;
}

/** Builds a branded, paginated PDF report and returns it as a Buffer. */
export function generatePdfReport(options: PdfReportOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: PAGE_MARGIN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawHeader(doc, options.title, options.subtitle, options.companyName);

    if (options.summary?.length) {
      const boxWidth = (doc.page.width - PAGE_MARGIN * 2 - 12 * (options.summary.length - 1)) / options.summary.length;
      let x = PAGE_MARGIN;
      const y = doc.y + 6;
      options.summary.forEach((s) => {
        doc.roundedRect(x, y, boxWidth, 50, 6).fillAndStroke(LIGHT, BORDER);
        doc.fillColor(GRAY).font("Helvetica").fontSize(8).text(s.label.toUpperCase(), x + 10, y + 10, { width: boxWidth - 20 });
        doc.fillColor(NAVY).font("Helvetica-Bold").fontSize(14).text(s.value, x + 10, y + 24, { width: boxWidth - 20 });
        x += boxWidth + 12;
      });
      doc.y = y + 66;
    }

    drawTable(doc, options.columns, options.rows);

    if (options.recommendation) {
      doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY).text("Recommendation", PAGE_MARGIN, doc.y + 4);
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#1B1F27")
        .text(options.recommendation, PAGE_MARGIN, doc.y + 6, { width: doc.page.width - PAGE_MARGIN * 2 });
    }

    if (options.includeSignature) {
      const sigY = doc.page.height - 140;
      doc
        .moveTo(PAGE_MARGIN, sigY)
        .lineTo(PAGE_MARGIN + 180, sigY)
        .strokeColor(BORDER)
        .stroke();
      doc.fontSize(9).fillColor(GRAY).text("Authorized Signature", PAGE_MARGIN, sigY + 6);

      doc
        .moveTo(doc.page.width - PAGE_MARGIN - 180, sigY)
        .lineTo(doc.page.width - PAGE_MARGIN, sigY)
        .strokeColor(BORDER)
        .stroke();
      doc.text("Date", doc.page.width - PAGE_MARGIN - 180, sigY + 6);
    }

    if (options.watermark) {
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawWatermark(doc, options.watermark);
      }
    }

    // Footers on every page (after watermarks so they stay on top)
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc, i + 1);
    }

    doc.end();
  });
}
