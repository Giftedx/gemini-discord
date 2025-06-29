import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { config } from '../config';
import fetch from 'node-fetch';
import { UserVisibleError } from '../handlers/ErrorHandler';

export const data = new SlashCommandBuilder()
  .setName('gemini')
  .setDescription('Chat with the Gemini model, optionally with a file.')
  .addStringOption(option =>
    option.setName('prompt')
      .setDescription('The prompt for the model')
      .setRequired(true))
  .addAttachmentOption(option =>
    option.setName('file')
      .setDescription('A text-based file to include in the prompt context'));

export async function execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt', true);
    const attachment = interaction.options.getAttachment('file');
    const userId = interaction.user.id;

    if (attachment) {
        // Handle file attachment: call processMultimodalContent
        if (!attachment.contentType?.startsWith('text/')) {
            throw new UserVisibleError('Unsupported file type. Please provide a text-based file.');
        }

        const fileResponse = await fetch(attachment.url);
        if (!fileResponse.ok) {
            throw new Error(`Failed to fetch attachment: ${fileResponse.statusText}`);
        }
        const fileBuffer = await fileResponse.buffer();
        const fileDataUri = `data:${attachment.contentType};base64,${fileBuffer.toString('base64')}`;

        const backendResponse = await fetch(`${config.BACKEND_URL}/api/ai/processMultimodalContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, prompt, fileDataUri }),
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
        }

        const data = await backendResponse.json();
        await interaction.editReply(data.analysis || 'No analysis returned.');

    } else {
        // Handle text-only prompt: call summarizeDiscordConversation
        const backendResponse = await fetch(`${config.BACKEND_URL}/api/ai/summarizeDiscordConversation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, threadText: prompt }),
        });

        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
        }

        const data = await backendResponse.json();
        await interaction.editReply(data.summary || 'No summary returned.');
    }
}
