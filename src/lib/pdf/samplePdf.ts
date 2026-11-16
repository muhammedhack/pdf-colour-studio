import { jsPDF } from 'jspdf';

/**
 * Creates a sample multi-page PDF document for instant testing and demonstration
 */
export function generateSamplePDF(): ArrayBuffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // --- PAGE 1: Annual Creative Report Cover & Article ---
  // Header banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 120, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('PDF COLOR STUDIO', 40, 55);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Visual Document Showcase & Color Fidelity Report', 40, 85);

  // Decorative badges
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(40, 140, 90, 24, 4, 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('EDITION 2026', 52, 156);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(140, 140, 110, 24, 4, 4, 'F');
  doc.setTextColor(51, 65, 85);
  doc.text('SAMPLE DOCUMENT', 148, 156);

  // Body content
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Transform Any Document into a Visual Masterpiece', 40, 200);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const introText =
    'PDF Color Studio enables instant, privacy-focused visual transformations right inside your web browser. ' +
    'Whether you need crisp 1-bit black & white binarization for archival scanning, warm vintage sepia tones for historical manuscripts, ' +
    'or cinematic duotone palettes for client presentations, every filter applies with zero cloud transmission.';
  doc.text(doc.splitTextToSize(introText, pageWidth - 80), 40, 225);

  // Color Swatch Demonstration Boxes
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Vibrant Palette Showcase', 40, 310);

  const swatches = [
    { color: [239, 68, 68], label: 'Crimson' },
    { color: [249, 115, 22], label: 'Amber' },
    { color: [234, 179, 8], label: 'Solar' },
    { color: [34, 197, 94], label: 'Emerald' },
    { color: [59, 130, 246], label: 'Sapphire' },
    { color: [168, 85, 247], label: 'Amethyst' },
  ];

  const swatchWidth = (pageWidth - 80 - 50) / 6;
  swatches.forEach((swatch, idx) => {
    const x = 40 + idx * (swatchWidth + 10);
    doc.setFillColor(swatch.color[0], swatch.color[1], swatch.color[2]);
    doc.roundedRect(x, 325, swatchWidth, 60, 6, 6, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(swatch.label, x + 8, 360);
  });

  // Simulated Graphical Chart
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Document Performance Analytics', 40, 430);

  // Chart axes
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(40, 560, pageWidth - 40, 560);

  // Bars
  const bars = [
    { label: 'Q1', height: 70, color: [99, 102, 241] },
    { label: 'Q2', height: 95, color: [59, 130, 246] },
    { label: 'Q3', height: 60, color: [14, 165, 233] },
    { label: 'Q4', height: 110, color: [20, 184, 166] },
    { label: 'Total', height: 125, color: [16, 185, 129] },
  ];

  const barW = 50;
  const spacing = (pageWidth - 80 - bars.length * barW) / (bars.length + 1);

  bars.forEach((b, i) => {
    const bx = 40 + spacing + i * (barW + spacing);
    const by = 560 - b.height;
    doc.setFillColor(b.color[0], b.color[1], b.color[2]);
    doc.roundedRect(bx, by, barW, b.height, 4, 4, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(b.label, bx + 16, 575);
  });

  // Footer page number
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Page 1 of 3 • PDF Color Studio Interactive Demonstration', 40, pageHeight - 30);

  // --- PAGE 2: Modern Invoice & Data Table ---
  doc.addPage([pageWidth, pageHeight], 'portrait');

  // Page 2 header
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 80, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, 80, pageWidth, 80);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE / RECEIPT SUMMARY', 40, 48);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Invoice #PCS-2026-8891 • Issued: Nov 2026', pageWidth - 250, 48);

  // Invoice table header
  doc.setFillColor(241, 245, 249);
  doc.rect(40, 110, pageWidth - 80, 28, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('ITEM DESCRIPTION', 50, 128);
  doc.text('QTY', 330, 128);
  doc.text('UNIT PRICE', 400, 128);
  doc.text('TOTAL', 490, 128);

  // Table rows
  const items = [
    { desc: 'High-Res Document Color Grading Engine', qty: '1', price: '$120.00', total: '$120.00' },
    { desc: 'Client-Side Canvas Image Processing Pipeline', qty: '2', price: '$85.00', total: '$170.00' },
    { desc: 'Real 1-Bit Black & White Threshold Module', qty: '1', price: '$45.00', total: '$45.00' },
    { desc: 'Duotone & Cinematic Split-Toning Shaders', qty: '1', price: '$95.00', total: '$95.00' },
    { desc: 'Batch Multi-Page PDF Exporter (300 DPI)', qty: '1', price: '$150.00', total: '$150.00' },
  ];

  items.forEach((item, idx) => {
    const y = 160 + idx * 36;
    doc.setDrawColor(241, 245, 249);
    doc.line(40, y + 10, pageWidth - 40, y + 10);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(item.desc, 50, y);
    doc.text(item.qty, 335, y);
    doc.text(item.price, 405, y);
    doc.setFont('helvetica', 'bold');
    doc.text(item.total, 495, y);
  });

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 250, 370, 210, 100, 6, 6, 'F');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', pageWidth - 235, 395);
  doc.text('$580.00', pageWidth - 80, 395);
  doc.text('Tax (0% Local):', pageWidth - 235, 415);
  doc.text('$0.00', pageWidth - 80, 415);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', pageWidth - 235, 445);
  doc.text('$580.00', pageWidth - 85, 445);

  // Guarantee Stamp
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(2);
  doc.roundedRect(40, 370, 180, 60, 8, 8, 'D');
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('100% VERIFIED', 65, 400);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('ZERO CLOUD UPLOADS • LOCAL', 58, 418);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Page 2 of 3 • PDF Color Studio Interactive Demonstration', 40, pageHeight - 30);

  // --- PAGE 3: Certificate / Creative Art Design ---
  doc.addPage([pageWidth, pageHeight], 'portrait');

  // Outer decorative border
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(2);
  doc.rect(30, 30, pageWidth - 60, pageHeight - 60, 'D');
  doc.setLineWidth(1);
  doc.rect(36, 36, pageWidth - 72, pageHeight - 72, 'D');

  // Seal badge
  doc.setFillColor(254, 240, 138);
  doc.circle(pageWidth / 2, 140, 45, 'F');
  doc.setDrawColor(234, 179, 8);
  doc.setLineWidth(2);
  doc.circle(pageWidth / 2, 140, 41, 'D');

  doc.setTextColor(161, 98, 7);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL', pageWidth / 2 - 25, 136);
  doc.text('AWARD', pageWidth / 2 - 20, 150);

  // Title
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('Certificate of Excellence', pageWidth / 2, 230, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('PROUDLY PRESENTED FOR OUTSTANDING CREATIVE COLOR FIDELITY TO', pageWidth / 2, 260, { align: 'center' });

  // Recipient
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(79, 70, 229);
  doc.text('PDF Color Studio Developer', pageWidth / 2, 300, { align: 'center' });

  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - 140, 312, pageWidth / 2 + 140, 312);

  // Certificate text
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const certText =
    'In recognition of delivering an ultra-fast, local-first PDF filtering web application with instant previews, ' +
    'pixel-perfect color transforms, and zero server privacy compromises.';
  doc.text(doc.splitTextToSize(certText, pageWidth - 140), pageWidth / 2, 345, { align: 'center' });

  // Signature lines
  const sigY = 560;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1);
  doc.line(80, sigY, 220, sigY);
  doc.line(pageWidth - 220, sigY, pageWidth - 80, sigY);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Lead Performance Engineer', 90, sigY + 16);
  doc.text('Chief UI/UX Architect', pageWidth - 200, sigY + 16);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Page 3 of 3 • PDF Color Studio Interactive Demonstration', 40, pageHeight - 30);

  return doc.output('arraybuffer');
}
