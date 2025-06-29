import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {googleCloud} from '@genkit-ai/google-cloud';
import {firebase} from '@genkit-ai/firebase';

export const ai = genkit({
  plugins: [
    googleAI(),
    googleCloud(), // Add Google Cloud plugin for Pub/Sub and other GCP services
    firebase(), // Add Firebase plugin for telemetry and authentication
  ],
  model: 'googleai/gemini-2.0-flash',
});
