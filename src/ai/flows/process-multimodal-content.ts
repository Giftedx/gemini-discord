'use server';
/**
 * @fileOverview A flow for processing multimodal content.
 *
 * - processMultimodalContent - A function that handles multimodal content processing.
 * - ProcessMultimodalContentInput - The input type for the processMultimodalContent function.
 * - ProcessMultimodalContentOutput - The return type for the processMultimodalContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { extractTextFromPdf } from '@/services/pdfProcessor';

const ProcessMultimodalContentInputSchema = z.object({
  userId: z
    .string()
    .describe('The Discord User ID of the person making the request.'),
  fileDataUri: z
    .string()
    .describe(
      "The file to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z
    .string()
    .describe('The user prompt to guide the analysis of the file.'),
});
export type ProcessMultimodalContentInput = z.infer<
  typeof ProcessMultimodalContentInputSchema
>;

const ProcessMultimodalContentOutputSchema = z.object({
  analysis: z
    .string()
    .describe(
      'The analysis of the file content based on the user prompt.'
    ),
});
export type ProcessMultimodalContentOutput = z.infer<
  typeof ProcessMultimodalContentOutputSchema
>;

export async function processMultimodalContent(
  input: ProcessMultimodalContentInput
): Promise<ProcessMultimodalContentOutput> {
  return processMultimodalContentFlow(input);
}

const multimodalPrompt = ai.definePrompt({
  name: 'processMultimodalContentPrompt',
  input: {schema: ProcessMultimodalContentInputSchema},
  output: {schema: ProcessMultimodalContentOutputSchema},
  prompt: `You are an expert analyst. Analyze the following file and respond to the user's prompt.

File: {{media url=fileDataUri}}

User Prompt: {{{prompt}}}
`,
});

const processMultimodalContentFlow = ai.defineFlow(
  {
    name: 'processMultimodalContentFlow',
    inputSchema: ProcessMultimodalContentInputSchema,
    outputSchema: ProcessMultimodalContentOutputSchema,
  },
  async (input) => {
    const { fileDataUri, prompt: userPrompt } = input;

    const mimeTypeMatch = fileDataUri.match(/^data:(.*);base64,/);
    if (!mimeTypeMatch) {
      throw new Error('Invalid data URI format.');
    }
    const mimeType = mimeTypeMatch[1];
    const base64Data = fileDataUri.substring(fileDataUri.indexOf(',') + 1);

    if (mimeType === 'application/pdf') {
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      const pdfText = await extractTextFromPdf(pdfBuffer);

      const textAnalysisPrompt = `You are an expert analyst. Analyze the following document text and respond to the user's prompt.

Document Content:
---
${pdfText}
---

User Prompt: ${userPrompt}
`;
      const { text } = await ai.generate({ prompt: textAnalysisPrompt });
      return { analysis: text() };

    } else {
      // For images and other text files, use the existing multimodal prompt.
      const { output } = await multimodalPrompt(input);
      return output!;
    }
  }
);
