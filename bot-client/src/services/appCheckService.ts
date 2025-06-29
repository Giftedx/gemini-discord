import admin from 'firebase-admin';
import { config } from '../config';

// Simple in-memory cache for the App Check token
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Gets a valid Firebase App Check token, using a cached token if available.
 * Since this is a trusted server environment, we use the Firebase Admin SDK to mint tokens.
 * @returns A promise that resolves to the App Check token string.
 */
export async function getAppCheckToken(): Promise<string> {
    const now = Date.now();

    // If we have a token and it's not expiring in the next 5 minutes, use it.
    if (cachedToken && cachedToken.expiresAt > now + 5 * 60 * 1000) {
        return cachedToken.token;
    }

    console.log('[INFO] Generating new Firebase App Check token...');
    try {
        const appCheck = admin.appCheck();
        const tokenResponse = await appCheck.createToken(config.FIREBASE_APP_ID, {
            // TTL of 1 hour, matching the default for App Check tokens
            ttlMillis: 60 * 60 * 1000,
        });

        cachedToken = {
            token: tokenResponse.token,
            // expires at ttlMillis from now
            expiresAt: now + tokenResponse.ttlMillis,
        };
        console.log('[INFO] Successfully generated and cached new App Check token.');
        return cachedToken.token;
    } catch (error) {
        console.error("[ERROR] Failed to create App Check token. Ensure the bot's service account has the 'Firebase App Check Token Verifier' role.", error);
        throw new Error("Failed to generate necessary authentication token for backend communication.");
    }
}
