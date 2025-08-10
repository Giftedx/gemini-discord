/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Implemented the webSearchAssistedAnswer flow, allowing the bot to use GenAI to search the web and provide accurate answers to user questions.
'use server';
/**
 * @fileOverview Implements a flow that allows the bot to answer questions using real-time web search.
 *
 * - webSearchAssistedAnswer - A function that uses web search to provide answers to user queries.
 * - WebSearchAssistedAnswerInput - The input type for the webSearchAssistedAnswer function.
 * - WebSearchAssistedAnswerOutput - The return type for the webSearchAssistedAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { appCheckMiddleware } from '../middleware/appCheckMiddleware';

const WebSearchAssistedAnswerInputSchema = z.object({
  userId: z
    .string()
    .describe('The Discord User ID of the person making the request.'),
  query: z.string().describe('The query to answer using web search.'),
});
export type WebSearchAssistedAnswerInput = z.infer<
  typeof WebSearchAssistedAnswerInputSchema
>;

const WebSearchAssistedAnswerOutputSchema = z.object({
  answer: z
    .string()
    .describe('The answer to the query, obtained using web search.'),
});
export type WebSearchAssistedAnswerOutput = z.infer<
  typeof WebSearchAssistedAnswerOutputSchema
>;

export async function webSearchAssistedAnswer(
  input: WebSearchAssistedAnswerInput
): Promise<WebSearchAssistedAnswerOutput> {
  return webSearchAssistedAnswerFlow(input);
}

const webSearchTool = ai.defineTool(
  {
    name: 'webSearch',
    description: 'Performs a web search and returns the results.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.string(),
  },
  async input => {
    // Replace with actual web search implementation.
    // This is a placeholder that simply returns a canned response.
    // In a real application, this would use a service like SerpApi
    // to perform the web search and return the results.
    console.log(`running fake web search for ${input.query}`);
    return `search results for ${input.query}`;
  }
);

const prompt = ai.definePrompt({
  name: 'webSearchAssistedAnswerPrompt',
  tools: [webSearchTool],
  input: {schema: WebSearchAssistedAnswerInputSchema},
  output: {schema: WebSearchAssistedAnswerOutputSchema},
  prompt: `You are a helpful assistant that answers questions using web search.

  Use the webSearch tool to search for relevant information, and then answer the question based on the search results.

  Question: {{{query}}}
  `,
});

const webSearchAssistedAnswerFlow = ai.defineFlow(
  {
    name: 'webSearchAssistedAnswerFlow',
    inputSchema: WebSearchAssistedAnswerInputSchema,
    outputSchema: WebSearchAssistedAnswerOutputSchema,

  },
  async input => {
    // TODO: This flow does not currently support user-specific API keys
    // because it relies on Genkit's tool-use capabilities, which are
    // tightly integrated with the global AI configuration.
    const {output} = await prompt(input);
    return output!;
  }
);
