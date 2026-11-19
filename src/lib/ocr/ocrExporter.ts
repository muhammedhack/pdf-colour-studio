import { jsPDF } from 'jspdf';
import type { OCRPageResult } from '../../types/ocr';

/**
 * Triggers a client-side file download
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Copies text to clipboard with fallback
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch {
    return false;
  }
}

/**
 * Exports all OCR results to plain text (.txt)
 */
export function exportAllAsTxt(
  results: Map<number, OCRPageResult>,
  docName: string = 'document'
): void {
  const sortedPages = Array.from(results.keys()).sort((a, b) => a - b);
  const parts: string[] = [];

  parts.push(`=======================================================`);
  parts.push(`  Extracted Text - ${docName}`);
  parts.push(`  Generated: ${new Date().toLocaleString()}`);
  parts.push(`=======================================================\n`);

  for (const pageNum of sortedPages) {
    const res = results.get(pageNum);
    if (!res) continue;

    parts.push(`\n--- [ Page ${pageNum} (${res.source === 'native' ? 'Native Text' : 'AI OCR ' + res.confidence + '%'}) ] ---`);
    parts.push(res.text);
    parts.push(`\n-------------------------------------------------------`);
  }

  const cleanName = docName.replace(/\.[^/.]+$/, '');
  downloadFile(`${cleanName}_extracted_text.txt`, parts.join('\n'));
}

/**
 * Exports all OCR results to structured JSON (.json)
 */
export function exportAllAsJSON(
  results: Map<number, OCRPageResult>,
  docName: string = 'document'
): void {
  const sortedPages = Array.from(results.keys()).sort((a, b) => a - b);
  const pagesData = sortedPages.map((pageNum) => results.get(pageNum)).filter(Boolean);

  const payload = {
    documentName: docName,
    exportedAt: new Date().toISOString(),
    pageCount: pagesData.length,
    pages: pagesData,
  };

  const cleanName = docName.replace(/\.[^/.]+$/, '');
  downloadFile(`${cleanName}_ocr_data.json`, JSON.stringify(payload, null, 2), 'application/json');
}

/**
 * Exports all OCR results as clean Markdown (.md)
 */
export function exportAllAsMarkdown(
  results: Map<number, OCRPageResult>,
  docName: string = 'document'
): void {
  const sortedPages = Array.from(results.keys()).sort((a, b) => a - b);
  const parts: string[] = [];

  parts.push(`# OCR Extracted Document: ${docName}`);
  parts.push(`*Generated on ${new Date().toLocaleString()}*\n`);

  for (const pageNum of sortedPages) {
    const res = results.get(pageNum);
    if (!res) continue;

    parts.push(`## Page ${pageNum}`);
    parts.push(`> Engine: \`${res.engineName}\` | Confidence: **${res.confidence}%** | Words: **${res.wordCount}**\n`);
    parts.push(res.text);
    parts.push('\n---\n');
  }

  const cleanName = docName.replace(/\.[^/.]+$/, '');
  downloadFile(`${cleanName}_extracted.md`, parts.join('\n'), 'text/markdown;charset=utf-8');
}

/**
 * Generates an accessible, clean PDF text report document
 */
export function exportSearchablePDFReport(
  results: Map<number, OCRPageResult>,
  docName: string = 'document'
): void {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const sortedPages = Array.from(results.keys()).sort((a, b) => a - b);
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const maxLineWidth = pageWidth - margin * 2;

  let isFirstPage = true;

  for (const pageNum of sortedPages) {
    const res = results.get(pageNum);
    if (!res) continue;

    if (!isFirstPage) {
      pdf.addPage();
    }
    isFirstPage = false;

    // Header bar
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.rect(0, 0, pageWidth, 45, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59); // slate-800
    pdf.text(`${docName} - Page ${pageNum}`, margin, 28);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139); // slate-500
    const metaText = `${res.source === 'native' ? 'Digital Vector Text' : 'AI OCR (' + res.confidence + '%)'} • ${res.wordCount} words`;
    pdf.text(metaText, pageWidth - margin, 28, { align: 'right' });

    // Page Body Text
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42); // slate-900

    const splitText = pdf.splitTextToSize(res.text, maxLineWidth);
    let y = 70;
    const lineHeight = 15;

    for (const line of splitText) {
      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineHeight;
    }
  }

  const cleanName = docName.replace(/\.[^/.]+$/, '');
  pdf.save(`${cleanName}_ocr_report.pdf`);
}
