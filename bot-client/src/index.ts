import { Client, Collection, Events, GatewayIntentBits, Interaction } from 'discord.js';
import { config } from './config';
import fs from 'node:fs';
import path from 'node:path';
import { handleError } from './handlers/ErrorHandler';

// Extend Client to include a commands property for storing loaded commands
class BotClient extends Client {
    commands: Collection<string, any>;

    constructor(options: any) {
        super(options);
        this.commands = new Collection();
    }
}

const client = new BotClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

// Load commands dynamically from the /commands directory
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
        console.log(`[INFO] Loaded command: /${command.data.name}`);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

// Central interaction listener (command router)
client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    await interaction.reply({ content: `Command \`/${interaction.commandName}\` was not found.`, ephemeral: true});
    return;
  }

  try {
    // Execute the command, passing the interaction object
    await command.execute(interaction);
  } catch (error) {
    // Use the centralized error handler
    await handleError(error, interaction);
  }
});

client.login(config.DISCORD_TOKEN);
