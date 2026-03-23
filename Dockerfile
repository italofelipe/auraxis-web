# Build stage
FROM node:25-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm@10.30.1 && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application (SSR)
RUN pnpm build

# Runtime stage
FROM node:25-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built application from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Install production dependencies only
RUN npm install -g pnpm@10.30.1 && \
    pnpm install --prod --frozen-lockfile

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/sbin/dumb-init", "--"]

# Start the server
CMD ["node", ".output/server/index.mjs"]
