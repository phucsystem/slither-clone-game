# Slither Arena

Browser-based multiplayer snake game inspired by slither.io. Server-authoritative architecture, 50 players per room, 60 FPS client with client-side prediction.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | Phaser.js 3.70+ (TypeScript), Vite |
| Server | Node.js 18, Express, Socket.IO |
| Database | PostgreSQL 14, Redis 7 |
| Infra | Docker Compose, Nginx, PM2 |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)

### Production (Docker)

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET to a secure value
docker compose up --build
```

- Game: http://localhost
- API: http://localhost/api
- Adminer (DB GUI): `docker compose --profile dev up adminer` → http://localhost:8080

### Development

```bash
# Install dependencies
cd apps/server && npm install && cd ../..
cd apps/client && npm install && cd ../..

# Start infrastructure (postgres + redis)
docker compose up postgres redis -d

# Start server (hot reload)
cd apps/server && npm run dev

# Start client (separate terminal)
cd apps/client && npm run dev
```

- Client dev server: http://localhost:5173
- Server API: http://localhost:3000

## Project Structure

```
apps/
├── client/          # Phaser.js frontend
│   └── src/
│       ├── scenes/      # Boot, Lobby, Game, Death
│       ├── entities/    # Snake, Food rendering
│       ├── managers/    # Input, Network, Camera
│       └── physics/     # Interpolation, Prediction
├── server/          # Express + Socket.IO backend
│   └── src/
│       ├── game/        # GameLoop, CollisionEngine, RoomManager
│       ├── websocket/   # Socket handlers, game events
│       ├── routes/      # REST API (auth, rooms, users)
│       └── services/    # Auth, GameState
├── shared/          # Types & constants (client + server)
└── migrations/      # PostgreSQL schema
```

## Architecture

```
Browser (Phaser.js)
    ├── WebSocket (Socket.IO) ──→ Game Server (60Hz loop)
    │   ├── player-input (60Hz)         ├── SnakeManager
    │   ├── game-state (20Hz) ←         ├── CollisionEngine
    │   └── leaderboard (1Hz) ←         ├── FoodSpawner
    └── REST API ──────────────→        └── LeaderboardManager
        └── /auth, /rooms, /users            │         │
                                        PostgreSQL   Redis
                                        (accounts)  (game state)
```

**Key patterns:**
- Server-authoritative: all movement validated server-side
- Client-side prediction with server reconciliation
- Linear interpolation (lerp 0.12) for smooth remote snake rendering
- 60Hz server tick, 20Hz state broadcast, 1Hz leaderboard

## Game Controls

| Input | Action |
|-------|--------|
| Mouse | Steer snake direction |
| W/A/S/D | Alternative steering |
| Spacebar | Boost (consumes mass) |

## Environment Variables

See [`.env.example`](.env.example) for all configuration options. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Token signing key | **Must set in production** |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://snake_user:snake_pass@postgres:5432/snake_game` |
| `REDIS_URL` | Redis connection | `redis://redis:6379` |
| `MAX_PLAYERS_PER_ROOM` | Room capacity | `50` |
| `GAME_TICK_RATE` | Server physics rate (Hz) | `60` |

## Documentation

Detailed docs in [`docs/`](./docs/):

- [Codebase Summary](docs/codebase-summary.md) — Project overview (5 min read)
- [System Architecture](docs/system-architecture.md) — Data flow, components, security
- [API Specification](docs/API_SPEC.md) — REST + WebSocket endpoints
- [Database Design](docs/DB_DESIGN.md) — PostgreSQL + Redis schemas
- [UI Specification](docs/UI_SPEC.md) — Screens, components, design tokens
- [Code Standards](docs/code-standards.md) — Naming, patterns, quality guidelines
- [Docker Setup](docs/DOCKER-SETUP.md) — Deployment and infrastructure

## Roadmap

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Core Gameplay (movement, collision, rooms, HUD) | Complete |
| 2 | Monetization (skins, ads, full auth) | Planned |
| 3 | Competitive (ranked, leaderboards, anti-cheat) | Planned |

## Author

**Phil Dang**
- Email: phucsystem@gmail.com
- Website: [phucsystemlabs.com](https://phucsystemlabs.com)

## License

All rights reserved.
