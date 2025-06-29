import fetch, { RequestInit, Response } from 'node-fetch';
import { getAppCheckToken } from './appCheckService';
import { config } from '../config';

/**
 * A wrapper around node-fetch that automatically adds the
 * Firebase App Check token to requests to our backend.
 * @param endpoint The backend API endpoint (e.g., '/api/ai/analyzeCode').
 * @param options The node-fetch request options.
 * @returns The fetch Response object.
 */
export async function fetchWithAppCheck(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const appCheckToken = await getAppCheckToken();

    const headers = {
        ...(options.headers || {}),
        'Content-Type': 'application/json',
        'X-Firebase-AppCheck': appCheckToken,
    };

    const url = `${config.BACKEND_URL}${endpoint}`;

    return fetch(url, {
        ...options,
        headers,
    });
}
