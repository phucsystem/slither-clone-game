FROM node:18-alpine AS builder
WORKDIR /app/server
COPY apps/server/package*.json ./
RUN npm ci
COPY apps/shared /app/shared
COPY apps/server .
RUN npm run build

FROM node:18-alpine
WORKDIR /app/server
COPY apps/server/package*.json ./
RUN npm ci --omit=dev && npm install -g pm2
COPY --from=builder /app/server/dist ./dist
COPY apps/server/ecosystem.config.js ./
EXPOSE 3000
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
