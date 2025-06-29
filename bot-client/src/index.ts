import { Client, EmbedBuilder, Events, GatewayIntentBits, Interaction } from 'discord.js';
import { config } from './config';
import fetch from 'node-fetch';

// Define a type for the expected analysis response for better type safety
interface AnalysisResponse {
  language: string;
  summary: string;
  keyComponents: string[];
  dependencies: string[];
  potentialIssues: string[];
  userQueryResponse?: string;
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;
  console.log(`Received command: ${commandName}`);

  await interaction.deferReply();

  try {
    const userId = interaction.user.id;

    if (commandName === 'gemini') {
      const prompt = interaction.options.getString('prompt', true);
      const attachment = interaction.options.getAttachment('file');

      if (attachment) {
        // Handle file attachment: call processMultimodalContent
        if (!attachment.contentType?.startsWith('text/')) {
          await interaction.editReply('Unsupported file type. Please provide a text-based file.');
          return;
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
    } else if (commandName === 'analyze') {
      const attachment = interaction.options.getAttachment('file', true);
      const userPrompt = interaction.options.getString('prompt'); // This is optional

      if (!attachment.contentType?.startsWith('text/')) {
        await interaction.editReply('Unsupported file type. Please provide a text-based file for analysis.');
        return;
      }

      const fileResponse = await fetch(attachment.url);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch attachment: ${fileResponse.statusText}`);
      }
      const fileContent = await fileResponse.text();

      const backendResponse = await fetch(`${config.BACKEND_URL}/api/ai/analyzeCode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } else {
      await interaction.editReply({ content: `Command \`/${commandName}\` is not yet implemented.`});
    }

  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    if (interaction.replied || interaction.deferred) {
		await interaction.followUp({ content: `There was an error while executing this command: ${errorMessage}`, ephemeral: true });
	} else {
		await interaction.reply({ content: `There was an error while executing this command: ${errorMessage}`, ephemeral: true });
	}
  }
});

client.login(config.DISCORD_TOKEN);
