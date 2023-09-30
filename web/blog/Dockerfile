FROM node AS deps
WORKDIR /app
COPY ./web/blog/package.json ./web/blog/package-lock.json ./
RUN npm install

FROM node AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./web/blog .
RUN npm run build

FROM node AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
