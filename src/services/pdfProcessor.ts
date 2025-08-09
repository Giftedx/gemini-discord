/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use server';
/**
 * @fileOverview A service for parsing text content from PDF files.
 */
import pdf from 'pdf-parse';

/**
 * Extracts text content from a PDF buffer.
 * @param pdfBuffer The PDF file content as a Buffer.
 * @returns A promise that resolves to the extracted text content.
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  // The 'pdf-parse' library can be memory intensive on large PDFs.
  // In a production environment, you might add resource constraints or checks here.
  const data = await pdf(pdfBuffer);
  return data.text;
}
