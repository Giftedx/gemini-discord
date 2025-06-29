
# Dockerfile for Next.js backend

# 1. Install dependencies only when needed
FROM node:20-slim AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# 3. Production image, copy all the files and run next
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
# Disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

# Copy the standalone output
COPY --from=builder /app/.next/standalone ./
# Copy the public and static folders
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
=======
FROM docker.io/library/node:20-slim

ARG SANDBOX_NAME="gemini-cli-sandbox"
ARG CLI_VERSION_ARG
ENV SANDBOX="$SANDBOX_NAME"
ENV CLI_VERSION=$CLI_VERSION_ARG

# install minimal set of packages, then clean up
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  man-db \
  curl \
  dnsutils \
  less \
  jq \
  bc \
  gh \
  git \
  unzip \
  rsync \
  ripgrep \
  procps \
  psmisc \
  lsof \
  socat \
  ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# set up npm global package folder under /usr/local/share
# give it to non-root user node, already set up in base image
RUN mkdir -p /usr/local/share/npm-global \
  && chown -R node:node /usr/local/share/npm-global
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# switch to non-root user node
USER node

# install gemini-cli and clean up
COPY packages/cli/dist/google-gemini-cli-*.tgz /usr/local/share/npm-global/gemini-cli.tgz
COPY packages/core/dist/google-gemini-cli-core-*.tgz /usr/local/share/npm-global/gemini-core.tgz
RUN npm install -g /usr/local/share/npm-global/gemini-cli.tgz /usr/local/share/npm-global/gemini-core.tgz \
  && npm cache clean --force \
  && rm -f /usr/local/share/npm-global/gemini-{cli,core}.tgz

# default entrypoint when none specified
CMD ["gemini"]
