/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { fetchWithAppCheck } from '../services/backendService';

export const data = new SlashCommandBuilder()
  .setName('set-key')
  .setDescription('Privately set your personal Gemini API key for the bot.')
  .addStringOption(option =>
    option.setName('api_key')
      .setDescription('Your Gemini API key. This command should only be used in DMs.')
      .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const apiKey = interaction.options.getString('api_key', true);
    const userId = interaction.user.id;

    const backendResponse = await fetchWithAppCheck('/api/ai/setUserApiKey', {
        method: 'POST',
        body: JSON.stringify({ userId, apiKey }),
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
    }

    await interaction.editReply({ content: 'Your API key has been securely saved and will be used for your future requests.' });
}
