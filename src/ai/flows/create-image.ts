'use server';
/**
 * @fileOverview A flow for creating images from text prompts.
 *
 * - createImage - A function that handles image generation.
 * - CreateImageInput - The input type for the createImage function.
 * - CreateImageOutput - The return type for the createImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUserApiKey, incrementRequestCount } from '@/services/userService';
import { appCheckMiddleware } from '../middleware/appCheckMiddleware';

export const CreateImageInputSchema = z.object({
  userId: z.string().describe('The Discord User ID.'),
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type CreateImageInput = z.infer<typeof CreateImageInputSchema>;

export const CreateImageOutputSchema = z.object({
  imageUrl: z.string().describe("The generated image as a data URI. Format: 'data:image/png;base64,<encoded_data>'."),
});
export type CreateImageOutput = z.infer<typeof CreateImageOutputSchema>;

export async function createImage(input: CreateImageInput): Promise<CreateImageOutput> {
  return createImageFlow(input);
}

const createImageFlow = ai.defineFlow(
  {
    name: 'createImageFlow',
    inputSchema: CreateImageInputSchema,
    outputSchema: CreateImageOutputSchema,
    middleware: [appCheckMiddleware],
  },
  async ({ userId, prompt }) => {
    console.log(`Generating image for prompt: "${prompt}"`);
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    const userApiKey = await getUserApiKey(userId);
    if (userApiKey) {
        await incrementRequestCount(userId);
        console.log(`Incremented request count for user ${userId} for image generation.`);
    }

    console.log('Image generation successful.');
    return { imageUrl: media.url };
  }
);
