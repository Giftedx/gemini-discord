# **App Name**: Gemini Collaborative Suite for Discord - Backend

## Core Features:

- Discord API Integration & Command Handler: Listens for Discord webhook events, parses commands, and routes them to appropriate handlers.
- Multimodal Content Processing Service: Receives file uploads from Discord, processes their content, and passes it to the Gemini API for analysis using a generative AI tool
- Persistent Conversation Context Management: Stores and retrieves conversation histories based on Discord thread ID to maintain context.
- Secure User-Specific Credential Management: Allows users to securely submit their Gemini API key, storing it encrypted and using it for requests from that user.
- Workflow & GitHub Integration Service: Connects to the GitHub API to monitor repositories and execute predefined automated tasks.
- Web Search Tool Integration: Allows the Gemini model to perform real-time web searches to answer user queries using a generative AI tool

## Style Guidelines:

- A primary color of deep blue (`#4285F4`) for trust and intelligence.
- A neutral light gray (`#F8F9FA`) background.
- A functional green (`#34A853`) accent for success states and key actions.
- A clean, highly legible sans-serif font like 'Inter' for all body text and UI elements.
- A modern tech-focused font like 'Lexend' for headings.