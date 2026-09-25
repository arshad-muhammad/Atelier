import { extractText } from 'unpdf';
import mammoth from 'mammoth';

/**
 * Deterministic PDF & DOCX Document Parser for ATS inspection.
 * Zero external AI services or microservices required.
 * Pure JavaScript, 100% serverless compatible without native canvas bindings.
 */
export async function parseDocument(fileBuffer, mimeType = '', fileName = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf' || mimeType.includes('pdf');
  const isDocx = ext === 'docx' || mimeType.includes('word') || mimeType.includes('officedocument');

  let fullText = '';
  let pageCount = 1;
  let hasTwoColumns = false;
  let tableCount = 0;
  const links = [];

  if (isPdf) {
    try {
      const uint8 = new Uint8Array(fileBuffer);
      const pdfData = await extractText(uint8);
      const textVal = pdfData.text;
      fullText = (Array.isArray(textVal) ? textVal.join('\n\n') : (textVal || '')).trim();
      pageCount = pdfData.totalPages || 1;
    } catch (err) {
      throw new Error(`Failed to parse PDF document: ${err.message}`);
    }

    // Heuristics for PDF layout inspection
    const lines = fullText.split(/\r?\n/);
    let columnPatternCount = 0;
    let pipeRowCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      // Check for two-column text layout heuristic (large space gaps between text blocks)
      if (/\S\s{6,}\S/.test(trimmed)) {
        columnPatternCount++;
      }
      // Check for markdown or ASCII tables
      if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|')) {
        pipeRowCount++;
      }
      // Extract any URLs
      const urlMatches = trimmed.match(/https?:\/\/[^\s)]+/g);
      if (urlMatches) {
        links.push(...urlMatches);
      }
    }

    // Two-column resumes typically have multiple lines with wide spacing
    if (columnPatternCount >= 6) {
      hasTwoColumns = true;
    }
    tableCount = Math.floor(pipeRowCount / 3);
  } else if (isDocx) {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      fullText = (result.value || '').trim();
      
      const words = fullText.split(/\s+/).filter(Boolean);
      pageCount = Math.max(1, Math.ceil(words.length / 380));

      const lines = fullText.split(/\r?\n/);
      let tabColumnCount = 0;
      for (const line of lines) {
        const trimmed = line.trim();
        if (line.includes('\t\t') || /\S\s{6,}\S/.test(trimmed)) {
          tabColumnCount++;
        }
        const urlMatches = trimmed.match(/https?:\/\/[^\s)]+/g);
        if (urlMatches) {
          links.push(...urlMatches);
        }
      }
      if (tabColumnCount >= 5) {
        hasTwoColumns = true;
      }
    } catch (err) {
      throw new Error(`Failed to parse DOCX document: ${err.message}`);
    }
  } else {
    // Attempt plain text decoding fallback
    fullText = fileBuffer.toString('utf-8').trim();
    const words = fullText.split(/\s+/).filter(Boolean);
    pageCount = Math.max(1, Math.ceil(words.length / 380));
  }

  const words = fullText.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const scannedImageSuspected = totalWords < 25 && pageCount > 0;

  return {
    fullText,
    pageCount,
    totalWords,
    scannedImageSuspected,
    hasTwoColumns,
    tableCount,
    links: Array.from(new Set(links)),
    smallestFontSize: null,
    hasVerySmallFont: false,
    hasHeaderFooterText: false
  };
}
