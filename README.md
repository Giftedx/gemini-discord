# Gemini Collaborative Suite for Discord - Backend

This repository contains the backend services for the **Gemini Collaborative Suite**, a powerful application designed to supercharge Discord servers with Google's Gemini AI. This backend is built with Next.js and Genkit, providing a robust and scalable foundation for intelligent, collaborative features.

## Getting Started

This is a Next.js backend service. The primary interaction points are the Genkit flows defined in `src/ai/flows/`. The Discord bot client (in a separate repository) will make API calls to these flows.

### Prerequisites

- Node.js
- A Google Cloud project with the Gemini API enabled.
- A `.env` file with your `GOOGLE_API_KEY`.

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
