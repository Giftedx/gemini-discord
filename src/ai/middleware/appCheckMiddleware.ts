'use server';

import { FlowMiddleware } from 'genkit/flow';
import { headers } from 'next/headers';
import { admin } from '@/lib/firebase';

export const appCheckMiddleware: FlowMiddleware = async (input, next) => {
  // In a real-world production environment, you would likely want to make this enforcement
  // configurable. For this project, we'll enforce App Check unless a specific env var is
  // set for local development, which is useful for testing flows with the Genkit UI.
  if (process.env.NODE_ENV === 'development' && process.env.GENKIT_ENV === 'dev') {
     console.log('Skipping App Check verification in dev environment.');
     return next(input);
  }

  const appCheckToken = headers().get('X-Firebase-AppCheck');

  if (!appCheckToken) {
    console.warn('App Check token not found. Rejecting request.');
    // Throwing an error will cause the Genkit/Next.js adapter to return a 4xx/5xx error.
    // This is the correct way to halt execution in a Genkit middleware.
    throw new Error('Unauthorized: App Check token not provided.');
  }

  try {
    // verifyToken() will throw an error if the token is invalid (expired, wrong project, etc.)
    await admin.appCheck().verifyToken(appCheckToken);
    console.log('App Check token verified successfully.');
    return next(input);
  } catch (err: any) {
    console.error('App Check token verification failed:', err.message);
    throw new Error('Unauthorized: Invalid App Check token.');
  }
};
