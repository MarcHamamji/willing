import { readFile } from 'fs/promises';

import { PDFParse } from 'pdf-parse';

const MAX_CV_TEXT_CHARS = 12000;

const normalizeExtractedText = (value: string) => value.trim().replace(/\s+/g, ' ');

export const extractCvText = async (cvPath?: string | null): Promise<string | null> => {
  const normalizedPath = cvPath?.trim();
  if (!normalizedPath) {
    console.info('[embeddings] CV path missing or empty. Continuing without CV text.');
    return null;
  }

  try {
    const pdfBuffer = await readFile(normalizedPath);
    const parser = new PDFParse({ data: pdfBuffer });
    const parsed = await parser.getText()
      .finally(async () => {
        await parser.destroy();
      });
    const cleaned = normalizeExtractedText(parsed.text ?? '');

    if (!cleaned) {
      console.warn('[embeddings] CV parsed but produced no text. Continuing without CV text.');
      return null;
    }

    return cleaned.slice(0, MAX_CV_TEXT_CHARS);
  } catch (error) {
    console.warn(`[embeddings] Failed to parse CV from "${normalizedPath}". Continuing without CV text.`, error);
    return null;
  }
};
