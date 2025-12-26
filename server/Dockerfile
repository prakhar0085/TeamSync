FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Copy prisma schema FIRST
COPY prisma ./prisma

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]