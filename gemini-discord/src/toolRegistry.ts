/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  ToolRegistry,
  Tool,
  ToolResult,
  ToolCallPart,
} from '@google/gemini-cli-core';
// ... (rest of the imports)
import google from 'googlethis';
import { URL } from 'url';

export class DiscordToolRegistry implements ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Registers a single tool with the registry.
   * @param tool The tool to register.
   */
  async registerTool(tool: Tool): Promise<void> {
    // Store the tool in the internal map, keyed by its name.
    this.tools.set(tool.name, tool);
  }

  /**
   * Retrieves all registered tools.
   * @returns A promise that resolves to an array of registered tools.
   */
  async getTools(): Promise<Tool[]> {
    // Return all values (Tool objects) from the internal map as an array.
    return Array.from(this.tools.values());
  }

  /**
   * Retrieves a specific tool by its name.
   * @param name The name of the tool to retrieve.
   * @returns A promise that resolves to the Tool object if found, or undefined otherwise.
   */
  async getTool(name: string): Promise<Tool | undefined> {
    // Return the tool from the internal map based on its name.
    return this.tools.get(name);
  }

  /**
   * Runs a registered tool based on the provided tool call.
   * @param toolCall The tool call object containing the tool name and arguments.
   * @returns A promise that resolves to a ToolResult object containing the result of the tool execution.
   */
  async runTool(toolCall: ToolCallPart): Promise<ToolResult> {
    // Log the attempt to run a tool and its arguments for debugging.
    console.log(`Attempting to run tool: ${toolCall.functionCall.name}`);
    console.log(`Arguments: ${JSON.stringify(toolCall.functionCall.args)}`);

    // Extract the tool name and arguments from the tool call object.
    const toolName = toolCall.functionCall.name;
    const toolArgs = toolCall.functionCall.args;

    console.log(
      `Running tool: ${toolName} with args: ${JSON.stringify(toolArgs)}`,
    );

    // Initialize an empty string to store the tool's output.
    let output = '';

    // Use a switch statement to handle different tool names.
    switch (toolName) {
      case 'web_search':
        try {
          // Extract the search query from the tool arguments
          const query = toolArgs.query; // Assuming the argument name is 'query'

          if (!query) {
            throw new Error('Search query is missing.');
          }

          // Perform web search using googlethis
          const searchResults = await google.search(query, {
            hl: 'en',
            gl: 'us',
            safe: false, // Adjust as needed
          });

          // Format the search results into a JSON string
          const formattedResults = {
            query: query,
            results: searchResults.results.map(
              (result: { title: any; url: any; description: any }) => ({
                title: result.title,
                url: result.url,
                snippet: result.description,
              }),
            ),
          };
          output = JSON.stringify(formattedResults);
        } catch (error) {
          console.error('Error during web search:', error);
          output = JSON.stringify({
            error: `Web search failed: ${error.message}`,
          });
        }
        break;

      case 'file_analyzer':
        // Placeholder for file analyzer implementation
        output = `Successfully ran file_analyzer tool with args: ${JSON.stringify(toolArgs)}`;
        break;
      default:
        // Handle cases where the tool name is not recognized or implemented.
        output = JSON.stringify({
          error: `Tool '${toolName}' not found or not implemented.`,
        });
        break;
    }

    return { toolCallId: toolCall.toolCallId, result: output };
  }

  /**
   * Registers multiple tools with the registry.
   * @param tools An array of tools to register.
   */
  async registerTools(tools: Tool[]): Promise<void> {
    // Iterate through the array of tools and register each one individually.
    for (const tool of tools) {
      await this.registerTool(tool);
    }
  }
}
