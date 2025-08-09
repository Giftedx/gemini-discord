/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { fetchWithAppCheck } from '../services/backendService';

export const data = new SlashCommandBuilder()
  .setName('usage')
  .setDescription('Shows your API key request count for the current cycle.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;

    const backendResponse = await fetchWithAppCheck('/api/ai/getUsageStats', {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
    }
    
    const data = await backendResponse.json();
    const requestCount = data.requestCount ?? 0;

    await interaction.editReply({ content: `You have made ${requestCount} requests with your API key this cycle.` });
}
