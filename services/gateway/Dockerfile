FROM node:18-slim
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/gateway/package*.json ./services/gateway/
RUN npm install
COPY services/gateway ./services/gateway
RUN npm run build --workspaces --if-present
WORKDIR /app/services/gateway
EXPOSE 3000
CMD ["npm", "start"]
