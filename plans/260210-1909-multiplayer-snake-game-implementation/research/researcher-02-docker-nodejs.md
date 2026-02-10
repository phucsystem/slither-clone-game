# Docker Containerization for Node.js + Phaser.js Games (2026)

## Executive Summary
Multi-container orchestration with Docker Compose is standard for multiplayer game backends. Focus: minimal image size (alpine base, multi-stage builds), PM2 process management in containers, and DigitalOcean Droplet scaling.

---

## 1. Docker Compose Stack: Node.js + PostgreSQL + Redis + Nginx

**Standard architecture:**
- **Nginx** (reverse proxy, port 80/443)
- **Node.js/Socket.IO** (game server, internal port 3000)
- **PostgreSQL** (state, auth, game data)
- **Redis** (session cache, real-time game state sync)
- Bridge network connects all services by hostname

**docker-compose.yml template:**
```yaml
version: '3.9'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - web
    networks:
      - game-net

  web:
    build:
      context: .
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - game-net
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: game_db
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - game-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - game-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
  redis_data:

networks:
  game-net:
    driver: bridge
```

---

## 2. Multi-Stage Dockerfile Optimization

**Key metrics:** 1.17GB → 253MB (78% reduction) using alpine + multi-stage builds.

**Dockerfile.prod (optimized):**
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Install pm2-runtime for container process management
RUN npm install -g pm2-runtime

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY . .

# Expose game server + monitoring port
EXPOSE 3000 9615

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Run with pm2-runtime (auto-restart, clustering)
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

**Best practices:**
- Use `node:XX-alpine` (5-10x smaller than default)
- `npm ci` instead of `npm install` (faster, deterministic)
- Multi-stage: build stage discarded, only runtime copied
- Result: ~150-200MB final image vs 1GB+

---

## 3. PM2 in Docker Containers

**Use `pm2-runtime` (not `pm2`) in containers:**
- Auto-restarts on crash
- Clustering mode (worker threads)
- No daemon (blocks container)
- Monitoring via port 9615

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'game-server',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    error_file: '/var/log/game-error.log',
    out_file: '/var/log/game-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

**Docker entry:** `CMD ["pm2-runtime", "start", "ecosystem.config.js"]`

---

## 4. Development vs Production Configs

**Development (docker-compose.dev.yml):**
```yaml
web:
  build:
    context: .
    dockerfile: Dockerfile.dev
  volumes:
    - .:/app  # Hot reload
  environment:
    - NODE_ENV=development
    - DEBUG=*
  ports:
    - "3000:3000"  # Direct access
    - "9229:9229"  # Node debugger
  command: npm run dev
```

**Dockerfile.dev:**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
EXPOSE 3000 9229
CMD ["npm", "run", "dev"]
```

**Run:**
- Dev: `docker-compose -f docker-compose.dev.yml up`
- Prod: `docker-compose -f docker-compose.yml up`

---

## 5. DigitalOcean Deployment Strategy

**Droplet setup (Ubuntu 22.04+):**
1. Create $12-24/mo droplet (2GB RAM min for game server)
2. SSH in, install Docker + Docker Compose
3. Clone repo, `docker-compose up -d`
4. Use DigitalOcean DNS for domain routing
5. Enable auto-backups

**Scaling for multiplayer load:**
- **Horizontal:** Deploy multiple Node.js containers, use load balancer (nginx upstream or DO Load Balancer)
- **Vertical:** Increase droplet size or add Redis cluster
- **Game-specific:** Redis pub/sub for cross-server player communication

**Monitoring:**
- PM2 Plus integration (optional, paid)
- Container logs: `docker logs -f <container_id>`
- PostgreSQL backups: DigitalOcean managed DB or Docker volumes

---

## 6. Network & WebSocket Optimization

**For real-time game traffic:**
- Redis pub/sub for room-based broadcasts (Socket.IO adapter)
- PostgreSQL for persistence (user data, game history)
- Nginx upstream config for sticky sessions

**nginx.conf snippet:**
```nginx
upstream game_nodes {
  least_conn;  # Session affinity helps WebSocket stability
  server web:3000;
}

server {
  listen 80;
  location / {
    proxy_pass http://game_nodes;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_buffering off;
  }
}
```

---

## Key Takeaways

| Area | Best Practice |
|------|---|
| Image Size | Multi-stage + alpine: 150-200MB |
| Process Mgmt | `pm2-runtime` in Dockerfile + ecosystem.config.js |
| Dev/Prod | Separate docker-compose & Dockerfile configs |
| Networking | Docker bridge + service hostname resolution |
| DigitalOcean | Droplet $12-24 + managed DB optional, Docker native |
| Monitoring | Container logs + PM2 health checks |

---

## Unresolved Questions

1. Do you need managed PostgreSQL on DigitalOcean or self-hosted in Docker container?
2. Is horizontal scaling (multiple game nodes) needed from day 1 or after MVP?
3. SSL/TLS: Use DigitalOcean certificate or Let's Encrypt in container?

---

## Sources
- [Phaser with Node.js Best Practices](https://www.w3tutorials.net/blog/phaser-nodejs/)
- [Docker Compose Node.js + PostgreSQL + Redis Setup](https://www.tomray.dev/nestjs-docker-compose-postgres)
- [Multi-Stage Dockerfile Optimization Guide](https://itsopensource.com/how-to-reduce-node-docker-image-size-by-ten-times/)
- [PM2 Docker Integration](https://pm2.keymetrics.io/docs/usage/docker-pm2-nodejs/)
- [DigitalOcean PM2 Deployment Tutorial](https://www.digitalocean.com/community/tutorials/how-to-use-pm2-to-setup-a-node-js-production-environment-on-an-ubuntu-vps)
