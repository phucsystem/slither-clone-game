FROM node:18-alpine AS builder
WORKDIR /app/client
COPY apps/client/package*.json ./
RUN npm ci
COPY apps/shared /app/shared
COPY apps/client .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
