'use server';
import { config } from 'dotenv';
// Load .env.local first, then .env. Dotenv will not override existing variables.
config({ path: '.env.local' });
config();

// Import flows so that they are registered with Genkit.
import '@/ai/flows/analyze-code';
import '@/ai/flows/process-multimodal-content.ts';
import '@/ai/flows/summarize-discord-conversation.ts';
import '@/ai/flows/setUserApiKey';
import '@/ai/flows/web-search-assisted-answer';
import '@/ai/flows/githubWebhookHandler';
import '@/ai/flows/workflowProcessor';
import '@/ai/flows/create-workflow';
import '@/ai/flows/create-image';
import '@/ai/flows/getUsageStats';
import '@/services/pdfProcessor';
