import { readFile } from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse') as (dataBuffer: Buffer) => Promise<{ text?: string }>;

const MAX_CV_TEXT_CHARS = 12000;

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

const normalizeExtractedText = (value: string) => value.trim().replace(/\s+/g, ' ');

const readPdfBuffer = async (cvPath: string) => {
  if (isHttpUrl(cvPath)) {
    const response = await fetch(cvPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch CV (status ${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  return readFile(cvPath);
};

export const extractCvText = async (cvPath?: string | null): Promise<string | null> => {
  const normalizedPath = cvPath?.trim();
  if (!normalizedPath) {
    console.info('[embeddings] CV path missing or empty. Continuing without CV text.');
    return null;
  }

  try {
    const pdfBuffer = await readPdfBuffer(normalizedPath);
    const parsed = await pdfParse(pdfBuffer);
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
