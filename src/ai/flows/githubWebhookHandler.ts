'use server';
/**
 * @fileOverview A flow for handling incoming GitHub webhooks.
 *
 * - githubWebhookHandler - Validates and processes GitHub webhooks.
 * - GithubWebhookInput - The input type for the githubWebhookHandler function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import crypto from 'crypto';
import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub();
const GITHUB_WORKFLOW_TOPIC = 'github-workflow-triggers';

const GithubWebhookInputSchema = z.object({
  signature: z.string().describe('The X-Hub-Signature-256 from the request header.'),
  payload: z.any().describe('The JSON payload from the GitHub webhook.'),
  rawBody: z.string().describe('The raw request body as a string, for signature validation.'),
});
export type GithubWebhookInput = z.infer<typeof GithubWebhookInputSchema>;

export async function githubWebhookHandler(input: GithubWebhookInput): Promise<void> {
  return githubWebhookHandlerFlow(input);
}

const githubWebhookHandlerFlow = ai.defineFlow(
  {
    name: 'githubWebhookHandlerFlow',
    inputSchema: GithubWebhookInputSchema,
    outputSchema: z.void(),
  },
  async ({ signature, payload, rawBody }) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('GITHUB_WEBHOOK_SECRET is not set. Cannot validate webhook.');
    }

    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')}`;

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('Invalid webhook signature. Request will be ignored.');
    }

    console.log('GitHub webhook signature validated successfully.');

    // Publish the validated payload to Pub/Sub for asynchronous processing.
    const dataBuffer = Buffer.from(JSON.stringify(payload));
    await pubsub.topic(GITHUB_WORKFLOW_TOPIC).publishMessage({ data: dataBuffer });

    console.log(`Payload published to Pub/Sub topic: ${GITHUB_WORKFLOW_TOPIC}`);
  }
);
