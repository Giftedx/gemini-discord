import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { config } from '../config';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('usage')
  .setDescription('Shows your API key request count for the current cycle.');

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const userId = interaction.user.id;

    const backendResponse = await fetch(`${config.BACKEND_URL}/api/ai/getUsageStats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
