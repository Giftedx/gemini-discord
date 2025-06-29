# Dockerfile for bot-client

# Build stage
FROM node:20-slim AS build
WORKDIR /usr/src/app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the TypeScript source code
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the compiled output from the build stage
COPY --from=build /usr/src/app/dist ./dist

# Command to run the bot
CMD ["node", "dist/index.js"]
