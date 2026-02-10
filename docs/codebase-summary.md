# Codebase Summary

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0 (Phase 1 Core Gameplay - Complete)
**Last Updated:** 2026-02-10
**Language:** TypeScript (100%)
**Architecture:** Monorepo (Yarn Workspaces)

---

## Project Structure

```
apps/
├── client/                 # Phaser.js frontend (TypeScript)
│   ├── src/
│   │   ├── scenes/         # Phaser scenes (BootScene, LobbyScene, GameScene, DeathScene)
│   │   ├── entities/       # Game objects (Snake, Food)
│   │   ├── managers/       # Core systems (InputManager, NetworkManager, CameraManager)
│   │   ├── physics/        # Interpolation & prediction (Interpolator, PredictionEngine)
│   │   └── config/         # Constants & design tokens
│   ├── Dockerfile          # Multi-stage build: node:18-alpine → nginx:alpine
│   └── package.json        # Phaser.js + Vite + Socket.IO client
├── server/                 # Node.js Express backend
│   ├── src/
│   │   ├── routes/         # REST endpoints (auth, users, rooms)
│   │   ├── websocket/      # Socket.IO handlers (game events, room management)
│   │   ├── game/           # Game logic (GameLoop, RoomManager, CollisionEngine, etc.)
│   │   ├── services/       # Business logic (AuthService, GameStateService)
│   │   ├── models/         # Sequelize models (Player, PlayerSession)
│   │   ├── middleware/     # Auth, rate limiting
│   │   └── config/         # Database, Redis, constants
│   ├── Dockerfile          # node:18-alpine + pm2-runtime
│   └── package.json        # Express + Socket.IO server
├── shared/                 # Shared types & constants
│   ├── types.ts            # Player, Snake, Food, Room, GameState interfaces
│   └── constants.ts        # MAP_SIZE, TICK_RATE, SPEEDS
└── migrations/             # Database migrations
    └── 001_initial_schema.sql  # PostgreSQL + triggers
```

---

## Core Systems (Phase 1 Implementation)

### Client (Phaser.js 3.70+)

**Scenes** map to game screens (S-01 to S-03):
- **BootScene**: Asset/font preloading
- **LobbyScene**: Matchmaking, username input, skin preview (S-01)
- **GameScene**: Main gameplay with HUD + minimap + boost bar (S-02)
- **DeathScene**: Death stats & replay (S-03)

**Key Managers:**
- **InputManager**: Captures mouse, WASD, spacebar at 60Hz
- **NetworkManager**: Socket.IO client with reconnection logic
- **CameraManager**: Smooth follow + zoom with lerp
- **Interpolator**: Remote snake lerp (factor 0.1-0.15) for smooth rendering
- **PredictionEngine**: Local snake client-side prediction with server reconciliation

**Entities:**
- **Snake**: Head + segments + eyes + skin rendering
- **Food**: Glow tweens, 4 rarity colors

### Server (Express + Socket.IO)

**REST API** (/api/):
- `POST /auth/*`: JWT + bcrypt, guest-only in Phase 1
- `GET /rooms/available`: Room matchmaking
- `GET/PATCH /users/me`: Player profile
- Rate limiting: 100 req/min per user

**WebSocket Events**:
- `join-room`: Assign to room, notify others
- `player-input`: Direction + speed + boost (server validates)
- `leave-room`: Cleanup, notify players
- Broadcasts: `game-state` (20Hz), `player-death`, `leaderboard` (1Hz)

**Game Loop** (60Hz per room):
- **RoomManager**: Create/destroy rooms, auto-assign players
- **SnakeManager**: Track position, direction, boost, length
- **FoodSpawner**: Generate 500-800 food/room, respawn 1-3s after collection
- **CollisionEngine**: Head-to-body (circle), head-to-head (larger wins), head-to-food
- **LeaderboardManager**: Top 10 per room, throttled broadcast

**Data Layer**:
- **PostgreSQL**: Players, sessions, auth (Sequelize)
- **Redis**: Room state, snake positions, food, leaderboard (ephemeral)

---

## Key Architectural Patterns

### Network Synchronization
- **Server-authoritative**: Client sends input only; server validates & broadcasts state
- **State sync**: Full snapshots (20Hz) with delta optimization planned for Phase 2
- **Client prediction**: Local player predicts, reconciles with server acks
- **Interpolation**: Remote snakes lerp smoothly between server updates

### Security
- JWT tokens (7-day rolling window)
- Bcrypt password hashing (Phase 2)
- Server-side movement validation (prevents speed hacks)
- Rate limiting on REST endpoints

### Physics
- Custom circle-based collision (not Arcade Physics AABB)
- Server-side 60Hz tick ensures fair collision detection
- Head radius ~20px, detection distance ~40px

### Docker Stack (5 Services)
1. **Frontend** (nginx:alpine): Serves Phaser client
2. **Backend** (node:18-alpine + pm2-runtime): Express + Socket.IO
3. **PostgreSQL** (postgres:14-alpine): Persistent data
4. **Redis** (redis:7-alpine): Game state + leaderboard
5. **Adminer** (adminer): Database GUI (dev only)

---

## File Statistics

| Category | Files | Est. LOC |
|----------|-------|---------|
| Server TypeScript | 21 | 1,200 |
| Client TypeScript | 14 | 1,100 |
| Shared Types | 2 | 150 |
| SQL Migrations | 1 | 80 |
| Docker | 3 | 150 |
| **Total** | **41** | **2,680** |

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Phaser.js | 3.70+ |
| Frontend Build | Vite | 5.0+ |
| Frontend Styling | Design tokens (TypeScript) | Custom |
| Backend Framework | Express.js | 4.18+ |
| Real-time Comm | Socket.IO | 4.6+ |
| Server Runtime | Node.js | 18-alpine |
| Database | PostgreSQL | 14-alpine |
| Cache/State | Redis | 7-alpine |
| ORM | Sequelize | 6.35+ |
| Auth | JWT + bcrypt | jsonwebtoken 9+, bcrypt 5+ |
| Container | Docker | 24+ |
| Orchestration | Docker Compose | 2.0+ |

---

## Phase 1 Completion Status

All FR-01 through FR-07 implemented:
- [x] FR-01: Room matchmaking + auto-create on full
- [x] FR-02: Snake movement with boost (WASD + spacebar)
- [x] FR-03: Food spawning (500-800/room, 4 rarities)
- [x] FR-04: Collision detection (server-authoritative)
- [x] FR-05: Real-time leaderboard (1Hz broadcast)
- [x] FR-06: Death screen with stats
- [x] FR-07: Network interpolation + client prediction

**Tests**: Jest unit tests for collision, room management, game loop (critical paths)

**Deployment**: Docker Compose stack with 5 services, nginx reverse proxy, SSL ready

---

## Next Steps (Phase 2+)

- Full user authentication (email/password)
- Monetization (ads, skin purchases, subscriptions)
- Leaderboard persistence + regional rankings
- Premium features (ad-free, cosmetics)
- Spectator mode & streaming features
- Performance optimization (delta updates, binary websockets)
