import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { fetchWithAppCheck } from '../services/backendService';

export const data = new SlashCommandBuilder()
    .setName('create')
    .setDescription('Generates creative content.')
    .addSubcommand(subcommand =>
        subcommand
            .setName('image')
            .setDescription('Generates an image from a text prompt.')
            .addStringOption(option =>
                option.setName('prompt')
                    .setDescription('The prompt to generate the image from.')
                    .setRequired(true))
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'image') {
        await handleCreateImage(interaction);
    } else {
        await interaction.reply({ content: 'Unknown create command.', ephemeral: true });
    }
}

async function handleCreateImage(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const prompt = interaction.options.getString('prompt', true);
    const userId = interaction.user.id;

    const backendResponse = await fetchWithAppCheck('/api/ai/createImage', {
        method: 'POST',
        body: JSON.stringify({ userId, prompt }),
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
    }

    const { imageUrl } = await backendResponse.json();

    // Convert data URI to buffer for attachment
    const base64Data = imageUrl.substring(imageUrl.indexOf(',') + 1);
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const attachment = new AttachmentBuilder(imageBuffer, { name: 'generated-image.png' });

    const embed = new EmbedBuilder()
        .setColor(0x34A853) // Green for success/creation
        .setTitle('Image Generation Complete')
        .setDescription(`**Prompt:** ${prompt}`)
        .setImage('attachment://generated-image.png') // Reference the attached file
        .setTimestamp()
        .setFooter({ text: 'Powered by Gemini' });

    await interaction.editReply({ embeds: [embed], files: [attachment] });
}
