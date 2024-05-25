FROM oven/bun AS deps
WORKDIR /app
COPY ./web/mc/bun.lockb ./web/mc/package.json ./
RUN bun install

FROM oven/bun AS development
ENV NODE_ENV=development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./web/mc .
EXPOSE 3000
CMD ["bun", "start"]

FROM node AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY ./web/mc .
CMD ["npm", "run", "build"]
