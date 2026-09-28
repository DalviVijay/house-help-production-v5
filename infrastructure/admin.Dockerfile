FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/admin-panel/package.json apps/admin-panel/package.json
RUN npm ci
COPY . .
RUN npm run build -w @house-help/admin
CMD ["npm","run","start","-w","@house-help/admin"]
