FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/backend/package.json apps/backend/package.json
RUN npm ci
COPY . .
RUN npm run prisma:generate -w @house-help/backend && npm run build -w @house-help/backend
CMD ["npm","run","start","-w","@house-help/backend"]
