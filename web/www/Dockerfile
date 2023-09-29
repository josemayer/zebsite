FROM oven/bun AS deps
WORKDIR /app
COPY ./web/www/package.json ./web/www/bun.lockb ./
RUN bun install

FROM oven/bun AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./web/www .
RUN bun run build
