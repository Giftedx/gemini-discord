/**
 * @fileOverview Initializes and exports the Firebase Admin SDK for server-side use.
 * This ensures a single instance of the SDK is used throughout the application.
 */

import admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    // The SDK will automatically use Google Application Default Credentials
    // for authentication, but explicitly setting the projectId helps it
    // locate the correct project resources, especially for auth operations.
  });
}

const firestore = admin.firestore();

export { admin, firestore };
