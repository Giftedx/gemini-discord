import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { admin } from '@/lib/firebase';

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

  const mockWorkflows = [
    { id: 'wf_1', name: 'Analyze Main Branch Commits', trigger: 'GitHub Push', channel: '#ci-alerts', status: true },
    { id: 'wf_2', name: 'Daily Project Summary', trigger: 'Schedule', channel: '#general', status: true },
    { id: 'wf_3', name: 'Staging Deploy Docs', trigger: 'GitHub Push', channel: '#devops', status: false },
    { id: 'wf_4', name: 'Review new Pull Requests', trigger: 'GitHub PR', channel: '#dev-team', status: true },
  ];

  return NextResponse.json(mockWorkflows);
}
