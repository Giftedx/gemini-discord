/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import { getAuth } from 'firebase/auth';
import { getFirebaseApp } from './firebase-client';

/**
 * A wrapper around fetch that automatically adds the Firebase Auth ID token.
 * @param url The API endpoint to call.
 * @param options The standard fetch options.
 * @returns The fetch Response object.
 */
export async function fetchAuthenticated(url: string, options: RequestInit = {}): Promise<Response> {
    const auth = getAuth(getFirebaseApp());
    const user = auth.currentUser;

    if (!user) {
        // This should not happen if the component calling this is protected by AuthProvider,
        // but it's a good safeguard.
        throw new Error('No authenticated user found. Please log in.');
    }

    const idToken = await user.getIdToken();

    const headers = {
        ...(options.headers || {}),
        'Authorization': `Bearer ${idToken}`,
        // Most POST/PATCH requests will be JSON, this is a sensible default.
        'Content-Type': 'application/json',
    };
    
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        try {
            const errorData = await response.json();
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        } catch (e: unknown) {
             if (e instanceof Error && e.message.startsWith('Request failed')) {
                throw e;
            }
            throw new Error(response.statusText || `Request failed with status ${response.status}`);
        }
    }

    return response;
}
