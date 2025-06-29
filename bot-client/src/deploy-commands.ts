import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { SlashCommandBuilder } from 'discord.js';
import { config } from './config';

const commands = [
  new SlashCommandBuilder()
    .setName('gemini')
    .setDescription('Chat with the Gemini model, optionally with a file.')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('The prompt for the model')
        .setRequired(true))
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('A text-based file to include in the prompt context')),

  new SlashCommandBuilder()
    .setName('analyze')
    .setDescription('Performs a detailed analysis of a provided code file.')
    .addAttachmentOption(option =>
      option.setName('file')
        .setDescription('The code file to analyze')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('An optional question about the code')),

  new SlashCommandBuilder()
    .setName('set-key')
    .setDescription('Privately set your personal Gemini API key for the bot.')
    .addStringOption(option =>
      option.setName('api_key')
        .setDescription('Your Gemini API key. This command should only be used in DMs.')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('search')
    .setDescription('Answers a question using real-time web search.')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The query to search the web for.')
        .setRequired(true)),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
