/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import dotenv from 'dotenv';

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, BACKEND_URL, FIREBASE_APP_ID } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID || !BACKEND_URL || !FIREBASE_APP_ID) {
  throw new Error('Missing environment variables. Please check your bot-client/.env file.');
}

export const config = {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  BACKEND_URL,
  FIREBASE_APP_ID,
};
