FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
COPY src ./src
COPY docker-entrypoint.sh ./

ENV NODE_ENV=production

RUN chmod +x docker-entrypoint.sh

EXPOSE 4001

CMD ["./docker-entrypoint.sh"]
