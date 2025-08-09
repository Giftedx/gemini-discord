/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use server';

/**
 * @fileOverview A service for managing user-specific data, such as API keys,
 * using a persistent Firestore backend.
 */

import { firestore, admin } from '@/lib/firebase';

const USERS_COLLECTION = 'users';

/**
 * Saves a user's Gemini API key to Firestore. Initializes request count if user is new.
 * @param userId The user's Discord ID.
 * @param apiKey The user's Gemini API key.
 */
export async function saveUserApiKey(userId: string, apiKey: string): Promise<void> {
  const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
  const doc = await userRef.get();

  const dataToSet: { apiKey: string; updatedAt: Date; requestCount?: number } = {
    apiKey: apiKey, // This should be encrypted
    updatedAt: new Date(),
  };

  // Only initialize the request count if the user does not exist yet.
  if (!doc.exists) {
    dataToSet.requestCount = 0;
  }
  
  await userRef.set(dataToSet, { merge: true });
  console.log(`API key saved in Firestore for user ${userId}`);
}

/**
 * Retrieves a user's Gemini API key from Firestore.
 * @param userId The user's Discord ID.
 * @returns The user's API key, or null if not found.
 */
export async function getUserApiKey(userId: string): Promise<string | null> {
  const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
  const doc = await userRef.get();

  if (!doc.exists) {
    return null;
  }

  const userData = doc.data();
  // In a real application, the key would be decrypted here.
  return userData?.apiKey || null;
}

/**
 * Atomically increments the request count for a given user.
 * @param userId The user's Discord ID.
 */
export async function incrementRequestCount(userId: string): Promise<void> {
    const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
    // This assumes the document exists, which it will if a user key is being used.
    await userRef.update({
        requestCount: admin.firestore.FieldValue.increment(1),
        updatedAt: new Date(),
    });
}

/**
 * Retrieves a user's usage statistics from Firestore.
 * @param userId The user's Discord ID.
 * @returns The user's request count, or 0 if not found.
 */
export async function getUserUsageStats(userId: string): Promise<number> {
    const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
    const doc = await userRef.get();

    if (!doc.exists) {
        return 0;
    }

    const userData = doc.data();
    return userData?.requestCount || 0;
}
