FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

RUN npm install -g tsx

COPY . .

EXPOSE 4000

CMD ["tsx", "server.ts"]