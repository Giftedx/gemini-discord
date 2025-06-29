/**
 * @fileOverview Initializes and exports the Firebase Admin SDK for server-side use.
 * This ensures a single instance of the SDK is used throughout the application.
 */

import admin from 'firebase-admin';
import { applicationDefault } from 'firebase-admin/app';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  admin.initializeApp({
    // Explicitly use Application Default Credentials for authentication.
    // This can help resolve issues in environments where automatic
    // credential discovery fails.
    credential: applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const firestore = admin.firestore();

export { admin, firestore };
