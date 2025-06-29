import { config } from 'dotenv';
config();

// Import flows so that they are registered with Genkit.
import '@/ai/flows/process-multimodal-content.ts';
import '@/ai/flows/summarize-discord-conversation.ts';
