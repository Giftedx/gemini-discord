/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { NextResponse } from 'next/server';
import { admin, firestore } from '@/lib/firebase';
import { headers } from 'next/headers';

const WORKFLOWS_COLLECTION = 'workflows';

async function verifyUser(idToken: string) {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        console.error('Error verifying ID token:', error);
        return null;
    }
}

export async function PATCH(request: Request, { params }: { params: { workflowId: string } }) {
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const user = await verifyUser(idToken);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { workflowId } = params;
    const { isEnabled } = await request.json();

    if (typeof isEnabled !== 'boolean') {
        return NextResponse.json({ error: 'Invalid `isEnabled` value' }, { status: 400 });
    }

    try {
        const workflowRef = firestore.collection(WORKFLOWS_COLLECTION).doc(workflowId);
        const doc = await workflowRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }
        
        await workflowRef.update({ 
            isEnabled,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ message: 'Workflow status updated successfully' });
    } catch (error) {
        console.error('Error updating workflow:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export async function DELETE(request: Request, { params }: { params: { workflowId: string } }) {
    const headersList = await headers();
    const authorization = headersList.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const user = await verifyUser(idToken);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { workflowId } = params;

    try {
        const workflowRef = firestore.collection(WORKFLOWS_COLLECTION).doc(workflowId);
        const doc = await workflowRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
        }

        await workflowRef.delete();

        return NextResponse.json({ message: 'Workflow deleted successfully' });
    } catch (error) {
        console.error('Error deleting workflow:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
