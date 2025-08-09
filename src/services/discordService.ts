/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

'use server';

/**
 * @fileOverview A service for interacting directly with the Discord API from the backend.
 */

// This service relies on the DISCORD_TOKEN environment variable being available
// in the backend's execution environment (e.g., set via Cloud Run secrets).
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_API_BASE = 'https://discord.com/api/v10';

if (!DISCORD_TOKEN) {
    console.warn("DISCORD_TOKEN environment variable not set. The backend will be unable to post messages to Discord.");
}


/**
 * Posts a message to a specific Discord channel.
 * @param channelId The ID of the channel to post the message to.
 * @param content The text content of the message.
 * @returns A promise that resolves when the message is sent.
 */
export async function postToChannel(channelId: string, content: string): Promise<void> {
    if (!DISCORD_TOKEN) {
        throw new Error("Cannot post to Discord: DISCORD_TOKEN is not configured on the backend.");
    }

    const url = `${DISCORD_API_BASE}/channels/${channelId}/messages`;
    const body = {
        content: content,
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bot ${DISCORD_TOKEN}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error sending message to Discord:', errorData);
            throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
        }

        console.log(`Successfully sent message to channel ${channelId}`);
    } catch (error) {
        console.error('Failed to post message to Discord:', error);
        throw error; // Re-throw the error to be caught by the calling flow
    }
}
