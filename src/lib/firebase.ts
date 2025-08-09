/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileOverview Initializes and exports the Firebase Admin SDK for server-side use.
 * This ensures a single instance of the SDK is used throughout the application.
 */

import admin from 'firebase-admin';

// Check if the app is already initialized to prevent re-initialization
if (!admin.apps.length) {
  // initializeApp() will automatically use the credentials from the
  // GOOGLE_APPLICATION_CREDENTIALS environment variable if it is set.
  admin.initializeApp();
}

const firestore = admin.firestore();

export { admin, firestore };
