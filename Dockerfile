FROM node:25-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN set -eux; \
    npm config set fetch-retries 5; \
    npm config set fetch-retry-factor 2; \
    npm config set fetch-retry-mintimeout 10000; \
    npm config set fetch-retry-maxtimeout 120000; \
    for attempt in 1 2 3; do \
      npm install -g pnpm@10.30.1 && break; \
      echo "pnpm global install failed (attempt ${attempt})"; \
      if [ "${attempt}" -eq 3 ]; then exit 1; fi; \
      sleep $((attempt * 10)); \
    done

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN set -eux; \
    pnpm config set fetch-retries 5; \
    pnpm config set fetch-retry-factor 2; \
    pnpm config set fetch-retry-mintimeout 10000; \
    pnpm config set fetch-retry-maxtimeout 120000; \
    for attempt in 1 2 3; do \
      pnpm install --frozen-lockfile && break; \
      echo "pnpm install failed (attempt ${attempt})"; \
      if [ "${attempt}" -eq 3 ]; then exit 1; fi; \
      sleep $((attempt * 10)); \
    done

FROM deps AS build

COPY . .
RUN pnpm build

FROM base AS runner

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

COPY --from=build /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]

FROM deps AS dev

COPY . .

ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

EXPOSE 3000

CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"]
