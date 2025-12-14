FROM oven/bun AS deps
WORKDIR /app
COPY web/mc/package.json web/mc/bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun AS production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/mc/package.json ./
COPY web/mc .
CMD ["bun", "run", "build"]
