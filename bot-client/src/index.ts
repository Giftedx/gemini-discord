import { Client, Events, GatewayIntentBits, Interaction } from 'discord.js';
import { config } from './config';

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

  try {
    // Placeholder reply. We will add API call logic here later.
    await interaction.reply({
        content: `Processing your request for the \`/${commandName}\` command...`,
        ephemeral: true 
    });
    
  } catch (error) {
    console.error(`Error executing command ${commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
		await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
	} else {
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
  }
});

client.login(config.DISCORD_TOKEN);
