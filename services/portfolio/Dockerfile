FROM node:18-slim
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/portfolio/package*.json ./services/portfolio/
RUN npm install

COPY services/portfolio ./services/portfolio
WORKDIR /app/packages/shared
RUN npm run build
WORKDIR /app/services/portfolio
RUN npx prisma generate
RUN npm run build

EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push && npm start"]
