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

const ProcessMultimodalContentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The file to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  prompt: z.string().describe('The user prompt to guide the analysis of the file.'),
});
export type ProcessMultimodalContentInput = z.infer<typeof ProcessMultimodalContentInputSchema>;

const ProcessMultimodalContentOutputSchema = z.object({
  analysis: z.string().describe('The analysis of the file content based on the user prompt.'),
});
export type ProcessMultimodalContentOutput = z.infer<typeof ProcessMultimodalContentOutputSchema>;

export async function processMultimodalContent(input: ProcessMultimodalContentInput): Promise<ProcessMultimodalContentOutput> {
  return processMultimodalContentFlow(input);
}

const prompt = ai.definePrompt({
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
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
