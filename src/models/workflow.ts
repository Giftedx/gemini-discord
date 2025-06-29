/**
 * @fileOverview Defines the data model and schema for a Workflow document in Firestore.
 */

import { z } from 'zod';

// Zod schema for robust validation of workflow data.
export const WorkflowSchema = z.object({
  guildId: z.string().describe('The Discord Guild (Server) ID.'),
  workflowName: z.string().describe('A user-friendly name for the workflow.'),
  triggerType: z.enum(['GITHUB_PUSH', 'SCHEDULE']).describe('The type of event that triggers this workflow.'),
  triggerConfig: z.record(z.string()).describe('Configuration for the trigger (e.g., repo and branch for GitHub).'),
  actionType: z.enum(['GEMINI_PROMPT', 'DISCORD_MESSAGE']).describe('The action to perform when the workflow is triggered.'),
  actionConfig: z.record(z.string()).describe('Configuration for the action (e.g., target channel and prompt template).'),
  createdBy: z.string().describe('The Discord User ID of the person who created the workflow.'),
  isEnabled: z.boolean().describe('Whether the workflow is currently active.'),
  createdAt: z.any().optional(), // Firestore serverTimestamp will be used here
  updatedAt: z.any().optional(), // Firestore serverTimestamp will be used here
});

// TypeScript type inferred from the Zod schema.
export type Workflow = z.infer<typeof WorkflowSchema>;
