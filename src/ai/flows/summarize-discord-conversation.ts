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
import { getUserApiKey, incrementRequestCount } from '@/services/userService';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    const userApiKey = await getUserApiKey(input.userId);

    if (userApiKey) {
        console.log(`Using custom API key for user ${input.userId}`);
        const genAI = new GoogleGenerativeAI(userApiKey);
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-pro',
            generationConfig: { responseMimeType: 'application/json' },
        });
        
        const systemPrompt = `You will be provided with a Discord thread. Summarize it, focusing on key discussion points and decisions. Your response MUST be a JSON object that conforms to this Zod schema: ${JSON.stringify(SummarizeDiscordConversationOutputSchema.jsonSchema)}`;
        const promptForCustomKey = `${systemPrompt}\n\nDiscord Thread:\n${input.threadText}`;

        const result = await model.generateContent(promptForCustomKey);
        const response = result.response;
        const text = response.text();
        await incrementRequestCount(input.userId);
        return JSON.parse(text) as SummarizeDiscordConversationOutput;
    } else {
        console.log('Using global API key.');
        const {output} = await summarizeDiscordConversationPrompt(input);
        return output!;
    }
  }
);
