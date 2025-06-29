/**
 * @fileOverview The API endpoint for receiving GitHub webhooks.
 */

import { githubWebhookHandler } from '@/ai/flows/githubWebhookHandler';
import { NextRequest, NextResponse } from 'next/server';
import getRawBody from 'raw-body';

export const config = {
  api: {
    bodyParser: false, // We need the raw body for signature validation
  },
};

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-hub-signature-256');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Convert the request stream to a raw buffer, then to a string for validation.
    // We can't use req.text() directly as it consumes the stream.
    const rawBodyBuffer = await getRawBody(req.body as any);
    const rawBody = rawBodyBuffer.toString();
    const payload = JSON.parse(rawBody);

    // Asynchronously call the Genkit flow to handle the webhook logic
    // without blocking the response.
    githubWebhookHandler({ signature, payload, rawBody });

    return NextResponse.json({ message: 'Webhook received and is being processed.' }, { status: 202 });
  } catch (error: any) {
    console.error('Error processing GitHub webhook:', error);
    return NextResponse.json({ error: error.message || 'An internal error occurred' }, { status: 500 });
  }
}
