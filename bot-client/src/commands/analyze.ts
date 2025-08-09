/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { UserVisibleError } from '../handlers/ErrorHandler';
import { fetchWithAppCheck } from '../services/backendService';

// Define a type for the expected analysis response for better type safety
interface AnalysisResponse {
  language: string;
  summary: string;
  keyComponents: string[];
  dependencies: string[];
  potentialIssues: string[];
  userQueryResponse?: string;
}

export const data = new SlashCommandBuilder()
  .setName('analyze')
  .setDescription('Performs a detailed analysis of a provided code file.')
  .addAttachmentOption(option =>
    option.setName('file')
      .setDescription('The code file to analyze')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('prompt')
      .setDescription('An optional question about the code'));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const attachment = interaction.options.getAttachment('file', true);
    const userPrompt = interaction.options.getString('prompt');
    const userId = interaction.user.id;

    if (!attachment.contentType?.startsWith('text/')) {
        throw new UserVisibleError('Unsupported file type. Please provide a text-based file for analysis.');
    }

    const fileResponse = await fetch(attachment.url);
    if (!fileResponse.ok) {
        throw new Error(`Failed to fetch attachment: ${fileResponse.statusText}`);
    }
    const fileContent = await fileResponse.text();

    const backendResponse = await fetchWithAppCheck('/api/ai/analyzeCode', {
        method: 'POST',
        body: JSON.stringify({ userId, fileContent, userPrompt }),
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
    }

    const data: AnalysisResponse = await backendResponse.json();

    const analysisEmbed = new EmbedBuilder()
        .setColor(0x4A90E2) // A nice blue color
        .setTitle(`Code Analysis: ${attachment.name}`)
        .setDescription(data.summary || 'No summary provided.')
        .addFields(
            { name: 'Language', value: data.language || 'Undetermined' },
            { name: 'Key Components', value: data.keyComponents.length > 0 ? data.keyComponents.map(c => `• \`${c}\``).join('\n') : 'None found' },
            { name: 'Dependencies', value: data.dependencies.length > 0 ? data.dependencies.map(d => `\`${d}\``).join(', ') : 'None found' },
            { name: 'Potential Issues', value: data.potentialIssues.length > 0 ? data.potentialIssues.map(i => `• ${i}`).join('\n') : 'None found' }
        )
        .setTimestamp()
        .setFooter({ text: 'Powered by Gemini' });

    if (data.userQueryResponse) {
        analysisEmbed.addFields({ name: 'Response to Your Question', value: data.userQueryResponse });
    }

    await interaction.editReply({ embeds: [analysisEmbed] });
}
