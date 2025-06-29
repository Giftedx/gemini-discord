/**
 * @fileOverview Initializes and exports the Firebase Admin SDK for server-side use.
 * This ensures a single instance of the SDK is used throughout the application.
 */

import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  admin.initializeApp({
    // The SDK will automatically use Google Application Default Credentials
    // in a Cloud Run environment. For local development, you would need
    // to set up a service account key file.
  });
}

const firestore = admin.firestore();

export { admin, firestore };
