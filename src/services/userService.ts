'use server';

/**
 * @fileOverview A service for managing user-specific data, such as API keys.
 * In a production environment, this would connect to a secure database like Firestore
 * and encrypt the keys.
 */

// In-memory store for user API keys. Replace with a database in production.
const userApiKeys = new Map<string, string>();

/**
 * Saves a user's Gemini API key.
 * @param userId The user's Discord ID.
 * @param apiKey The user's Gemini API key.
 */
export async function saveUserApiKey(userId: string, apiKey: string): Promise<void> {
  // In a real application, the key should be encrypted before saving.
  userApiKeys.set(userId, apiKey);
  console.log(`API key saved for user ${userId}`);
}

/**
 * Retrieves a user's Gemini API key.
 * @param userId The user's Discord ID.
 * @returns The user's API key, or null if not found.
 */
export async function getUserApiKey(userId: string): Promise<string | null> {
  // In a real application, the key would be retrieved and decrypted.
  return userApiKeys.get(userId) || null;
}
