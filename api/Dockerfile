FROM node:18 as base
WORKDIR /src
COPY ./api/package*.json ./
EXPOSE ${PORT}

# SSL files
COPY ./ssl/private.key /etc/ssl/private.key
COPY ./ssl/certificate.crt /etc/ssl/certificate.crt

FROM base as production
ENV NODE_ENV=production
RUN npm ci --omit=dev
COPY ./api ./
CMD ["npm", "start"]

FROM base as development
ENV NODE_ENV=development
RUN npm install
COPY ./api ./
CMD ["npm", "run", "dev"]
