import { ChatInputCommandInteraction, SlashCommandBuilder, ChannelType } from 'discord.js';
import { UserVisibleError } from '../handlers/ErrorHandler';
import { fetchWithAppCheck } from '../services/backendService';

export const data = new SlashCommandBuilder()
    .setName('workflow')
    .setDescription('Manage automated workflows.')
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Creates a new automated workflow.')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('A unique, friendly name for this workflow.')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('trigger')
                    .setDescription('The event that starts this workflow.')
                    .setRequired(true)
                    .addChoices(
                        { name: 'GitHub Push', value: 'GITHUB_PUSH' }
                        // Add other trigger types here in the future
                    ))
            .addStringOption(option =>
                option.setName('repository')
                    .setDescription('The GitHub repository to monitor (e.g., "owner/repo").')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('branch')
                    .setDescription('The specific branch within the repository to monitor.')
                    .setRequired(true))
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('The Discord channel where results will be posted.')
                    .addChannelTypes(ChannelType.GuildText) // Ensure it's a text channel
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('prompt')
                    .setDescription('The Gemini prompt template to execute for this workflow.')
                    .setRequired(true))
    );


async function handleCreateWorkflow(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    // Since GITHUB_PUSH is the only trigger, we can enforce its options for now.
    const triggerType = interaction.options.getString('trigger', true);
    if (triggerType !== 'GITHUB_PUSH') {
        throw new UserVisibleError('Invalid trigger type specified.');
    }

    if (!interaction.guildId) {
        throw new UserVisibleError('This command must be used within a server.');
    }

    const workflowPayload = {
        guildId: interaction.guildId,
        workflowName: interaction.options.getString('name', true),
        triggerType: triggerType,
        triggerConfig: {
            repo: interaction.options.getString('repository', true),
            branch: interaction.options.getString('branch', true),
        },
        actionType: 'GEMINI_PROMPT', // The action is to run a prompt
        actionConfig: {
            targetChannelId: interaction.options.getChannel('channel', true).id,
            promptTemplate: interaction.options.getString('prompt', true),
        },
        createdBy: interaction.user.id,
        isEnabled: true,
    };

    const backendResponse = await fetchWithAppCheck('/api/ai/createWorkflow', {
        method: 'POST',
        body: JSON.stringify(workflowPayload),
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        throw new Error(`Backend error: ${backendResponse.status} ${backendResponse.statusText} - ${errorText}`);
    }

    const data = await backendResponse.json();
    await interaction.editReply({ content: data.message || 'Workflow created successfully.' });
}

export async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'create') {
        await handleCreateWorkflow(interaction);
    } else {
        await interaction.reply({ content: 'Unknown workflow command.', ephemeral: true });
    }
}
