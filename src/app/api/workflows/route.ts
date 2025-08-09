/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { admin, firestore } from '@/lib/firebase';
import { Workflow } from '@/models/workflow';

const WORKFLOWS_COLLECTION = 'workflows';

// This function needs to be securely implemented. For this example, we assume
// the frontend can provide the guildId, but in a real-world multi-tenant app,
// you would get this from a custom claim in the user's auth token after they've
// authorized the bot for a specific server.
// async function getGuildsForUser(uid: string): Promise<string[]> {
//   // Mock implementation: In a real app, you would have a mapping of
//   // user IDs to the guilds they manage.
//   // For now, we'll fetch all workflows and let the frontend filter,
//   // but a real implementation MUST filter by guildId on the backend.
//   return []; 
// }

export async function GET() {
  const authorization = headers().get('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
  }

  const idToken = authorization.split('Bearer ')[1];
  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized: Malformed token' }, { status: 401 });
  }

  try {
    await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
  }

  try {
    // In a real multi-tenant app, you'd add: .where('guildId', 'in', managedGuilds)
    // const managedGuilds = await getGuildsForUser(decodedToken.uid);
    // if (managedGuilds.length === 0) {
    //   return NextResponse.json([]);
    // }
    
    const snapshot = await firestore.collection(WORKFLOWS_COLLECTION).get();
    
    const workflows: (Workflow & { id: string })[] = [];
    snapshot.forEach(doc => {
      workflows.push({ id: doc.id, ...doc.data() as Workflow });
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows from Firestore:", error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}
