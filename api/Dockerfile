FROM oven/bun:1 AS base
WORKDIR /src

# Copy package files and Bun lockfile
COPY ./api/package.json ./api/bun.lockb ./
EXPOSE ${PORT}

# SSL files
COPY ./ssl/private.key /etc/ssl/private.key
COPY ./ssl/certificate.crt /etc/ssl/certificate.crt

# Production stage
FROM base AS production
ENV NODE_ENV=production
# Install only production dependencies
RUN bun install --production
COPY ./api ./
CMD ["bun", "run", "start"]

# Development stage
FROM base AS development
ENV NODE_ENV=development
RUN bun install
COPY ./api ./
CMD ["bun", "run", "dev"]
