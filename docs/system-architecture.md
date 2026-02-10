# System Architecture

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0 (Phase 1 Core Gameplay)
**Last Updated:** 2026-02-10
**Architecture Pattern:** Monorepo with Client-Server + Real-time Sync

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Chrome/Firefox)                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Phaser.js Frontend (TypeScript)             │   │
│  │  ┌────────────┬─────────────┬──────────┬──────────────┐   │   │
│  │  │  Boot      │   Lobby     │  Game    │   Death      │   │   │
│  │  │  Scene     │   Scene     │  Scene   │   Scene      │   │   │
│  │  └────────────┴─────────────┴──────────┴──────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │  InputManager | NetworkManager | CameraManager      │   │   │
│  │  │  Interpolator | PredictionEngine                     │   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│           ▼                                             ▼         │
│    WebSocket (Socket.IO)                     REST API (HTTP)    │
└──────────┬────────────────────────────────────────┬─────────────┘
           │                                        │
           │ player-input (60Hz)                   │
           │ join-room, leave-room                 │
           │ ◄─ game-state (20Hz)                   │
           │ ◄─ leaderboard (1Hz)                   │ auth, users, rooms
           │ ◄─ player-death                        │
           ▼                                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Node.js Express Server (TypeScript)             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes: /auth, /users, /rooms (with JWT + rate limit)   │   │
│  │  WebSocket: Socket.IO server with room management       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Game Loop (60Hz)                                        │   │
│  │  ├─ RoomManager: Create/destroy rooms                    │   │
│  │  ├─ SnakeManager: Position, direction, boost, length     │   │
│  │  ├─ FoodSpawner: Generation & collection                 │   │
│  │  ├─ CollisionEngine: Head-to-body, head-to-head, food    │   │
│  │  └─ LeaderboardManager: Top 10 per room (1Hz)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Services: AuthService, GameStateService                │   │
│  │  Middleware: auth-middleware, rate-limiter               │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────┬──────────────────────┘
                   │                      │
                   ▼                      ▼
        ┌────────────────────┐  ┌────────────────────┐
        │   PostgreSQL 14    │  │    Redis 7         │
        │  ┌──────────────┐  │  │  ┌──────────────┐  │
        │  │ players      │  │  │  │ room:{id}    │  │
        │  │ sessions     │  │  │  │ snake:{id}   │  │
        │  │ auth tokens  │  │  │  │ food:{id}    │  │
        │  │ transactions │  │  │  │ leaderboard  │  │
        │  └──────────────┘  │  │  └──────────────┘  │
        └────────────────────┘  └────────────────────┘
        (Persistent)           (Ephemeral Game State)
```

---

## 2. Data Flow Architecture

### 2.1 Game State Synchronization Flow

```
Player Action (Client Side)
    ▼
InputManager captures:
  - Mouse position / WASD key / Spacebar
    ▼
NetworkManager.emit('player-input', {
  direction: angle,
  boost: boolean,
  timestamp: ms
})
    ▼
         WebSocket (Socket.IO) ────────────────┐
                                               ▼
                           Server: game-events.ts handler
                           - Validate input (cheat check)
                           - Update snake direction/boost
                           - Server-side prediction
                           - Broadcast collision results
                                               │
                                    ┌──────────┴─────────────┐
                                    ▼                        ▼
                           Redis update:           GameLoop SnakeManager:
                           snake:{roomId}:{id}      - Move all snakes
                                                    - Run CollisionEngine
                                                    - Update food
                                                    - Compute leaderboard
                                               │
                                               ▼ (20Hz broadcast)
                           Server: game-state snapshot
                           {
                             snakes: [{id, x, y, length, ...}],
                             food: [{x, y, rarity}],
                             deaths: [{playerId, killer}]
                           }
                                               │
         ┌──────────────────────────────────────┘
         ▼
    Client: NetworkManager receives
    - Update RemoteSnakes in GameScene
    - Queue death animations
    - Update HUD leaderboard
         ▼
    Interpolator + PredictionEngine:
    - Interpolate remote snakes (20Hz → 60Hz smooth)
    - Predict local snake position (reconcile on server ack)
         ▼
    GameScene render loop:
    - Draw snakes at interpolated positions
    - Draw food particles
    - Draw HUD/minimap
    - 60 FPS on screen
```

### 2.2 Room Lifecycle

```
1. Player joins browser → LobbyScene
   ▼
2. Clicks "Play" → emit 'join-room'
   ▼
3. Server: RoomManager.joinRoom(playerId)
   - Check if active room exists with space
   - YES: Assign player, emit 'room-joined' + other players
   - NO: Create new room, assign player
   ▼
4. Client: GameScene launches
   ▼
5. GameLoop starts (60Hz on server)
   ▼
6. Gameplay... player dies
   ▼
7. emit 'leave-room' | DeathScene shows stats
   ▼
8. Server: RoomManager.leaveRoom(playerId)
   - Remove from room
   - Broadcast leaderboard update
   - If room empty: destroy, clear Redis keys
```

### 2.3 Collision & Death Flow

```
Server GameLoop (60Hz):
    ▼
CollisionEngine.tick():
  ├─ Check head vs all food
  │  └─ Food collected? Add length, respawn food, increment kills
  │
  ├─ Check head vs all bodies (self + others)
  │  └─ Head inside body? → DEATH (snake becomes food)
  │
  └─ Check head vs head
     └─ Two snakes collide: larger wins, smaller dies
    ▼
Player death event:
  - Emit 'player-death' with stats
  - Broadcast leaderboard update
  - Save session to PostgreSQL
    ▼
Client DeathScene:
  - Display rank, kills, max_length, duration
  - "Play Again" button triggers new join-room
```

---

## 3. Component Architecture

### 3.1 Client (Phaser.js)

**Layers:**

```
Presentation Layer (Scenes)
├─ BootScene: Asset loading
├─ LobbyScene: Matchmaking UI
├─ GameScene: Main gameplay canvas
└─ DeathScene: Stats & replay

Manager Layer
├─ NetworkManager: WebSocket events
├─ InputManager: Keyboard/mouse capture
├─ CameraManager: Viewport following
└─ State Layer (Phaser registry)

Physics Layer
├─ Interpolator: Smooth remote snake rendering
├─ PredictionEngine: Local snake client prediction
└─ CollisionDetector (visual only, server-authoritative)

Entity Layer
├─ Snake class: Rendering head + segments + eyes
└─ Food class: Rendering with glow tweens

Config Layer
├─ game-config.ts: Phaser configuration
└─ design-tokens.ts: Colors, fonts, dimensions
```

**Key Patterns:**
- **Phaser.Events.EventEmitter**: Decoupled scene communication
- **Signal pattern** (Socket.IO): One-way data flow from server
- **Prediction + Reconciliation**: Optimistic local updates
- **Lerp/Tween**: Smooth interpolation at 60 FPS

### 3.2 Server (Node.js)

**Layers:**

```
HTTP Layer (Express)
├─ Routes: /auth/*, /users/*, /rooms/*
├─ Middleware: auth-middleware, rate-limiter
└─ Controllers (implicit in routes)

WebSocket Layer (Socket.IO)
├─ socket-handler.ts: Connection, auth, routing
└─ game-events.ts: join-room, player-input, leave-room

Game Logic Layer (60Hz Loop)
├─ RoomManager: Room lifecycle
├─ SnakeManager: Snake state (position, direction, boost)
├─ FoodSpawner: Spawn logic (500-800 per room, 4 rarities)
├─ CollisionEngine: Authoritative collision detection
└─ LeaderboardManager: Top 10 computation & broadcast

Data Layer
├─ Services:
│  ├─ AuthService: JWT, bcrypt
│  └─ GameStateService: Redis read/write
├─ Models (Sequelize):
│  ├─ Player: username, created_at, owned_skins, ad_free
│  └─ PlayerSession: kills, deaths, rank, max_length, duration
└─ Config:
   ├─ database.ts: PostgreSQL connection
   ├─ redis.ts: Redis client
   └─ constants.ts: Game settings
```

**Key Patterns:**
- **Server-authoritative**: All movement validated server-side
- **60Hz game tick**: Deterministic, fixed timestep
- **Room isolation**: Each room has independent game loop
- **Redis ephemeral state**: Game state not persisted between sessions
- **Graceful degradation**: If Redis fails, new session loses state (acceptable for MVP)

### 3.3 Database Schema

**PostgreSQL:**
```sql
players (E-01)
├─ id (PK)
├─ username (UK)
├─ password_hash
├─ created_at
├─ owned_skins (array)
├─ ad_free_status (boolean)
└─ total_kills, total_deaths, total_playtime (aggregate)

player_sessions (E-02)
├─ id (PK)
├─ user_id (FK → players)
├─ room_id
├─ kills, deaths, rank, max_length, duration
├─ timestamp
└─ Trigger: auto-increment players.total_* on insert
```

**Redis:**
```
room:{roomId}                  hash: {maxPlayers, activeCount, createdAt}
snake:{roomId}:{playerId}      hash: {x, y, direction, length, boost, ...}
food:{roomId}                  set: [{x, y, rarity}]
leaderboard:{roomId}           sorted set: {playerId: length}
```

---

## 4. Synchronization Protocol

### 4.1 Update Rates

| Event | Direction | Rate | Use Case |
|-------|-----------|------|----------|
| player-input | Client → Server | 60 Hz | Movement control |
| game-state | Server → Client | 20 Hz | Snake positions, food |
| leaderboard | Server → Client | 1 Hz | Top 10 rankings |
| player-death | Server → Client | Ad-hoc | Death notification |

### 4.2 State Reconciliation

**Client Prediction:**
```
Client Action:
  1. Predict local snake position immediately (optimistic)
  2. Emit 'player-input' to server
  3. Queue prediction buffer

Server Response (20 Hz):
  1. Receive input
  2. Validate movement
  3. Compute actual position
  4. Broadcast game-state snapshot

Client Reconciliation:
  1. Receive server snapshot
  2. Compare predicted vs actual position
  3. If delta > threshold: Snap to server position
  4. If delta small: Smoothly transition
  5. Discard old predictions from buffer
```

**Remote Snake Interpolation:**
```
Receive server position at T0
  └─ Store position P0

Receive next server position at T1 (50ms later)
  └─ Store position P1

At each frame (16.67ms client-side):
  └─ Interpolate: Position = P0 + (P1 - P0) * lerp_factor
     where lerp_factor ramps from 0 → 1 over 50ms
  └─ Result: Smooth 60 FPS remote snake motion
```

---

## 5. Security Architecture

### 5.1 Authentication & Authorization

**Flow:**
```
Client sends 'join-room' + JWT token (Socket.IO handshake)
    ▼
Server: socket-handler verifies JWT
  - Decode token
  - Check expiry
  - Validate signature
    ▼
  ✓ Valid: Allow join-room
  ✗ Invalid: Disconnect socket, return 401
```

**JWT Token:**
- **Payload**: user_id, username, ad_free, exp (7 days)
- **Signature**: HS256 (HMAC-SHA256) with secret key
- **Rotation**: Rolling window (refresh on each request in Phase 2)

### 5.2 Game Validation

**Input Validation (Anti-Cheat):**
```
Server receives player-input event:
  1. Check direction: must be valid angle (0-360)
  2. Check boost: only if playtime > 1 second
  3. Check speed: cannot exceed MAX_SPEED
  4. Check timestamp: not from future
  ▼
  If any check fails: Log suspected cheat, ignore input
  If all pass: Update snake state
```

**Collision Validation (Server-Authoritative):**
```
All collision detection runs on server (60Hz)
Client never determines death
Client never increases score
Server broadcasts authoritative results
```

### 5.3 Rate Limiting

**REST API:**
```
100 requests / minute per user (IP-based for guests)
Bucket: redis-rate-limit:{userId}:{endpoint}
Sliding window with 60-second expiry
```

**WebSocket:**
```
player-input: Max 60 per second (natural limit)
Excess events: Silently dropped server-side
```

---

## 6. Scalability Considerations

### 6.1 Current Limits (Phase 1)

| Metric | Limit | Rationale |
|--------|-------|-----------|
| Players/room | 50 | Broadcast performance (20 Hz * 50 snakes) |
| Food/room | 800 | Client render capacity |
| Rooms/server | 20-50 | CPU + memory (rough estimate) |
| Max DAU | 500-1000 | Single DigitalOcean droplet |

### 6.2 Optimization Path (Phase 2+)

**Bandwidth Reduction:**
- Delta updates (only send changed snakes)
- Binary WebSocket (MessagePack)
- Player visibility (only broadcast snakes in viewport)

**Compute Reduction:**
- Room sharding (multiple servers)
- Spatial partitioning (quadtree for collisions)
- Lazy leaderboard (compute on-demand, not every tick)

**Memory Efficiency:**
- Game state pruning (remove old food, dead snakes)
- Redis cluster (horizontal scaling)
- Connection pooling (PostgreSQL)

---

## 7. Deployment Architecture

### 7.1 Docker Compose Stack

```
docker-compose.yml (5 services)

frontend (nginx:alpine)
  ├─ Serves compiled Phaser client
  ├─ Listens on port 80/443
  └─ Routes /api/ and /socket.io/ to backend

backend (node:18-alpine + pm2-runtime)
  ├─ Express + Socket.IO server
  ├─ Listens on port 3000 (via nginx proxy)
  ├─ PM2 cluster mode (2-4 worker processes)
  └─ Auto-restart on crash

postgres (postgres:14-alpine)
  ├─ Persistent data store
  ├─ Listens on port 5432 (internal only)
  └─ Volume: /var/lib/postgresql/data

redis (redis:7-alpine)
  ├─ Game state cache
  ├─ Listens on port 6379 (internal only)
  └─ Volume: /data (optional AOF persistence)

adminer (adminer:latest)
  ├─ Database GUI (dev only, disable in prod)
  ├─ Listens on port 8080
  └─ For debugging SQL queries
```

**Networking:**
```
All services connected via Docker internal network
nginx reverse proxy (single entry point)
  - / → frontend
  - /api/ → backend
  - /socket.io/ → backend (WebSocket upgrade)
```

### 7.2 Environment Variables

```
.env.example:
DATABASE_URL=postgres://user:pass@postgres:5432/snake
REDIS_URL=redis://redis:6379
JWT_SECRET=your-secret-key
NODE_ENV=production
LOG_LEVEL=info
```

---

## 8. Error Handling & Resilience

### 8.1 Client Error Handling

```
NetworkManager:
  - WebSocket disconnect: Show "Reconnecting..." overlay
  - Reconnection attempt: Exponential backoff (1s, 2s, 4s, 8s)
  - Max retries: 5 attempts
  - Fallback: Show "Connection lost" → Retry button

GameScene:
  - Server timeout (>2s no heartbeat): Pause game, show spinner
  - Resume on server message
```

### 8.2 Server Error Handling

```
Game Loop:
  - Redis connection loss: Log error, continue in-memory (ephemeral data)
  - Database connection loss: Log error, in-game features degrade
  - Uncaught exception in tick: Catch, log, continue next tick

WebSocket:
  - Invalid JSON: Silently drop, log
  - Missing required fields: Send error event, don't disconnect
  - Cheat detection: Log, ignore input, don't ban (Phase 2)
```

---

## 9. Monitoring & Observability

### 9.1 Server Metrics (Phase 2)

```
Real-time:
  - Active rooms count
  - Active players count
  - Average room size
  - Game loop tick duration
  - Network message latency
  - WebSocket message rate

Logs:
  - Player join/leave events
  - Death events (kills, rank)
  - Errors (with stack trace)
  - Rate limit violations
  - Cheat detections
```

### 9.2 Client Diagnostics

```
Network:
  - Player ping (Round trip time)
  - Packet loss
  - Message delivery rate

Performance:
  - FPS (frames per second)
  - Memory usage
  - Render time per frame
```

---

## 10. Technology Rationale

| Choice | Alternative | Why Selected |
|--------|-------------|--------------|
| Phaser.js | Babylon.js, Three.js | 2D focus, scene system, built-in physics |
| Express.js | Fastify, Hapi | Ecosystem, middleware, simplicity |
| Socket.IO | WebSocket raw, gRPC | Built-in rooms, fallback to polling, debugging |
| PostgreSQL | MongoDB | Relational data, ACID, leaderboard queries |
| Redis | Memcached | Pub/Sub, data structures, game state |
| Docker | K8s (MVP) | Simplicity, local dev, easy deployment |
| TypeScript | JavaScript | Type safety, refactoring confidence |

---

## 11. Known Limitations & Tradeoffs

### 11.1 Phase 1 Tradeoffs

| Tradeoff | Impact | Mitigation |
|----------|--------|-----------|
| Full state broadcasts (20 Hz) | Higher bandwidth per player | Phase 2: Delta updates |
| No player visibility culling | Broadcast to all players in room | Phase 2: Spatial partitioning |
| In-memory room state | Loss of game state on server crash | Phase 2: Redis persistence layer |
| Guest-only authentication | No persistent stats | Phase 2: Full auth system |
| Single server | Limited to 500-1000 DAU | Phase 2: Horizontal scaling + room sharding |

### 11.2 Known Issues

```
None documented (Phase 1 complete)
```

---

## 12. Future Architecture Improvements

### Phase 2 (Estimated Q2 2026)

- Persistent user authentication (email/password)
- Redis persistence (AOF) for game state backup
- Delta updates for bandwidth optimization
- Spectator mode (read-only player copies)

### Phase 3 (Estimated Q3 2026)

- Horizontal scaling (multiple server instances)
- Room sharding (distribute rooms across servers)
- Kubernetes orchestration
- Binary WebSocket (MessagePack)
- Player visibility culling (viewport-based broadcasting)

### Phase 4+ (Estimated Q4 2026+)

- Ranked matchmaking (ELO system)
- Custom game modes
- Mobile app (React Native)
- Advanced analytics dashboard
