FROM node:20-alpine

RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Ensure required directories exist
RUN mkdir -p public/uploads database/migrations

RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=1337

EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:1337/_health || exit 1

CMD ["npm", "start"]
