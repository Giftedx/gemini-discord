# Gemini Collaborative Suite for Discord - Backend

This repository contains the backend services for the **Gemini Collaborative Suite**, a powerful application designed to supercharge Discord servers with Google's Gemini AI. This backend is built with Next.js and Genkit, providing a robust and scalable foundation for intelligent, collaborative features.

## Key Features

This backend provides the core logic that the Gemini-Discord bot consumes.

-   **Discord API Integration & Command Handler:** Listens for Discord webhook events, parses commands, and routes them to the appropriate Genkit flows.
-   **Multimodal Content Processing:** Receives file uploads from Discord (code, text files) and incorporates their content into prompts for the Gemini model, enabling analysis of user-provided documents.
-   **Persistent Conversation Context Management:** Stores and retrieves conversation histories based on Discord thread ID to maintain long, context-aware conversations. (Note: This is managed by the Discord bot client, which calls the stateless backend services).
-   **Secure User-Specific Credential Management:** Allows users to securely submit their personal Gemini API key, which is then used for all their subsequent requests, enabling customized access and usage tracking.
-   **Advanced Code Analysis:** Provides structured, in-depth analysis of code files, identifying language, summarizing purpose, and highlighting potential issues.
-   **Web Search Integration:** Equips the AI with a tool to perform real-time web searches, allowing it to answer questions with up-to-date information.

## Available Backend Services (for Bot Commands)

The following backend services are available to be called by the Discord bot client.

| Command in Bot | Backend Service | Description | Usage Notes |
| :--- | :--- | :--- | :--- |
| `/gemini` | `processMultimodalContent` or `summarizeDiscordConversation` | Engages in a conversation with the Gemini model. Can process both text prompts and file attachments. | Supports text-based files (`.txt`, `.js`, `.py`, etc.). When a file is attached, its content is prepended to the prompt. |
| `/analyze` | `analyzeCode` | Performs a detailed analysis of a provided code file. | Returns a structured JSON object containing the language, summary, key components, dependencies, and potential issues. |
| `/set-key` | `setUserApiKey` | Securely saves a user's personal Gemini API key for all future interactions. | This command should be handled via Direct Message to protect the user's key. |
| `/search` | `webSearchAssistedAnswer` | Answers a question using real-time web search to find the most current information. | Leverages a web search tool integrated with the Gemini model. |

## Getting Started

This is a Next.js backend service. The primary interaction points are the Genkit flows defined in `src/ai/flows/`. The Discord bot client (in a separate repository) will make API calls to these flows.

### Prerequisites

-   Node.js
-   A Google Cloud project with the Gemini API enabled.
-   A `.env` file with your `GOOGLE_API_KEY`.

### Running Locally

```bash
# Install dependencies
npm install

# Start the Genkit development server
npm run genkit:watch

# Start the Next.js server
npm run dev
```

The Genkit UI will be available at `http://localhost:4000` to inspect and run flows.
