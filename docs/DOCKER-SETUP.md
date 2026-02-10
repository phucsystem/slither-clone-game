# Docker Containerization Specification

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0 (Phase 1 Complete)
**Date:** 2026-02-10

---

## Quick Start

```bash
# Clone & setup
git clone <repo>
cd slither-clone-game
cp .env.example .env

# Start all services
docker-compose up -d

# Access game: http://localhost
# Database GUI: http://localhost:8080 (dev only)
```

---

## 1. Docker Stack Overview

| Service | Image | Purpose | Port |
|---------|-------|---------|------|
| frontend | nginx:alpine | Serve Phaser.js game | 80/443 |
| backend | node:18-alpine | Game server + API | 3000 |
| postgres | postgres:14-alpine | Persistent DB | 5432 |
| redis | redis:7-alpine | Game state cache | 6379 |
| adminer | adminer:latest | DB GUI (dev only) | 8080 |

**Build Context:** Repo root (`.`) for both frontend and backend Dockerfiles

---

## 2. docker-compose.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: apps/client/Dockerfile
    container_name: snake-frontend
    ports: ["80:80", "443:443"]
    depends_on: [backend]
    networks: [snake-network]
    restart: unless-stopped

  backend:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: snake-backend
    ports: ["3000:3000"]
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://snake_user:snake_pass@postgres:5432/snake_game
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on: [postgres, redis]
    networks: [snake-network]
    restart: unless-stopped
    command: pm2-runtime start dist/server/src/server.js

  postgres:
    image: postgres:14-alpine
    container_name: snake-postgres
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: snake_user
      POSTGRES_PASSWORD: snake_pass
      POSTGRES_DB: snake_game
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./apps/server/migrations:/docker-entrypoint-initdb.d
    networks: [snake-network]
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: snake-redis
    ports: ["6379:6379"]
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes: [redis_data:/data]
    networks: [snake-network]
    restart: unless-stopped

  adminer:
    image: adminer:latest
    container_name: snake-adminer
    ports: ["8080:8080"]
    depends_on: [postgres]
    networks: [snake-network]
    profiles: [dev]

volumes: {postgres_data:, redis_data:}
networks: {snake-network: {driver: bridge}}
```

---

## 3. Dockerfiles (Multi-Stage)

### 3.1 Frontend (apps/client/Dockerfile)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY apps/client/package*.json ./
COPY apps/shared ../shared
RUN npm ci
COPY apps/client .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY apps/client/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
```

### 3.2 Backend (apps/server/Dockerfile)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY apps/server/package*.json ./
COPY apps/shared ../shared
RUN npm ci
COPY apps/server .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
RUN npm install -g pm2
COPY --from=builder /app/dist ./dist
COPY apps/server/ecosystem.config.js .
COPY apps/server/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

**Note:** Dockerfile build contexts now use repo root (`.`) with paths like `COPY apps/server .`

---

## 4. Environment Variables

**Create `.env` from `.env.example`:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://snake_user:snake_pass@postgres:5432/snake_game
REDIS_URL=redis://redis:6379
JWT_SECRET=your-64-char-random-string-here
POSTGRES_USER=snake_user
POSTGRES_PASSWORD=snake_pass
POSTGRES_DB=snake_game
MAX_PLAYERS_PER_ROOM=50
GAME_TICK_RATE=60
CLIENT_UPDATE_RATE=20
MAP_SIZE=5000
```

**⚠️ Security:** Never commit `.env` to git (add to `.gitignore`)

---

## 5. Common Commands

| Task | Command |
|------|---------|
| Start all services | `docker-compose up -d` |
| View logs | `docker-compose logs -f backend` |
| Stop | `docker-compose down` |
| Rebuild | `docker-compose up -d --build` |
| Reset DB | `docker-compose down -v && docker-compose up -d` |
| Connect to DB | `docker-compose exec postgres psql -U snake_user -d snake_game` |
| Redis CLI | `docker-compose exec redis redis-cli` |
| DB GUI | Open http://localhost:8080 (dev profile) |

**Start with dev mode (hot reload):**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## 6. nginx.conf (Frontend Config)

```nginx
events { worker_connections 1024; }
http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript;

  server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # Cache static assets
    location ~* \.(js|css|png|jpg|svg|woff|woff2)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / { try_files $uri $uri/ /index.html; }

    # WebSocket to backend
    location /socket.io/ {
      proxy_pass http://backend:3000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_set_header Host $host;
    }

    # REST API to backend
    location /api/ {
      proxy_pass http://backend:3000/api/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
  }
}
```

---

## 7. Production Deployment

**DigitalOcean Droplet Setup:**

1. Create $40/mo Droplet with Docker pre-installed image
2. SSH in and clone repo
3. Set environment variables: `export JWT_SECRET=...`
4. Deploy:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker update --restart=always $(docker ps -q)  # Auto-restart
```

**docker-compose.prod.yml** (resource limits + health checks):

```yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits: {cpus: '2', memory: 2G}

  postgres:
    deploy:
      resources:
        limits: {cpus: '1', memory: 2G}

  redis:
    deploy:
      resources:
        limits: {cpus: '1', memory: 1G}
```

---

## 8. Architecture Diagram

```
┌──────────────────────────────────────────┐
│         Docker Compose Stack             │
├──────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  Frontend (nginx:alpine)           │  │
│  │  - Phaser.js compiled              │  │
│  │  - Port 80/443                     │  │
│  └────────────┬───────────────────────┘  │
│               │                           │
│  ┌────────────▼───────────────────────┐  │
│  │  Backend (node:18-alpine + pm2)    │  │
│  │  - Express + Socket.IO             │  │
│  │  - Game loop 60Hz                  │  │
│  │  - Port 3000                       │  │
│  └────────────┬──────────┬────────────┘  │
│               │          │               │
│  ┌────────────▼──────┐ ┌─▼────────────┐  │
│  │  PostgreSQL 14    │ │  Redis 7     │  │
│  │  Persistent data  │ │  Game state  │  │
│  │  Port 5432        │ │  Port 6379   │  │
│  └───────────────────┘ └──────────────┘  │
└──────────────────────────────────────────┘
```

---

## 9. Key Changes from Previous Setup

| Change | Reason |
|--------|--------|
| Build context: `.` (repo root) | Monorepo structure requires shared files |
| Multi-stage builds | Reduce image size by 80% |
| `ecosystem.config.js` path: `dist/server/src/server.js` | TypeScript compiles to nested dist folder |
| COPY paths: `apps/server/`, `apps/shared/` | Reference apps inside monorepo |

---

## 10. Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | `lsof -i :80` → kill process, or use different port in compose |
| Permission denied | Use `sudo docker-compose` or add user to docker group: `sudo usermod -aG docker $USER` |
| DB won't start | Check volume: `docker volume ls` → `docker volume rm snake-db` → retry |
| Backend connection timeout | Wait 10s for postgres to be ready, or add health check delays |
| WebSocket connection fails | Verify nginx proxies `/socket.io/` (see nginx.conf) |

---

## 11. Performance Notes

- **Server tick rate:** 60 Hz (16.6ms per tick)
- **Network broadcast:** 20 Hz (50ms state sync)
- **Client FPS:** 60 FPS target
- **Memory per room:** ~50-100 MB (50 players)
- **Bandwidth per player:** ~2-3 KB/s

---

## 12. Monitoring

**View real-time logs:**
```bash
docker-compose logs -f  # All services
docker-compose logs -f backend  # Backend only
docker stats  # CPU/Memory per container
```

**Health endpoint:**
```bash
curl http://localhost:3000/health
```

---

## 13. Hosting Costs (Phase 1)

| Item | Cost |
|------|------|
| DigitalOcean Droplet (4GB / 2CPU) | $40/mo |
| PostgreSQL (managed, 5GB) | $15/mo |
| Redis (managed cache) | $5/mo |
| DNS + SSL (Let's Encrypt) | Free |
| **Total** | **~$60/mo** |

Sufficient for 500-1000 DAU.

---

## 14. Next Steps

1. Update Dockerfiles with actual repo structure paths
2. Run `docker-compose up -d` locally to test
3. Deploy to DigitalOcean droplet
4. Configure Let's Encrypt SSL (via nginx reverse proxy)
5. Monitor logs for errors

See `system-architecture.md` for deployment details.
