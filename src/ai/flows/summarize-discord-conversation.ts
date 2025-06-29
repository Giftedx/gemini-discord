'use server';
/**
 * @fileOverview A flow for summarizing text-based conversations.
 *
 * - summarizeDiscordConversation - A function that handles conversation summarization.
 * - SummarizeDiscordConversationInput - The input type for the summarizeDiscordConversation function.
 * - SummarizeDiscordConversationOutput - The return type for the summarizeDiscordConversation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDiscordConversationInputSchema = z.object({
  userId: z
    .string()
    .describe('The Discord User ID of the person making the request.'),
  threadText: z
    .string()
    .describe('The complete text content of the Discord thread to summarize.'),
});

export type SummarizeDiscordConversationInput = z.infer<
  typeof SummarizeDiscordConversationInputSchema
>;

const SummarizeDiscordConversationOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the Discord thread discussion.'),
});

export type SummarizeDiscordConversationOutput = z.infer<
  typeof SummarizeDiscordConversationOutputSchema
>;

export async function summarizeDiscordConversation(
  input: SummarizeDiscordConversationInput
): Promise<SummarizeDiscordConversationOutput> {
  return summarizeDiscordConversationFlow(input);
}

const summarizeDiscordConversationPrompt = ai.definePrompt({
  name: 'summarizeDiscordConversationPrompt',
  input: {schema: SummarizeDiscordConversationInputSchema},
  output: {schema: SummarizeDiscordConversationOutputSchema},
  prompt: `Summarize the following Discord thread. Focus on the key discussion points and decisions made. Provide a summary that allows someone to quickly understand what was discussed without reading the entire thread.\n\nDiscord Thread:\n{{{threadText}}}`,
});

const summarizeDiscordConversationFlow = ai.defineFlow(
  {
    name: 'summarizeDiscordConversationFlow',
    inputSchema: SummarizeDiscordConversationInputSchema,
    outputSchema: SummarizeDiscordConversationOutputSchema,
  },
  async input => {
    // Note: This initial implementation uses the global API key.
    // It will be updated in a future task to support per-user keys.
    const {output} = await summarizeDiscordConversationPrompt(input);
    return output!;
  }
);
