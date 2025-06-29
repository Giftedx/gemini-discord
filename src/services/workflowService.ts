'use server';
/**
 * @fileOverview A service for managing workflows in Firestore.
 */

import { firestore, admin } from '@/lib/firebase';
import type { Workflow } from '@/models/workflow';

const WORKFLOWS_COLLECTION = 'workflows';

/**
 * Creates a new workflow document in Firestore.
 * @param workflowData The workflow data to save.
 * @returns The ID of the newly created workflow document.
 */
export async function createWorkflow(workflowData: Omit<Workflow, 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = await firestore.collection(WORKFLOWS_COLLECTION).add({
    ...workflowData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log(`Workflow created with ID: ${docRef.id}`);
  return docRef.id;
}
