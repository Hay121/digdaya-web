FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc --skipLibCheck || true
EXPOSE 3001
CMD ["node", "-r", "ts-node/register", "src/server.ts"]
