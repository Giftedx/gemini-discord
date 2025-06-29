'use server';
import { config } from 'dotenv';
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
import '@/services/pdfProcessor';
