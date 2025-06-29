'use server';

/**
 * @fileOverview A service for managing user-specific data, such as API keys,
 * using a persistent Firestore backend.
 */

import { firestore } from '@/lib/firebase';

const USERS_COLLECTION = 'users';

/**
 * Saves a user's Gemini API key to Firestore.
 * @param userId The user's Discord ID.
 * @param apiKey The user's Gemini API key.
 */
export async function saveUserApiKey(userId: string, apiKey: string): Promise<void> {
  // In a real application, the key should be encrypted before saving.
  const userRef = firestore.collection(USERS_COLLECTION).doc(userId);
  await userRef.set({
    apiKey: apiKey, // This should be encrypted
    updatedAt: new Date(),
  }, { merge: true });
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
