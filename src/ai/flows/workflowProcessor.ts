/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use server';
/**
 * @fileOverview An asynchronous flow for processing validated workflow triggers.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { firestore } from '@/lib/firebase';
import { Workflow } from '@/models/workflow';
import { postToChannel } from '@/services/discordService';

const GITHUB_WORKFLOW_TOPIC = 'github-workflow-triggers';

// Simple templating function to replace placeholders like {{key}}
function renderTemplate(template: string, context: Record<string, string>): string {
    let rendered = template;
    for (const key in context) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, context[key]);
    }
    return rendered;
}


export const workflowProcessor = ai.defineFlow(
  {
    name: 'workflowProcessor',
    inputSchema: z.any(),
    outputSchema: z.void(),
  },
  async (payload) => {
    console.log('Workflow processor triggered by Pub/Sub message.');

    // 1. Determine the event type from the payload (GitHub push)
    const repo = payload.repository?.full_name;
    const branch = payload.ref?.replace('refs/heads/', '');

    if (!repo || !branch) {
      console.log('Webhook payload is not a valid push event or is missing repository/branch info. Skipping.');
      return;
    }
     if (payload.deleted) {
        console.log(`Branch ${branch} was deleted in ${repo}. Skipping workflow processing.`);
        return;
    }

    console.log(`Processing push event for repository: ${repo}, branch: ${branch}`);

    // 2. Query Firestore for all enabled workflows that match this trigger.
    const workflowsSnapshot = await firestore
        .collection('workflows')
        .where('isEnabled', '==', true)
        .where('triggerType', '==', 'GITHUB_PUSH')
        .where('triggerConfig.repo', '==', repo)
        .where('triggerConfig.branch', '==', branch)
        .get();

    if (workflowsSnapshot.empty) {
        console.log('No matching workflows found for this event.');
        return;
    }

    console.log(`Found ${workflowsSnapshot.docs.length} matching workflow(s).`);

    // 3. For each matching workflow, execute its defined action.
    for (const doc of workflowsSnapshot.docs) {
        const workflow = doc.data() as Workflow;
        console.log(`Executing workflow: ${workflow.workflowName} (ID: ${doc.id})`);

        try {
            if (workflow.actionType === 'GEMINI_PROMPT') {
                const commit = payload.head_commit;
                if (!commit) {
                    console.warn(`Workflow ${workflow.workflowName} skipped: head_commit not found in payload.`);
                    continue;
                }

                // Construct the prompt context from the GitHub payload
                const promptContext = {
                    commitMessage: commit.message,
                    authorName: commit.author?.name || 'N/A',
                    authorUsername: commit.author?.username || 'N/A',
                    commitUrl: commit.url,
                    repositoryName: repo,
                    branchName: branch,
                };

                // Construct the final prompt
                const finalPrompt = renderTemplate(workflow.actionConfig.promptTemplate, promptContext);
                console.log(`Generated prompt for Gemini: "${finalPrompt}"`);

                // Call Gemini
                const { text } = await ai.generate({ prompt: finalPrompt });

                // Post the result to the target Discord channel
                const targetChannelId = workflow.actionConfig.targetChannelId;
                if (targetChannelId) {
                    await postToChannel(targetChannelId, text);
                    console.log(`Posted Gemini response for workflow "${workflow.workflowName}" to channel ${targetChannelId}.`);
                } else {
                     console.error(`Workflow "${workflow.workflowName}" is missing targetChannelId.`);
                }
            }
            // Add other action types here in the future (e.g., 'DISCORD_MESSAGE')
        } catch (error) {
            console.error(`Error executing workflow ${workflow.workflowName} (ID: ${doc.id}):`, error);
            // Optional: Post an error message to a monitoring channel
        }
    }
  }
);
