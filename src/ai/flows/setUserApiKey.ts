'use server';
/**
 * @fileOverview A flow for securely setting a user's Gemini API key.
 *
 * - setUserApiKey - A function that saves a user's API key.
 * - SetUserApiKeyInput - The input type for the setUserApiKey function.
 */

import {ai} from '@/ai/genkit';
import {saveUserApiKey} from '@/services/userService';
import {z} from 'genkit';
import { appCheckMiddleware } from '../middleware/appCheckMiddleware';

export const SetUserApiKeyInputSchema = z.object({
  userId: z.string().describe('The Discord User ID.'),
  apiKey: z.string().describe("The user's personal Gemini API key."),
});
export type SetUserApiKeyInput = z.infer<typeof SetUserApiKeyInputSchema>;

export async function setUserApiKey(input: SetUserApiKeyInput): Promise<void> {
  return setUserApiKeyFlow(input);
}

const setUserApiKeyFlow = ai.defineFlow(
  {
    name: 'setUserApiKeyFlow',
    inputSchema: SetUserApiKeyInputSchema,
    outputSchema: z.void(),
    middleware: [appCheckMiddleware],
  },
  async ({userId, apiKey}) => {
    await saveUserApiKey(userId, apiKey);
  }
);
