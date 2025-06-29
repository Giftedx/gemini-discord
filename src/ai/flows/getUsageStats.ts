'use server';
/**
 * @fileOverview A flow for retrieving user API usage statistics.
 *
 * - getUsageStats - A function that fetches the user's request count.
 * - GetUsageStatsInput - The input type for the getUsageStats function.
 * - GetUsageStatsOutput - The return type for the getUsageStats function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUserUsageStats } from '@/services/userService';
import { appCheckMiddleware } from '../middleware/appCheckMiddleware';

export const GetUsageStatsInputSchema = z.object({
  userId: z.string().describe('The Discord User ID.'),
});
export type GetUsageStatsInput = z.infer<typeof GetUsageStatsInputSchema>;

export const GetUsageStatsOutputSchema = z.object({
  requestCount: z.number().describe("The number of requests made with the user's API key."),
});
export type GetUsageStatsOutput = z.infer<typeof GetUsageStatsOutputSchema>;

export async function getUsageStats(input: GetUsageStatsInput): Promise<GetUsageStatsOutput> {
  return getUsageStatsFlow(input);
}

const getUsageStatsFlow = ai.defineFlow(
  {
    name: 'getUsageStatsFlow',
    inputSchema: GetUsageStatsInputSchema,
    outputSchema: GetUsageStatsOutputSchema,
    middleware: [appCheckMiddleware],
  },
  async ({ userId }) => {
    const count = await getUserUsageStats(userId);
    return { requestCount: count };
  }
);
