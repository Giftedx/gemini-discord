import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from '@genkit-ai/google-cloud';

export const ai = genkit({
  plugins: [
    googleAI(),
    googleCloud(), // Add Google Cloud plugin for Pub/Sub and other GCP services
  ],
  model: 'googleai/gemini-2.0-flash',
});
