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
import {getUserApiKey} from '@/services/userService';
import {GoogleGenerativeAI} from '@google/generative-ai';

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
    const userApiKey = await getUserApiKey(input.userId);

    if (userApiKey) {
      console.log(`Using custom API key for user ${input.userId}`);
      const genAI = new GoogleGenerativeAI(userApiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-pro-vision',
        generationConfig: {responseMimeType: 'application/json'},
      });

      const fileToGenerativePart = (dataUri: string) => {
        const match = dataUri.match(/^data:(.+);base64,(.+)$/);
        if (!match) throw new Error('Invalid data URI');
        return {inlineData: {mimeType: match[1], data: match[2]}};
      };

      const promptText = `You are an expert analyst. Analyze the following file and respond to the user's prompt. Your response MUST be a JSON object that conforms to this Zod schema: ${JSON.stringify(
        ProcessMultimodalContentOutputSchema.jsonSchema
      )} \n\nUser Prompt: ${input.prompt}`;

      const imagePart = fileToGenerativePart(input.fileDataUri);

      const result = await model.generateContent([promptText, imagePart]);
      const response = result.response;
      const text = response.text();
      return JSON.parse(text) as ProcessMultimodalContentOutput;
    } else {
      console.log(`Using global API key.`);
      const {output} = await prompt(input);
      return output!;
    }
  }
);
