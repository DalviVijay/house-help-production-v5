FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci --ignore-scripts
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @house-help/admin
FROM node:22-alpine AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN addgroup -S househelp && adduser -S househelp -G househelp
COPY --from=build --chown=househelp:househelp /app/apps/admin-panel/.next/standalone ./
COPY --from=build --chown=househelp:househelp /app/apps/admin-panel/.next/static ./apps/admin-panel/.next/static
USER househelp
EXPOSE 3000
CMD ["node","apps/admin-panel/server.js"]
