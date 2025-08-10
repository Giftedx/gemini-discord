/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use server';
/**
 * @fileOverview A flow for creating a new workflow definition.
 *
 * - createWorkflow - A function that saves a new workflow configuration.
 * - CreateWorkflowInput - The input type for the createWorkflow function.
 * - CreateWorkflowOutput - The return type for the createWorkflow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createWorkflow as createWorkflowService } from '@/services/workflowService';
import { WorkflowSchema } from '@/models/workflow';
import { appCheckMiddleware } from '../middleware/appCheckMiddleware';

// We omit the server-generated fields for the input schema.
export const CreateWorkflowInputSchema = WorkflowSchema.omit({
    createdAt: true,
    updatedAt: true,
});
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowInputSchema>;

export const CreateWorkflowOutputSchema = z.object({
    workflowId: z.string().describe('The ID of the newly created workflow.'),
    message: z.string().describe('A confirmation message.'),
});
export type CreateWorkflowOutput = z.infer<typeof CreateWorkflowOutputSchema>;


export async function createWorkflow(
    input: CreateWorkflowInput
): Promise<CreateWorkflowOutput> {
    return createWorkflowFlow(input);
}

const createWorkflowFlow = ai.defineFlow(
    {
        name: 'createWorkflowFlow',
        inputSchema: CreateWorkflowInputSchema,
        outputSchema: CreateWorkflowOutputSchema,

    },
    async (workflowData) => {
        const workflowId = await createWorkflowService(workflowData);

        return {
            workflowId,
            message: `Successfully created workflow "${workflowData.workflowName}" with ID: ${workflowId}`,
        };
    }
);
