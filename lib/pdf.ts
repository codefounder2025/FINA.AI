import { MAX_PDF_BYTES } from '@/lib/connectors/statementParser';

/**
 * Client-side PDF text extraction.
 *
 * Kept deliberately thin and separate from `statementParser`: this module only
 * turns a PDF into text lines, and every layout decision lives in the parser,
 * which is pure and unit-testable.
 *
 * The file never leaves the browser — pdf.js reads it from an ArrayBuffer, and
 * there is no upload endpoint anywhere in the app.
 */

interface PdfTextItem {
  str: string;
  /** [scaleX, skewX, skewY, scaleY, x, y] */
  transform: number[];
}

/**
 * pdf.js returns text as individual positioned fragments. Statement tables are
 * columns, so fragments on the same baseline must be rejoined into one line —
 * otherwise a date, description and amount land on three separate lines and no
 * parser can pair them up.
 */
export function groupTextItemsIntoLines(items: PdfTextItem[], tolerance = 3): string[] {
  const rows: Array<{ y: number; parts: Array<{ x: number; str: string }> }> = [];

  for (const item of items) {
    if (typeof item.str !== 'string' || item.str.trim() === '') continue;
    const x = item.transform?.[4] ?? 0;
    const y = item.transform?.[5] ?? 0;

    const row = rows.find((candidate) => Math.abs(candidate.y - y) <= tolerance);
    if (row) row.parts.push({ x, str: item.str });
    else rows.push({ y, parts: [{ x, str: item.str }] });
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
        .map((part) => part.str)
        .join(' ')
        .replace(/\s{2,}/g, ' ')
        .trim(),
    )
    .filter((line) => line.length > 0);
}

export interface PdfExtractionResult {
  lines: string[];
  errors: string[];
}

export async function extractPdfLines(file: File): Promise<PdfExtractionResult> {
  if (file.size > MAX_PDF_BYTES) {
    return {
      lines: [],
      errors: [`That file is ${Math.ceil(file.size / 1024)} KB. The limit is ${MAX_PDF_BYTES / 1024} KB.`],
    };
  }

  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return { lines: [], errors: ['The file could not be read.'] };
  }

  try {
    // Loaded on demand so pdf.js never lands in the initial page bundle.
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    const document_ = await pdfjs.getDocument({ data: new Uint8Array(bytes) }).promise;

    try {
      const lines: string[] = [];
      // Statements are short; the cap keeps a 500-page report from freezing the tab.
      const pageCount = Math.min(document_.numPages, 40);

      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        const page = await document_.getPage(pageNumber);
        const content = await page.getTextContent();
        lines.push(...groupTextItemsIntoLines(content.items as unknown as PdfTextItem[]));
        page.cleanup();
      }

      if (lines.length === 0) {
        return {
          lines: [],
          errors: [
            'This PDF has no text layer, so nothing could be read.',
            'That usually means it is a scan or a screenshot exported as PDF.',
          ],
        };
      }

      return { lines, errors: [] };
    } finally {
      await document_.destroy();
    }
  } catch {
    return {
      lines: [],
      errors: [
        'The PDF could not be opened.',
        'Password-protected statements are not supported — remove the password first.',
        'Reading PDFs also needs a network connection the first time, to load the parser.',
      ],
    };
  }
}
