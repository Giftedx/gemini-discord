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

export const CreateImageInputSchema = z.object({
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
  },
  async ({ prompt }) => {
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

    console.log('Image generation successful.');
    return { imageUrl: media.url };
  }
);
