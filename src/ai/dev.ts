import { config } from 'dotenv';
config();

import '@/ai/flows/web-search-assisted-answer.ts';
import '@/ai/flows/summarize-discord-conversation.ts';
import '@/ai/flows/process-multimodal-content.ts';
import '@/ai/flows/setUserApiKey.ts';
