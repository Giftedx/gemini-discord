/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
// gemini-discord/src/index.ts
    import { Client, GatewayIntentBits, Message, Attachment } from 'discord.js'; // Import Attachment
    import 'dotenv/config';
    import {
      Config,
      GeminiClient,
      ToolRegistry, // Import core's ToolRegistry
      FileService,
      GitService,
      TelemetryReporter,
      AuthType,
      ContentGeneratorConfig,
      GenerateContentRequest,
      GenerateContentResponse,
      Content,
      Part,
      ApprovalMode,
      ToolInvocation, // Import ToolInvocation
      ToolResult
    } from '@google/gemini-cli-core';
    // import { DiscordToolRegistry } from './toolRegistry'; // No longer needed
    import fetch from 'node-fetch';
    import * as fs from 'fs/promises'; // Import node's fs/promises for basic file operations (if allowed in sandbox)
    import * as path from 'path'; // Import node's path module


    // Workaround for node-fetch and globalThis.fetch
    if (!globalThis.fetch) {
      (globalThis as any).fetch = fetch;
    }

    async function main() {
      // Create a new client instance
      const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageCreate, GatewayIntentBits.DirectMessages], partials: ['CHANNEL'] }); // Added Partial for DMs

    // Store GeminiClient instances per channel/thread for conversation context
    const geminiClients = new Map<string, GeminiClient>();

    // Store ToolRegistry instances per channel/thread
    const toolRegistries = new Map<string, ToolRegistry>();

    // Define a base working directory for file operations (e.g., a designated workspace folder)
    // In a real bot, this might be per-user or per-guild, potentially linked to a repo clone.
    const BASE_WORKING_DIR = process.cwd(); // Use the bot's current working directory for simplicity


    // Basic configuration for the core logic
    // This function will create a Config object for a given message context
    function createBotConfig(message: Message): Config {
      const channelId = message.channel.id;

      return {
        getGeminiClient: function (): GeminiClient {
          // Get or create a GeminiClient instance for the channel/thread
          if (!geminiClients.has(channelId)) {
            geminiClients.set(channelId, new GeminiClient(this));
          }
          return geminiClients.get(channelId)!;
        },
        getToolRegistry: function (): ToolRegistry {
          // Get or create a core ToolRegistry instance for the channel/thread
           if (!toolRegistries.has(channelId)) {
               const coreToolRegistry = new ToolRegistry(this); // Instantiate core's ToolRegistry
               // You might register custom Discord-specific tools with coreToolRegistry here if needed
               toolRegistries.set(channelId, coreToolRegistry);
           }
           return toolRegistries.get(channelId)!;
        },
        getQuestion: function (): string | undefined {
          // In a Discord bot, the "question" is the user's message content
          return message.content;
        },
        getDebugMode: function (): boolean {
          // Can be controlled by an environment variable or command
          return process.env.DEBUG_MODE === 'true';
        },
        getApprovalMode: function (): ApprovalMode {
          // For a bot, AUTO is usually appropriate, but can be configured
          // For tools that require confirmation in the CLI, this would control that.
          return ApprovalMode.AUTO; // Assuming auto-approval for tool execution
        },
        getFullContext: function (): boolean {
          // Use full context in threads, limited context in others for now
          return message.channel.isThread();
        },
        getWorkingDir: function (): string {
          // Return the base working directory for file operations
          return BASE_WORKING_DIR;
        },
        getFileService: function (): FileService {
          // Implement FileService to interact with the bot's file system (within limits)
          return {
            readFile: async (filePath: string) => {
               console.log(`Discord FileService: Attempting to read file: ${filePath}`);
               const absolutePath = path.resolve(BASE_WORKING_DIR, filePath);
                // Basic security check: prevent reading files outside the working directory
                if (!absolutePath.startsWith(BASE_WORKING_DIR)) {
                    throw new Error('Attempted to access file outside working directory.');
                }
               try {
                   const content = await fs.readFile(absolutePath, 'utf-8');
                    return { path: filePath, content };
               } catch (error: any) {
                   console.error(`Error reading file ${filePath}:`, error);
                   throw new Error(`Failed to read file ${filePath}: ${error.message || error}`);
               }
            },
            listDirectory: async (dirPath: string) => {
              console.log(`Discord FileService: Attempting to list directory: ${dirPath}`);
              const absolutePath = path.resolve(BASE_WORKING_DIR, dirPath);
               // Basic security check
               if (!absolutePath.startsWith(BASE_WORKING_DIR)) {
                    throw new Error('Attempted to list directory outside working directory.');
               }
              try {
                  const entries = await fs.readdir(absolutePath, { withFileTypes: true });
                   return entries.map(entry => ({
                       name: entry.name,
                       isDirectory: entry.isDirectory(),
                       isFile: entry.isFile(),
                   }));
              } catch (error: any) {
                  console.error(`Error listing directory ${dirPath}:`, error);
                  throw new Error(`Failed to list directory ${dirPath}: ${error.message || error}`);
              }
            },
            writeFile: async (filePath: string, content: string) => {
               console.log(`Discord FileService: Attempting to write file: ${filePath}`);
               const absolutePath = path.resolve(BASE_WORKING_DIR, filePath);
                 // Basic security check: prevent writing files outside the working directory
                 if (!absolutePath.startsWith(BASE_WORKING_DIR)) {
                     throw new Error('Attempted to write file outside working directory.');
                 }
               try {
                   await fs.writeFile(absolutePath, content, 'utf-8');
                   console.log(`Successfully wrote to file: ${filePath}`);
                   return { path: filePath, success: true };
               } catch (error: any) {
                   console.error(`Error writing file ${filePath}:`, error);
                   throw new Error(`Failed to write file ${filePath}: ${error.message || error}`);
               }
            },
             // getFileContentsForContext might use readFile internally or handle multiple files
            getFileContentsForContext: async (paths: string[]) => {
                console.log(`Discord FileService: Fetching file contents for context: ${paths.join(', ')}`);
                const contents: { path: string; content: string }[] = [];
                for (const filePath of paths) {
                    try {
                         const fileContent = await this.getFileService().readFile(filePath); // Use the implemented readFile
                         contents.push(fileContent);
                    } catch (error) {
                         console.warn(`Could not get file content for context for ${filePath}: ${error}`);
                         // Optionally include an error or a placeholder in the response for this file
                    }
                }
                 // Decide how to format content for the model - joining or separate?
                 // For simplicity, joining them into a single content string for now
                 const joinedContent = contents.map(item => `--- File: ${item.path} ---\n${item.content}`).join('\n\n');
                 return { content: joinedContent, path: paths.join(', ') }; // Return joined content

            },
          };
        },
        getGitService: function (): Promise<GitService> {
           // Implement GitService to interact with a Git repository (if the working dir is a repo)
          return Promise.resolve({
            getGitDiff: async (options?: { base?: string; head?: string; filePath?: string }) => {
               console.log('Discord GitService: Attempting to get git diff.');
                // Placeholder: Execute git diff command in the working directory
                try {
                    // Example using exec (consider security and alternatives for production)
                    const diff = await new Promise<string>((resolve, reject) => {
                        require('child_process').exec('git diff', { cwd: BASE_WORKING_DIR }, (error: any, stdout: string, stderr: string) => {
                            if (error) {
                                console.error('git diff stderr:', stderr);
                                reject(error);
                            } else {
                                resolve(stdout);
                            }
                        });
                    });
                    return diff;
                } catch (error: any) {
                    console.error('Error executing git diff:', error);
                    throw new Error(`Failed to get git diff: ${error.message || error}`);
                }
            },
            getGitBranchName: async () => {
               console.log('Discord GitService: Attempting to get git branch name.');
                // Placeholder: Execute git branch command
                try {
                     const branchName = await new Promise<string>((resolve, reject) => {
                        require('child_process').exec('git branch --show-current', { cwd: BASE_WORKING_DIR }, (error: any, stdout: string, stderr: string) => {
                            if (error) {
                                console.error('git branch stderr:', stderr);
                                reject(error);
                            } else {
                                resolve(stdout.trim());
                            }
                        });
                     });
                     return branchName;
                } catch (error: any) {
                    console.error('Error executing git branch:', error);
                    // Return a default or indicate error if not in a git repo
                    return 'unknown-branch';
                }
            },
          });
        },
        getCheckpointingEnabled: function (): boolean {
          // Checkpointing can be enabled/disabled based on config
          return false;
        },
        getTelemetryConsent: function (): boolean {
          // Telemetry consent based on config or user opt-in
          return false;
        },
        getTelemetryId: function (): string {
          // Generate or retrieve a telemetry ID for the bot instance
          return process.env.TELEMETRY_ID || '';
        },
        getTelemetryReporter: function (): TelemetryReporter | undefined {
          // Integrate with a telemetry reporting service if needed
          return undefined;
        },
        getToolDiscoveryCommand: function (): string | undefined {
          // Command to trigger tool discovery (if applicable in Discord context)
          // This would be a shell command that outputs tool definitions
          return undefined; // Not using dynamic tool discovery via command for now
        },
        getToolCallCommand: function (): string | undefined {
          // Command prefix for explicit tool calls (if needed)
          // This would be a shell command to execute a tool by name and args
          return undefined; // Not using shell tool execution for now
        },
        getMcpServers: function (): { [key: string]: string; } | undefined {
          // MCP server configuration if used
          return undefined;
        },
        getMcpServerCommand: function (): string | undefined {
          // Command for interacting with MCP servers
          return undefined;
        },
        getUserMemory: function (): string | undefined {
          // Implement user memory storage if needed for personalized interactions
          return undefined;
        },
        getContentGeneratorConfig: function (): ContentGeneratorConfig {
          // Configuration for the content generator (Gemini API)
          return {
            apiKey: process.env.GEMINI_API_KEY, // Get API key from environment variables
            authType: AuthType.USE_GEMINI, // Using API Key authentication
          };
        },
        refreshAuth: function (_authType: AuthType): Promise<void> {
          // Not needed for API Key auth
          return Promise.resolve();
        },
        getModel: function (): string {
          // Allow configuring the model, or use a default
          return process.env.GEMINI_MODEL || 'gemini-pro';
        },
        setModel: function (_model: string): void {
          // Not implemented for this basic config
        },
        getEmbeddingModel: function (): string {
          // Allow configuring the embedding model, or use a default
          return process.env.GEMINI_EMBEDDING_MODEL || 'embedding-001';
        },
        flashFallbackHandler: undefined, // Implement a fallback handler if needed
        getProxy: function (): string | undefined {
          // Proxy configuration if needed
          return process.env.HTTPS_PROXY;
        },
        getSessionId: function (): string {
          // Use channel or thread ID as session ID for context
          return message.channel.id;
        },
        getAuthType: function (): AuthType {
          return AuthType.USE_GEMINI;
        },
        codeAssistEnabled: function (): boolean {
            // Code assist features might not be directly applicable in a chat bot
            return false;
        },
        getChatHistory: async function (): Promise<Content[]> {
           // Dynamically generate chat history from Discord message history
           return getChatHistory(message.channel);
        },
        getToken: function (): string | undefined {
           // Return the API key for the core package
           return process.env.GEMINI_API_KEY;
        },
      };
    }


    // Log in to Discord with your client's token
    client.once('ready', () => {
      console.log('Gemini Discord Bot is online!');
    });

    // Register slash commands
    client.once('ready', async () => {
      console.log('Registering slash commands...');
      try {
        // Define slash commands
        const commands = [
          {
            name: 'gemini',
            description: 'Interact with the Gemini AI.',
            options: [
              {
                name: 'prompt',
                type: 3, // STRING
                description: 'Your prompt for Gemini.',
                required: true,
              },
            ],
          },
          {
            name: 'analyze',
            description: 'Analyze an uploaded file.',
            options: [
              {
                 name: 'file',
                 type: 11, // ATTACHMENT
                 description: 'The file to analyze.',
                 required: true,
              }
           ]
          },
          {
            name: 'search',
            description: 'Search the web using Gemini.',
            options: [{ name: 'query', type: 3, description: 'Your search query.', required: true }],
          },
          {
            name: 'workflow',
            description: 'Execute an automated workflow.',
             options: [
                 {
                      name: 'name',
                      type: 3, // STRING
                      description: 'The name of the workflow to execute.',
                      required: true,
                 },
                 // Add options for workflow parameters if needed
             ]
          },
           {
               name: 'ping',
               description: 'Check if the bot is online.'
           }
        ];

        // Register commands globally or per guild
        // await client.application?.commands.set(commands); // Global registration (can take time)
        // console.log('Global slash commands registered!');

        // Example: Register commands for a specific guild (faster for testing)
        const guildId = process.env.DISCORD_GUILD_ID; // Get guild ID from environment variable
        if (guildId) {
            const guild = client.guilds.cache.get(guildId);
            if (guild) {
                await guild.commands.set(commands);
                console.log(`Slash commands registered for guild: ${guild.name}`);
            } else {
                console.error(`Guild with ID ${guildId} not found.`);
            }
        } else {
            console.log('DISCORD_GUILD_ID not set, skipping guild command registration.');
        }


        console.log('Slash commands registration process completed.');
      } catch (error) {
        console.error('Error registering slash commands:', error);
      }
    });


    // Helper function to get chat history from Discord messages
    async function getChatHistory(channel: Message['channel']): Promise<Content[]> {
        if (!channel.isThread()) {
            return []; // Only get history for threads for now
        }

        try {
            // Fetch last 50 messages in the thread (Discord API limit)
            const messages = await channel.messages.fetch({ limit: 50 });

            // Format messages for Gemini, ensuring chronological order
            const history: Content[] = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp).map(msg => {
                const role = msg.author.id === client.user?.id ? 'model' : 'user';
                // Basic text part for now, extend to handle attachments/embeddings later
                return {
                    role,
                    parts: [{ text: msg.content } as Part], // Cast to Part
                };
            });

             // Remove the last message if it's from the bot itself (the command acknowledgment or tool execution message)
            if (history.length > 0 && history[history.length - 1].role === 'model') {
                // Check if the last message is a command acknowledgment or tool execution message
                 const lastMessageText = history[history.length - 1].parts?.[0]?.text;
                 if (lastMessageText?.startsWith('/') || lastMessageText?.startsWith('Executing tool:')) {
                     history.pop();
                 }
            }


            return history;

        } catch (error) {
            console.error('Error fetching chat history:', error);
            return []; // Return empty history on error
        }
    }


    // Event listener for messages
    client.on('messageCreate', async message => {
      // Ignore messages from bots or empty messages
      if (message.author.bot || message.content.trim() === '') return;

      // Ignore messages that are not mentions of the bot if not in a thread
        const botMention = `<@${client.user?.id}>`;
        const isMentioned = message.content.startsWith(botMention);
        const isThread = message.channel.isThread();

        if (!isThread && !isMentioned) {
            return; // Only respond to mentions outside of threads
        }

        // Remove mention from message content if present
        const prompt = isMentioned ? message.content.slice(botMention.length).trim() : message.content;

      // Handle simple commands like /ping directly here if not using slash commands for them
       if (prompt === '/ping' && !message.guildId) { // Only handle /ping message command in DMs or if slash command fails
           await message.reply('Pong!');
           return;
       }


      // Create a bot config for the current message context
      const botConfig = createBotConfig(message);
      const geminiClient = botConfig.getGeminiClient();
      const toolRegistry = botConfig.getToolRegistry(); // Get the core's ToolRegistry


        try {
             await message.channel.sendTyping(); // Show typing indicator

             // Get chat history for context if in a thread
             const chatHistory = isThread ? await botConfig.getChatHistory() : undefined; // Use botConfig.getChatHistory

             let conversation: Content[] = chatHistory || [];
             conversation.push({ role: 'user', parts: [{ text: prompt } as Part] });

            // Initialize message content for the loop
             let currentMessageContent: GenerateContentRequest | null = {
                 contents: conversation,
                 tool_config: { function_calling_config: { mode: 'AUTO' } }, // Enable function calling
             };

            // Loop to handle multi-turn interactions (like tool use)
             while (currentMessageContent) {
                 const responseStream = geminiClient.sendMessageStream(currentMessageContent, new AbortController().signal);

                 let fullResponse = '';
                 let toolCalls: ToolInvocation[] | null = null; // Use ToolInvocation type

                 for await (const chunk of responseStream) {
                     const candidate = chunk.candidates?.[0];
                     if (candidate?.content?.parts) {
                         const textPart = candidate.content.parts
                             .filter(part => part.text)
                             .map(part => part.text)
                             .join('');

                         if (textPart) {
                             fullResponse += textPart;
                         }

                          // Check for tool calls in the response
                          // A tool call part has a 'toolCalls' property
                          const toolCallPart = candidate.content.parts.find(part => (part as any).toolCalls);
                           if (toolCallPart && (toolCallPart as any).toolCalls) {
                              toolCalls = (toolCallPart as any).toolCalls as ToolInvocation[]; // Cast to ToolInvocation[]
                          }
                     }
                 }

                 if (fullResponse) {
                     // Split long responses into multiple messages if necessary
                     const MAX_MESSAGE_LENGTH = 2000;
                     while (fullResponse.length > 0) {
                         const chunk = fullResponse.substring(0, MAX_MESSAGE_LENGTH);
                         await message.reply(chunk);
                         fullResponse = fullResponse.substring(MAX_MESSAGE_LENGTH);
                     }
                     // Add model's text response to conversation history
                     conversation.push({ role: 'model', parts: [{ text: fullResponse } as Part] });
                     currentMessageContent = null; // Exit loop after receiving text response

} else if (toolCalls && toolCalls.length > 0) {
                     console.log('Tool calls suggested:', toolCalls);

                     // Execute all tool calls concurrently
                     const toolExecutionPromises = toolCalls.map(async (toolCall) => {
                         try {
                             await message.channel.send(`Executing tool: \`${toolCall.function.name}\` with args: \`${JSON.stringify(toolCall.function.args)}\``);
                             const toolResult: ToolResult = await toolRegistry.invokeTool(toolCall);
                             console.log(`Tool "${toolCall.function.name}" executed successfully. Result:`, toolResult);
                             return {
                                 functionResponse: {
                                     name: toolCall.function.name,
                                     response: toolResult,
                                 },
                             } as Part;
                         } catch (toolError) {
                             console.error(`Error executing tool "${toolCall.function.name}":`, toolError);
                             await message.channel.send(`Error executing tool: \`${toolCall.function.name}\`. ${toolError instanceof Error ? toolError.message : String(toolError)}\nPlease try again or ask for assistance.`, { reply: { messageReference: message.id } });
                             return {
                                 functionResponse: {
                                     name: toolCall.function.name,
                                     response: {
                                         llmContent: `Error executing tool "${toolCall.function.name}": ${toolError instanceof Error ? toolError.message : String(toolError)}`,
                                         returnDisplay: `Error executing tool "${toolCall.function.name}"`,
                                     } as ToolResult,
                                 },
                             } as Part;
                         }
                     });

                     const toolResults = await Promise.all(toolExecutionPromises);

                     // Add tool calls and results to conversation history
                     conversation.push({
                         role: 'model',
                         parts: [{ toolCalls: toolCalls } as Part],
                     });
                     conversation.push({ role: 'function', parts: toolResults });

                     // Continue the conversation with the tool results included
                     currentMessageContent = { contents: conversation, tool_config: { function_calling_config: { mode: 'AUTO' } } };

                 } else {
                     await message.reply('Received an empty response from Gemini.');
                     currentMessageContent = null; // Exit loop if no response and no tool calls
                 }
             }

        } catch (error) {
          console.error('Error processing message:', error);
          await message.reply('Sorry, there was an error processing your request. Please try again.'); // Provide more helpful error message
        }
    });


    // Interaction handler for slash commands
    client.on('interactionCreate', async interaction => {
      if (!interaction.isCommand()) return;

      const { commandName } = interaction;

      // Create a bot config for the current interaction context (using a dummy message for now)
      // A more robust solution might create a custom context object or adapt botConfig
      const dummyMessage = interaction.channel ? ({ channel: interaction.channel, author: interaction.user, guildId: interaction.guildId, content: `${interaction.commandName} command` } as Message) : undefined;

      if (!dummyMessage) {
          console.error('Could not create dummy message for interaction context.');
          await interaction.reply({ content: 'Sorry, there was an error processing this command.', ephemeral: true });
          return;
      }

      const botConfig = createBotConfig(dummyMessage); // Use dummy message for config creation
      const geminiClient = botConfig.getGeminiClient();
      const toolRegistry = botConfig.getToolRegistry(); // Get the core's ToolRegistry


      try {
           await interaction.deferReply(); // Defer the reply as processing may take time

           let prompt = '';
           let attachment: Attachment | undefined = undefined; // Specify attachment type
           let workflowName = '';
           let query = '';

            // Extract command options
           if (commandName === 'gemini') {
             prompt = interaction.options.getString('prompt', true);
           } else if (commandName === 'analyze') {
              attachment = interaction.options.getAttachment('file', true);
              // Refine prompt for analysis
              prompt = `Analyze the following file named "${attachment.name}". Focus on its content, structure, and purpose.`;
           } else if (commandName === 'search') {
              query = interaction.options.getString('query', true);
              // Refine prompt for search
              prompt = `Search the web for information about: ${query}. Provide a summary of the key findings and relevant links.`;
           } else if (commandName === 'workflow') {
                workflowName = interaction.options.getString('name', true);
                // Refine prompt for workflow execution
                prompt = `Execute workflow: ${workflowName}.`; // Add instructions for any required parameters
                // Extract other workflow parameters if defined in slash command options
           } else if (commandName === 'ping') {
                await interaction.editReply('Pong!');
                return; // Exit for ping command
           } else {
               await interaction.editReply('Unknown command.');
               return;
           }


           let conversation: Content[] = [];

            // Add attachment as a part if analyzing a file
           if (attachment) {
                try {
                    // Fetch file content
                    const response = await fetch(attachment.url);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch file: ${response.statusText}`);
                    }
                     // TODO: Handle different file types (text, binary) correctly for multimodal input
                    const fileContent = await response.text(); // Assuming text content for now

                    conversation.push({
                         role: 'user',
                         parts: [
                            { text: `${prompt}:\n\n` },
                            { text: fileContent } as Part // Assuming text content for now
                            // For multimodal, you might need to handle binary data differently
                            // based on the core's expectations and the Gemini API capabilities.
                            // This might involve converting to base64 and specifying a mime_type.
                         ]
                    });

                } catch (fileError) {
                    console.error('Error fetching or processing attachment:', fileError);
                    await interaction.editReply('Sorry, there was an error processing the attached file.');
                    return; // Exit on file error
                }
           } else {
                conversation.push({ role: 'user', parts: [{ text: prompt } as Part] });
           }


           let currentMessageContent: GenerateContentRequest | null = {
                 contents: conversation,
                 tool_config: { function_calling_config: { mode: 'AUTO' } }, // Enable function calling
           };

            let fullResponse = '';

            // Loop to handle multi-turn interactions (like tool use)
             while (currentMessageContent) {
                 const responseStream = geminiClient.sendMessageStream(currentMessageContent, new AbortController().signal);

                 let toolCalls: ToolInvocation[] | null = null; // Use ToolInvocation type
                 fullResponse = ''; // Reset fullResponse for each turn

                 for await (const chunk of responseStream) {
                     const candidate = chunk.candidates?.[0];
                     if (candidate?.content?.parts) {
                         const textPart = candidate.content.parts
                             .filter(part => part.text)
                             .map(part => part.text)
                             .join('');

                         if (textPart) {
                             fullResponse += textPart;
                         }

                          const toolCallPart = candidate.content.parts.find(part => (part as any).toolCalls);
                           if (toolCallPart && (toolCallPart as any).toolCalls) {
                              toolCalls = (toolCallPart as any).toolCalls as ToolInvocation[];
                          }
                     }
                 }

                 if (fullResponse) {
                      // Edit the deferred reply with the response
                     await interaction.editReply(fullResponse);
                     // Add model's text response to conversation history
                     conversation.push({ role: 'model', parts: [{ text: fullResponse } as Part] });
                     currentMessageContent = null; // Exit loop after receiving text response

                 } else if (toolCalls && toolCalls.length > 0) {
                      // Handle tool calls
                     console.log('Tool calls suggested:', toolCalls);

                     const toolResults: Part[] = []; // Collect results to send back to model

                      // Execute each suggested tool call (for simplicity, doing sequentially)
                      for (const toolCall of toolCalls) {
                          try {
                                await interaction.followUp({ content: `Executing tool: \`${toolCall.function.name}\` with args: \`${JSON.stringify(toolCall.function.args)}\``, ephemeral: true }); // Use followUp for subsequent messages

                                // Execute the tool using the core's ToolRegistry
                                const toolResult: ToolResult = await toolRegistry.invokeTool(toolCall);

                                // Add the tool result to the collection for the next turn
                                toolResults.push({
                                    functionResponse: {
                                        name: toolCall.function.name,
                                        response: toolResult, // Pass the full ToolResult here
                                    },
                                });

                                console.log(`Tool "${toolCall.function.name}" executed successfully. Result:`, toolResult);

                          } catch (toolError) {
                                console.error(`Error executing tool "${toolCall.function.name}":`, toolError);
                                await interaction.followUp({ content: `Error executing tool: \`${toolCall.function.name}\`. ${toolError instanceof Error ? toolError.message : String(toolError)}\nPlease try again or ask for assistance.`, ephemeral: true });

                                // Add an error result to the collection so the model is aware of the failure
                                toolResults.push({
                                     functionResponse: {
                                         name: toolCall.function.name,
                                         response: {
                                             llmContent: `Error executing tool "${toolCall.function.name}": ${toolError instanceof Error ? toolError.message : String(toolError)}`,
                                             returnDisplay: `Error executing tool "${toolCall.function.name}"`,
                                         } as ToolResult, // Cast to ToolResult
                                     },
                                 });
                               // Continue to execute other tools in the list even if one fails
                          }
                      }

                                             // After executing all tool calls, send the results back to the model
                       // Note: We need to add the tool *invocations* from the model response
                       // and the tool *results* from our execution to the conversation history.
                       // The core expects the model's tool calls first, then the function responses.

                       // Add tool calls and results to conversation history
                       conversation.push({
                           role: 'model',
                           parts: [{ toolCalls: toolCalls } as Part],
                       });
                       conversation.push({ role: 'function', parts: toolResults });

                       // Continue the conversation with the tool results included
                       currentMessageContent = { contents: conversation, tool_config: { function_calling_config: { mode: 'AUTO' } } };
                   } else {
                       await interaction.editReply('Received an empty response from Gemini.');
                       currentMessageContent = null; // Exit loop if no response and no tool calls
                   }
               }

           } catch (error) {
               console.error('Error processing interaction:', error);
               await interaction.editReply('Sorry, there was an error processing your request. Please try again.');
           }
       });

       // Start the bot
       client.login(process.env.DISCORD_TOKEN);
    }

    // Start the application
    main().catch((error) => {
      console.error('Error starting bot:', error);
      process.exit(1);
    });
