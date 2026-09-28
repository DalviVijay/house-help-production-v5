FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci --ignore-scripts
FROM deps AS build
COPY tsconfig.base.json ./
RUN npm run prisma:generate -w @house-help/backend && npm run build -w @house-help/backend && npm prune --omit=dev
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S househelp && adduser -S househelp -G househelp
COPY --from=build --chown=househelp:househelp /app/node_modules ./node_modules
COPY --from=build --chown=househelp:househelp /app/apps/backend/dist ./apps/backend/dist
COPY --from=build --chown=househelp:househelp /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build --chown=househelp:househelp /app/apps/backend/package.json ./apps/backend/package.json
USER househelp
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:4000/health/live || exit 1
CMD ["sh","-c","npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma && exec node apps/backend/dist/server.js"]
