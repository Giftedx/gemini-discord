// Summarizes long Discord threads using GenAI to quickly catch up on the discussion.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDiscordConversationInputSchema = z.object({
  threadText: z
    .string()
    .describe('The complete text content of the Discord thread to summarize.'),
});

export type SummarizeDiscordConversationInput =
  z.infer<typeof SummarizeDiscordConversationInputSchema>;

const SummarizeDiscordConversationOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the Discord thread discussion.'),
});

export type SummarizeDiscordConversationOutput =
  z.infer<typeof SummarizeDiscordConversationOutputSchema>;

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
    const {output} = await summarizeDiscordConversationPrompt(input);
    return output!;
  }
);
