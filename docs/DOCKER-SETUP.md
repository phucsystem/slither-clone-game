# Docker Containerization Specification

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0
**Date:** 2026-02-10
**Stack:** Phaser.js + Node.js + PostgreSQL + Redis

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│            Docker Compose Stack                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐            │
│  │   Frontend   │  │   Backend    │            │
│  │   (Nginx)    │  │  (Node.js)   │            │
│  │   Port 80    │  │  Port 3000   │            │
│  └──────────────┘  └──────────────┘            │
│         │                  │                    │
│         │                  ├──────────┐         │
│         │                  │          │         │
│  ┌──────────────┐  ┌──────────┐ ┌──────────┐  │
│  │  PostgreSQL  │  │  Redis   │ │  Adminer │  │
│  │   Port 5432  │  │ Port 6379│ │Port 8080 │  │
│  └──────────────┘  └──────────┘ └──────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 1. Docker Services

### 1.1 Service List

| Service | Image | Purpose | Ports | Dependencies |
|---------|-------|---------|-------|--------------|
| `frontend` | nginx:alpine | Serve static Phaser.js build | 80:80 | - |
| `backend` | node:18-alpine | Game server + REST API | 3000:3000 | postgres, redis |
| `postgres` | postgres:14-alpine | Persistent database | 5432:5432 | - |
| `redis` | redis:7-alpine | Game state cache | 6379:6379 | - |
| `adminer` | adminer:latest | Database GUI (dev only) | 8080:8080 | postgres |

---

## 2. docker-compose.yml

```yaml
version: '3.8'

services:
  # Frontend - Phaser.js game served by Nginx
  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: snake-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./client/dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
    networks:
      - snake-network
    restart: unless-stopped

  # Backend - Node.js + Socket.io + Express
  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: snake-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://snake_user:snake_pass@postgres:5432/snake_game
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    depends_on:
      - postgres
      - redis
    volumes:
      - ./server:/app
      - /app/node_modules
    networks:
      - snake-network
    restart: unless-stopped
    command: npm run start:prod

  # PostgreSQL - Persistent database
  postgres:
    image: postgres:14-alpine
    container_name: snake-postgres
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=snake_user
      - POSTGRES_PASSWORD=snake_pass
      - POSTGRES_DB=snake_game
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    networks:
      - snake-network
    restart: unless-stopped

  # Redis - Game state + cache
  redis:
    image: redis:7-alpine
    container_name: snake-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - snake-network
    restart: unless-stopped

  # Adminer - Database GUI (dev/staging only)
  adminer:
    image: adminer:latest
    container_name: snake-adminer
    ports:
      - "8080:8080"
    environment:
      - ADMINER_DEFAULT_SERVER=postgres
    depends_on:
      - postgres
    networks:
      - snake-network
    profiles:
      - dev
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  snake-network:
    driver: bridge
```

---

## 3. Dockerfiles

### 3.1 Frontend Dockerfile (Phaser.js)

**File:** `client/Dockerfile`

```dockerfile
# Stage 1: Build Phaser.js game
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build Phaser.js game with Vite
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built game from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

**Build optimizations:**
- Multi-stage build (reduces final image size by 80%)
- Alpine Linux (smaller base image)
- Production-only dependencies

---

### 3.2 Backend Dockerfile (Node.js)

**File:** `server/Dockerfile`

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies first (cache optimization)
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Run database migrations on startup (optional)
# COPY migrations ./migrations

EXPOSE 3000

# Use PM2 for process management
RUN npm install -g pm2

CMD ["pm2-runtime", "start", "ecosystem.config.js"]
```

**Production features:**
- PM2 for zero-downtime restarts
- Health checks via `/health` endpoint
- Graceful shutdown handling

---

## 4. Environment Configuration

### 4.1 `.env` File (Development)

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://snake_user:snake_pass@postgres:5432/snake_game
POSTGRES_USER=snake_user
POSTGRES_PASSWORD=snake_pass
POSTGRES_DB=snake_game

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Google AdSense
ADSENSE_CLIENT_ID=ca-pub-...

# Game Config
MAX_PLAYERS_PER_ROOM=50
GAME_TICK_RATE=60
CLIENT_UPDATE_RATE=20
MAP_SIZE=5000
```

### 4.2 `.env.production` (Production)

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod_user:STRONG_PASSWORD@postgres:5432/snake_game
REDIS_URL=redis://redis:6379
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_64_CHARS
STRIPE_SECRET_KEY=sk_live_...
```

**⚠️ Security:** Never commit `.env` files to git! Add to `.gitignore`.

---

## 5. Docker Commands

### 5.1 Development

**Start all services:**
```bash
docker-compose up -d
```

**View logs:**
```bash
docker-compose logs -f backend
docker-compose logs -f postgres
```

**Stop all services:**
```bash
docker-compose down
```

**Rebuild after code changes:**
```bash
docker-compose up -d --build
```

**Reset database (fresh start):**
```bash
docker-compose down -v  # Delete volumes
docker-compose up -d
```

### 5.2 Production

**Start (production mode):**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Scale backend (add more game servers):**
```bash
docker-compose up -d --scale backend=3
```

**Health check:**
```bash
curl http://localhost:3000/health
```

---

## 6. Phaser.js Configuration

### 6.1 main.ts (Game Initialization)

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LobbyScene } from './scenes/LobbyScene';
import { GameScene } from './scenes/GameScene';
import { DeathScene } from './scenes/DeathScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { ProfileScene } from './scenes/ProfileScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // WebGL with Canvas fallback
  width: 1920,
  height: 1080,
  parent: 'game-container',
  backgroundColor: '#0A0E1A', // Dark theme from UI_SPEC
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 } // Top-down, no gravity
    }
  },
  scene: [
    BootScene,      // Asset loading
    LobbyScene,     // S-01
    GameScene,      // S-02
    DeathScene,     // S-03
    LeaderboardScene, // S-04
    ProfileScene    // S-05
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  }
};

const game = new Phaser.Game(config);
```

---

## 7. nginx.conf (Frontend Serving)

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;

        root /usr/share/nginx/html;
        index index.html;

        # Gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Proxy WebSocket to backend
        location /socket.io/ {
            proxy_pass http://backend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Proxy REST API to backend
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

## 8. Updated Tech Stack (Final)

```
┌────────────────────────────────────────┐
│         DOCKER COMPOSE STACK           │
├────────────────────────────────────────┤
│                                        │
│  ┌─────────────────────────────────┐  │
│  │  Frontend Container (Nginx)     │  │
│  │  - Phaser.js 3.70+ (TypeScript) │  │
│  │  - Vite bundler                 │  │
│  │  - Socket.io Client             │  │
│  │  - Static assets (PNG skins)    │  │
│  └─────────────────────────────────┘  │
│              ↓ HTTP/WSS                │
│  ┌─────────────────────────────────┐  │
│  │  Backend Container (Node.js)    │  │
│  │  - Node.js 18 + Express.js      │  │
│  │  - Socket.io Server             │  │
│  │  - Game loop (60 Hz)            │  │
│  │  - REST API (15 endpoints)      │  │
│  │  - PM2 process manager          │  │
│  └─────────────────────────────────┘  │
│       ↓                    ↓           │
│  ┌──────────┐      ┌──────────┐       │
│  │PostgreSQL│      │  Redis   │       │
│  │Container │      │Container │       │
│  │Port 5432 │      │Port 6379 │       │
│  └──────────┘      └──────────┘       │
│       ↓                    ↓           │
│  ┌──────────┐      ┌──────────┐       │
│  │  Volume  │      │  Volume  │       │
│  │postgres_ │      │ redis_   │       │
│  │   data   │      │  data    │       │
│  └──────────┘      └──────────┘       │
└────────────────────────────────────────┘
```

---

## 9. Project Structure

```
slither-clone-game/
├── client/                    # Frontend (Phaser.js)
│   ├── src/
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   ├── LobbyScene.ts
│   │   │   ├── GameScene.ts
│   │   │   ├── DeathScene.ts
│   │   │   ├── LeaderboardScene.ts
│   │   │   └── ProfileScene.ts
│   │   ├── entities/
│   │   │   ├── Snake.ts
│   │   │   └── Food.ts
│   │   ├── managers/
│   │   │   ├── NetworkManager.ts
│   │   │   └── SkinManager.ts
│   │   ├── assets/
│   │   │   ├── skins/         # 10 snake PNG images
│   │   │   └── ui/
│   │   └── main.ts
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── server/                    # Backend (Node.js)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── leaderboard.routes.ts
│   │   │   └── skin.routes.ts
│   │   ├── websocket/
│   │   │   ├── game.events.ts
│   │   │   └── room.manager.ts
│   │   ├── models/
│   │   │   ├── Player.ts
│   │   │   ├── PlayerSession.ts
│   │   │   └── Transaction.ts
│   │   ├── services/
│   │   │   ├── AuthService.ts
│   │   │   ├── GameService.ts
│   │   │   └── LeaderboardService.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── ratelimit.middleware.ts
│   │   └── server.ts
│   ├── Dockerfile
│   ├── ecosystem.config.js    # PM2 config
│   ├── tsconfig.json
│   └── package.json
│
├── migrations/                # Database migrations
│   └── 001_initial_schema.sql
│
├── docker-compose.yml         # Main compose file
├── docker-compose.dev.yml     # Dev overrides
├── docker-compose.prod.yml    # Production overrides
├── nginx.conf                 # Nginx config
├── .env.example
└── .gitignore
```

---

## 10. Development Workflow

### 10.1 Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd slither-clone-game

# Copy environment file
cp .env.example .env

# Edit .env with your values
nano .env

# Start all containers
docker-compose up -d

# Watch logs
docker-compose logs -f
```

**Access points:**
- Game: http://localhost
- API: http://localhost:3000
- Database GUI: http://localhost:8080 (dev only)

### 10.2 Development Mode

**Hot reload enabled:**
```bash
# Start with dev overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Frontend: Vite dev server (HMR)
# Backend: Nodemon (auto-restart on file change)
```

### 10.3 Running Migrations

```bash
# Execute migration inside container
docker-compose exec backend npm run migrate

# Or run SQL directly
docker-compose exec postgres psql -U snake_user -d snake_game -f /docker-entrypoint-initdb.d/001_initial_schema.sql
```

### 10.4 Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U snake_user -d snake_game

# Connect to Redis CLI
docker-compose exec redis redis-cli

# Via Adminer GUI
# Open: http://localhost:8080
# System: PostgreSQL
# Server: postgres
# Username: snake_user
# Password: snake_pass
# Database: snake_game
```

---

## 11. Production Deployment

### 11.1 Production docker-compose.prod.yml

```yaml
version: '3.8'

services:
  frontend:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  backend:
    environment:
      - NODE_ENV=production
    deploy:
      replicas: 3  # 3 game servers behind load balancer
      resources:
        limits:
          cpus: '2'
          memory: 2G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G

  redis:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

### 11.2 Deploy to DigitalOcean

**Steps:**
1. Create DigitalOcean Droplet (Docker pre-installed image)
2. SSH into droplet
3. Clone repository
4. Set environment variables
5. Run production stack:

```bash
# On droplet
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --scale backend=3

# Enable auto-restart on reboot
docker update --restart=always $(docker ps -q)
```

---

## 12. Benefits of Docker

| Benefit | Impact |
|---------|--------|
| **Environment consistency** | Dev = Staging = Production (no "works on my machine") |
| **Easy scaling** | `docker-compose up --scale backend=5` |
| **Isolation** | Each service independent, no port conflicts |
| **Rollback** | `docker-compose down && docker-compose up -d` (previous image) |
| **Team onboarding** | New dev: `docker-compose up` → ready in 5 min |
| **Cost-effective** | Multiple services on one $40/mo droplet (Phase 1) |

---

## 13. Phaser.js Integration

### 13.1 Game Loop (GameScene.ts)

```typescript
export class GameScene extends Phaser.Scene {
  private snakes: Map<string, Snake>;
  private food: Phaser.GameObjects.Group;
  private networkManager: NetworkManager;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Initialize Phaser systems
    this.cameras.main.setBounds(0, 0, 5000, 5000);

    // Create game entities
    this.snakes = new Map();
    this.food = this.add.group();

    // Connect to Socket.io
    this.networkManager = new NetworkManager(this);
    this.networkManager.connect();

    // Listen for game state updates (20 Hz from server)
    this.networkManager.on('game-state', (state) => {
      this.updateGameState(state);
    });
  }

  update(time: number, delta: number) {
    // Phaser calls this at 60 FPS automatically

    // Client-side prediction for local player
    this.updateLocalSnake(delta);

    // Interpolate remote snakes
    this.snakes.forEach(snake => {
      if (!snake.isLocal) {
        snake.interpolate(delta);
      }
    });
  }

  private updateGameState(state: GameState) {
    // Update snakes from server
    state.snakes.forEach(snakeData => {
      if (!this.snakes.has(snakeData.user_id)) {
        this.snakes.set(snakeData.user_id, new Snake(this, snakeData));
      } else {
        this.snakes.get(snakeData.user_id).update(snakeData);
      }
    });

    // Update food
    this.food.clear(true, true);
    state.food.forEach(foodData => {
      this.food.add(new Food(this, foodData.position.x, foodData.position.y));
    });
  }
}
```

### 13.2 Snake Entity (entities/Snake.ts)

```typescript
export class Snake extends Phaser.GameObjects.Container {
  private head: Phaser.GameObjects.Graphics;
  private segments: Phaser.GameObjects.Graphics[];
  private skin: SkinConfig;

  constructor(scene: Phaser.Scene, data: SnakeData) {
    super(scene, data.position.x, data.position.y);

    // Load skin config
    this.skin = SkinManager.getSkin(data.skin);

    // Create head with eyes
    this.head = scene.add.graphics();
    this.drawHead(this.skin.colors.primary);
    this.add(this.head);

    // Create body segments
    this.segments = [];
    data.segments.forEach((seg, index) => {
      const segment = scene.add.graphics();
      this.drawSegment(segment, this.skin, index);
      this.segments.push(segment);
      this.add(segment);
    });

    // Add glow effect (premium skins)
    if (this.skin.tier === 'premium' || this.skin.tier === 'premium+') {
      this.postFX.addGlow(this.skin.glowColor, 4, 0, false, 0.5);
    }

    scene.add.existing(this);
  }

  private drawHead(color: number) {
    this.head.fillStyle(color);
    this.head.fillCircle(0, 0, 20); // 20px radius

    // Eyes
    this.head.fillStyle(0xFFFFFF);
    this.head.fillCircle(-8, -5, 5); // Left eye
    this.head.fillCircle(8, -5, 5);  // Right eye

    // Pupils
    this.head.fillStyle(0x000000);
    this.head.fillCircle(-8, -5, 2);
    this.head.fillCircle(8, -5, 2);
  }
}
```

---

## 14. Hosting Costs (Updated with Docker)

| Environment | Droplet Size | Services | Cost/Month |
|-------------|--------------|----------|------------|
| **Development** | Local Docker | All 5 containers | $0 |
| **Staging** | 2GB RAM / 1 CPU | All 5 containers | $12/mo |
| **Production (Month 1)** | 4GB RAM / 2 CPU | 1 backend, shared DB/Redis | $40/mo |
| **Production (Month 6)** | 8GB RAM / 4 CPU × 3 | 3 backends, dedicated DB/Redis | $120/mo × 3 = $360/mo |

**Savings with Docker:** Can run multiple services on one droplet (vs separate VMs)

---

## 15. Updated Stack Summary

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | Phaser.js 3.70+ + TypeScript | Team expertise, faster development (2-3 weeks saved) |
| **Backend** | Node.js 18 + Express + Socket.io | JavaScript everywhere, easy WebSocket rooms |
| **Database** | PostgreSQL 14 | ACID compliance, free tier on DO |
| **Cache** | Redis 7 | Sub-ms queries, game state storage |
| **Containerization** | Docker + Docker Compose | Environment consistency, easy scaling |
| **Hosting** | DigitalOcean Droplets | Predictable pricing ($40/mo), managed services |
| **Web Server** | Nginx | Static file serving, reverse proxy, WebSocket upgrade |
| **Process Manager** | PM2 | Zero-downtime restarts, cluster mode |
| **Payments** | Stripe | Skin purchases, ad-free |
| **Ads** | Google AdSense | Video ads on death |

---

## ✅ Changes Summary

**Updated from previous decision:**
- ✅ **Phaser.js** instead of Vanilla JS (faster development, team knows it)
- ✅ **Docker containerization** for all services (consistency, scaling)
- ✅ **TypeScript** (pairs well with Phaser, type safety)
- ✅ **Nginx** as reverse proxy (WebSocket + API routing)

**Kept same:**
- ✅ Socket.io (WebSocket library)
- ✅ Node.js backend
- ✅ PostgreSQL + Redis
- ✅ DigitalOcean hosting

---

## 🚀 Ready to Plan?

Now that stack is finalized, create implementation plan:

```bash
/plan @docs/ @prototypes/
```

**Plan will include:**
- Docker setup tasks (Dockerfiles, compose files)
- Phaser.js project initialization
- Backend API implementation
- Database migrations
- Deployment guide

**Shall I create the plan now?**