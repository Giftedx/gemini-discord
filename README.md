# Gemini Collaborative Suite for Discord - Backend

This repository contains the backend services for the **Gemini Collaborative Suite**, a powerful application designed to supercharge Discord servers with Google's Gemini AI. This backend is built with Next.js and Genkit, providing a robust and scalable foundation for intelligent, collaborative features.

## 🚀 Features

The backend exposes several Genkit flows that power the Discord bot's functionality:

- **Code Analysis**: Analyzes code snippets for bugs, vulnerabilities, and suggests improvements.
- **Image Generation**: Creates images from textual descriptions using generative AI.
- **Dynamic Workflows**: Allows for the creation and execution of custom, multi-step workflows within Discord.
- **Usage Tracking**: Monitors and reports on API usage and other metrics.
- **GitHub Integration**: Handles webhooks from GitHub to provide seamless integration with development workflows.
- **Multimodal Content Processing**: Can process and understand content that includes both text and images.
- **Secure API Key Management**: Securely manages user-specific API keys.
- **Conversation Summarization**: Summarizes long conversations in Discord channels to quickly catch up.
- **Web-Assisted Answers**: Answers questions by searching the web to provide the most up-to-date information.

## Project Structure

The project is organized as a monorepo with the main Next.js backend and a separate directory for the Discord bot client.

```
.
├── bot-client/         # Source code for the Discord bot client
├── src/
│   ├── ai/
│   │   ├── flows/      # Core Genkit AI flows that define the business logic
│   │   └── middleware/ # Middleware for handling requests
│   ├── app/            # Next.js API routes and pages
│   ├── components/     # React components for the frontend
│   ├── lib/            # Core libraries and utilities (Firebase, etc.)
│   ├── models/         # Data models and types
│   └── services/       # Services for interacting with external APIs (Discord, etc.)
├── Dockerfile          # Container configuration for deployment
├── apphosting.yaml     # Configuration for Google Cloud App Hosting
└── package.json        # Project dependencies and scripts
```

## Getting Started

This is a Next.js backend service. The primary interaction points are the Genkit flows defined in `src/ai/flows/`. The Discord bot client (in `bot-client/`) will make API calls to these flows.

### Prerequisites

- Node.js (v18 or higher)
- A Google Cloud project with the Gemini API enabled.
- A Firebase project for authentication and database services.
- A `.env.local` file with your `GOOGLE_API_KEY` and Firebase configuration.

### Running Locally

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start the Genkit Development Server:**
    This server provides a UI for testing and managing your AI flows.
    ```bash
    npm run genkit:start
    ```
    The Genkit UI will be available at `http://localhost:4001`.

3.  **Start the Next.js Development Server:**
    ```bash
    npm run dev
    ```
    The application will be running at `http://localhost:3000`.

## 部署 (Deployment)

This application is designed to be deployed on **Google Cloud App Hosting**. The `apphosting.yaml` and `Dockerfile` provide the necessary configuration for a seamless deployment.

Detailed deployment instructions will be added soon.
