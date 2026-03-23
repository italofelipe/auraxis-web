# ── Stage 1: deps ──────────────────────────────────────────────────────────
FROM node:25-alpine AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10.30.1 && pnpm install --frozen-lockfile

# ── Stage 2: builder ───────────────────────────────────────────────────────
FROM deps AS builder

COPY . .
RUN pnpm build

# ── Stage 3: dev (development server) ──────────────────────────────────────
FROM deps AS dev

COPY . .
EXPOSE 3000
CMD ["pnpm", "dev"]

# ── Stage 4: runner (production SSR) ───────────────────────────────────────
# The Nuxt .output directory is self-contained — no install step needed.
FROM node:25-alpine AS runner

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENTRYPOINT ["/usr/sbin/dumb-init", "--"]
CMD ["node", ".output/server/index.mjs"]
