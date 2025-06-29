import { Client, Events, GatewayIntentBits, Interaction } from 'discord.js';
import { config } from './config';
import fetch from 'node-fetch';

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
        // NOTE: This is a proxy for a general chat endpoint.
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
