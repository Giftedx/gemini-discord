/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { UserVisibleError } from '../handlers/ErrorHandler';
import { fetchWithAppCheck } from '../services/backendService';

export const data = new SlashCommandBuilder()
  .setName('gemini')
  .setDescription('Chat with the Gemini model, optionally with a file.')
  .addStringOption(option =>
    option.setName('prompt')
      .setDescription('The prompt for the model')
      .setRequired(true))
  .addAttachmentOption(option =>
    option.setName('file')
      .setDescription('A text, image, or PDF file to include in the prompt context'));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt', true);
    const attachment = interaction.options.getAttachment('file');
    const userId = interaction.user.id;

    if (attachment) {
        // Handle file attachment: call processMultimodalContent
        const contentType = attachment.contentType;
        if (!contentType?.startsWith('text/') && !contentType.startsWith('image/') && contentType !== 'application/pdf') {
            throw new UserVisibleError('Unsupported file type. Please provide a text, image, or PDF file.');
        }

        const fileResponse = await fetch(attachment.url);
        if (!fileResponse.ok) {
            throw new Error(`Failed to fetch attachment: ${fileResponse.statusText}`);
        }
        const fileBuffer = await fileResponse.buffer();
        // Convert the file to a Base64 data URI for the backend
        const fileDataUri = `data:${attachment.contentType};base64,${fileBuffer.toString('base64')}`;

        const backendResponse = await fetchWithAppCheck('/api/ai/processMultimodalContent', {
            method: 'POST',
            body: JSON.stringify({ userId, prompt, fileDataUri }),
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
        }

        const data = await backendResponse.json();
        // The backend returns an object with an 'analysis' property
        await interaction.editReply(data.analysis || 'No analysis returned.');

    } else {
        // Handle text-only prompt: call summarizeDiscordConversation as a proxy for a simple text chat
        const backendResponse = await fetchWithAppCheck('/api/ai/summarizeDiscordConversation', {
            method: 'POST',
            body: JSON.stringify({ userId, threadText: prompt }),
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
        }

        const data = await backendResponse.json();
        // The backend returns an object with a 'summary' property
        await interaction.editReply(data.summary || 'No summary returned.');
    }
}
