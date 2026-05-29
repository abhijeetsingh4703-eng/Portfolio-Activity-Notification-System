FROM node:18-slim
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/notification/package*.json ./services/notification/
RUN npm install

COPY services/notification ./services/notification
WORKDIR /app/packages/shared
RUN npm run build
WORKDIR /app/services/notification
RUN npx prisma generate
RUN npm run build

EXPOSE 3002
CMD ["sh", "-c", "npx prisma db push && npm start"]
