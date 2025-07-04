import { Interaction } from 'discord.js';

/**
 * Custom error class for messages that are safe to be shown to the user.
 * This allows us to distinguish between expected errors (e.g., bad input)
 * and unexpected internal errors.
 */
export class UserVisibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserVisibleError';
  }
}

/**
 * Centralized error handler for all bot command interactions.
 * @param error The error object caught.
 * @param interaction The Discord interaction that triggered the error.
 */
export async function handleError(error: unknown, interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  let errorMessage = 'An unexpected error occurred. The issue has been logged for review.';

  if (error instanceof UserVisibleError) {
    // If it's a known, user-facing error, show the specific message.
    errorMessage = error.message;
  } else if (error instanceof Error) {
    // For other errors, log the full error for debugging but show a generic message.
    console.error(`Unhandled error for command ${interaction.commandName}:`, error);
  } else {
    // Handle cases where non-Error objects are thrown
    console.error(`An unknown error object was thrown for command ${interaction.commandName}:`, error);
  }

  // Check if the interaction has been deferred or replied to already.
  // This prevents the "interaction has already been replied to" error.
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ content: errorMessage, ephemeral: true });
  } else {
    await interaction.reply({ content: errorMessage, ephemeral: true });
  }
}
