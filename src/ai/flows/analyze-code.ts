/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use server';
/**
 * @fileOverview A flow for analyzing code files.
 *
 * - analyzeCode - A function that handles code analysis.
 * - AnalyzeCodeInput - The input type for the analyzeCode function.
 * - AnalyzeCodeOutput - The return type for the analyzeCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getUserApiKey, incrementRequestCount} from '@/services/userService';
import {GoogleGenerativeAI} from '@google/generative-ai';
import { appCheckMiddleware } from '../middleware/appCheckMiddleware';

const AnalyzeCodeInputSchema = z.object({
  userId: z
    .string()
    .describe('The Discord User ID of the person making the request.'),
  fileContent: z
    .string()
    .describe('The text content of the code file to analyze.'),
  userPrompt: z
    .string()
    .optional()
    .describe(
      'An optional user prompt for specific questions about the code.'
    ),
});
export type AnalyzeCodeInput = z.infer<typeof AnalyzeCodeInputSchema>;

const AnalyzeCodeOutputSchema = z.object({
  language: z
    .string()
    .describe(
      "The detected programming language (e.g., 'TypeScript', 'Python')."
    ),
  summary: z
    .string()
    .describe("A brief, one-sentence summary of the file's purpose."),
  keyComponents: z
    .array(z.string())
    .describe(
      'A list of key functions, classes, or components defined in the file.'
    ),
  dependencies: z
    .array(z.string())
    .describe('A list of imported libraries or modules.'),
  potentialIssues: z
    .array(z.string())
    .describe(
      'A list of potential issues, bugs, or areas for improvement. If none, return an empty array.'
    ),
  userQueryResponse: z
    .string()
    .optional()
    .describe(
      "If a user query was provided, this contains the answer. Otherwise, it's omitted."
    ),
});
export type AnalyzeCodeOutput = z.infer<typeof AnalyzeCodeOutputSchema>;

export async function analyzeCode(
  input: AnalyzeCodeInput
): Promise<AnalyzeCodeOutput> {
  return analyzeFlow(input);
}

const systemPrompt = `You are an expert code analysis tool. Your task is to analyze the provided code file and return a structured JSON object. Do not add any explanatory text before or after the JSON object. The JSON object must conform to the following structure:`;

const analyzeCodePrompt = ai.definePrompt({
  name: 'analyzeCodePrompt',
  input: {schema: AnalyzeCodeInputSchema},
  output: {schema: AnalyzeCodeOutputSchema},
  prompt: `${systemPrompt}

  {{#if userPrompt}}
  In addition to the standard analysis, the user has a specific question. Answer it in the 'userQueryResponse' field of the JSON output. The user's question is: {{{userPrompt}}}
  {{/if}}
  
  Code to analyze:
  \`\`\`
  {{{fileContent}}}
  \`\`\``,
});

const analyzeFlow = ai.defineFlow(
  {
    name: 'analyzeFlow',
    inputSchema: AnalyzeCodeInputSchema,
    outputSchema: AnalyzeCodeOutputSchema,
    middleware: [appCheckMiddleware],
  },
  async input => {
    const userApiKey = await getUserApiKey(input.userId);

    if (userApiKey) {
      console.log(`Using custom API key for user ${input.userId}`);
      const genAI = new GoogleGenerativeAI(userApiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-pro',
        generationConfig: {responseMimeType: 'application/json'},
      });

      let promptText = `${systemPrompt} Your response MUST be a JSON object that conforms to this Zod schema: ${JSON.stringify(
        AnalyzeCodeOutputSchema.jsonSchema
      )}\n\n`;

      if (input.userPrompt) {
        promptText += `In addition to the standard analysis, the user has a specific question. Answer it in the 'userQueryResponse' field of the JSON output. The user's question is: ${input.userPrompt}\n\n`;
      }

      promptText += `Code to analyze:\n\`\`\`\n${input.fileContent}\n\`\`\``;

      const result = await model.generateContent(promptText);
      const response = result.response;
      const text = response.text();
      await incrementRequestCount(input.userId);
      return JSON.parse(text) as AnalyzeCodeOutput;
    } else {
      console.log('Using global API key.');
      const {output} = await analyzeCodePrompt(input);
      return output!;
    }
  }
);
