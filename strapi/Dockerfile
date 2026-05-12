FROM node:20-alpine

RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN mkdir -p public database/migrations

RUN npm run build

ENV HOST=0.0.0.0
ENV PORT=1337

EXPOSE 1337

CMD ["npm", "start"]
