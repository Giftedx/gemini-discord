/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { fetchWithAppCheck } from '../services/backendService';

export const data = new SlashCommandBuilder()
  .setName('search')
  .setDescription('Answers a question using real-time web search.')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('The query to search the web for.')
      .setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const query = interaction.options.getString('query', true);
    const userId = interaction.user.id;

    const backendResponse = await fetchWithAppCheck('/api/ai/webSearchAssistedAnswer', {
        method: 'POST',
        body: JSON.stringify({ userId, query }),
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
    }

    const data = await backendResponse.json();
    await interaction.editReply(data.answer || 'No answer returned from web search.');
}
