# bot-client/Dockerfile

# ---- Build Stage ----
FROM node:20-slim AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Build the TypeScript code
RUN npm run build

# ---- Production Stage ----
FROM node:20-slim AS production
ENV NODE_ENV=production
WORKDIR /app
# Copy production dependencies from builder
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Run the bot
CMD ["node", "dist/index.js"]
