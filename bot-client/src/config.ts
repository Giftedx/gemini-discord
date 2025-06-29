import dotenv from 'dotenv';

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, BACKEND_URL } = process.env;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID || !BACKEND_URL) {
  throw new Error('Missing environment variables. Please check your bot-client/.env file.');
}

export const config = {
  DISCORD_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  BACKEND_URL,
};
