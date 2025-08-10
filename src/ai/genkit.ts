/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {enableGoogleCloudTelemetry} from '@genkit-ai/google-cloud';
import {enableFirebaseTelemetry} from '@genkit-ai/firebase';

// Enable telemetry
enableGoogleCloudTelemetry();
enableFirebaseTelemetry();

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-2.0-flash',
});
