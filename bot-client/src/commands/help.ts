/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Provides information about available commands.')
  .addStringOption(option =>
    option.setName('command')
      .setDescription('The specific command you want help with.')
      .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
  const commands = interaction.client.commands;
  const commandName = interaction.options.getString('command');

  if (!commandName) {
    // General help embed
    const helpEmbed = new EmbedBuilder()
      .setColor(0x4A90E2)
      .setTitle('Bot Commands')
      .setDescription('Here is a list of all available commands. For more details on a specific command, use `/help [command_name]`.');

    commands.forEach(command => {
      helpEmbed.addFields({ name: `/${command.data.name}`, value: command.data.description || 'No description provided.' });
    });

    await interaction.reply({ embeds: [helpEmbed] });

  } else {
    // Specific command help
    const command = commands.get(commandName.toLowerCase());

    if (!command) {
      await interaction.reply({ content: `Sorry, I can't find a command called \`${commandName}\`.`, ephemeral: true });
      return;
    }

    const commandData = command.data.toJSON();

    const commandEmbed = new EmbedBuilder()
      .setColor(0x4A90E2)
      .setTitle(`Help: /${commandData.name}`)
      .setDescription(commandData.description || 'No description provided.');

    if (commandData.options && commandData.options.length > 0) {
      const optionsList = commandData.options.map(option => {
        return `**\`${option.name}\`**: ${option.description}\n*Required: ${option.required ? 'Yes' : 'No'}*`;
      }).join('\n\n');
      commandEmbed.addFields({ name: 'Options', value: optionsList });
    } else {
      commandEmbed.addFields({ name: 'Options', value: 'This command does not take any options.' });
    }

    await interaction.reply({ embeds: [commandEmbed] });
  }
}
