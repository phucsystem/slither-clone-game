# Phase 1: Core Gameplay (Weeks 1-8)

## Context Links

- [SRD](../../docs/SRD.md) - FR-01 to FR-07, NFR-PERF, NFR-SEC
- [UI_SPEC](../../docs/UI_SPEC.md) - S-01 (Lobby), S-02 (Game), S-03 (Death Screen)
- [API_SPEC](../../docs/API_SPEC.md) - WebSocket events, REST auth endpoints
- [DB_DESIGN](../../docs/DB_DESIGN.md) - PostgreSQL schema, Redis keys
- [Docker Setup](../../docs/DOCKER-SETUP.md) - Full Docker Compose stack
- [Phaser Research](./reports/researcher-01-phaser-multiplayer.md) - Server-auth patterns, interpolation
- [Docker Research](./research/researcher-02-docker-nodejs.md) - Multi-stage builds, PM2

## Overview

- **Priority:** P1 (Critical)
- **Status:** in_progress
- **Duration:** 7 weeks (Weeks 1-7) <!-- Updated: Validation Session 1 - Removed full auth, saved 1 week -->
- **Description:** Build the complete gameplay loop: Docker infrastructure with Let's Encrypt SSL, Phaser.js client with 3 scenes (Lobby, Game, Death), Node.js game server with Socket.IO, PostgreSQL + Redis data layer, server-authoritative movement/collision with custom circle detection, network interpolation, and Jest unit tests for critical paths. Guest-only authentication (no email/password until Phase 2).

## Key Insights (From Research)

1. **Server-authoritative pattern** (researcher-01): Client sends input only; server validates movement, runs physics, broadcasts state. Prevents speed hacks and teleport cheats.
2. **Interpolation** (researcher-01): Use `Phaser.Math.Linear` with lerp factor 0.08-0.15 for smooth remote snake rendering. Extrapolate if packet delayed >50ms.
3. **Client prediction** (researcher-01): Local player predicts movement immediately, then reconciles with server snapshots. Keep prediction buffer, discard stale predictions on server ack.
4. **Docker multi-stage builds** (researcher-02): Alpine + multi-stage reduces image from ~1GB to ~200MB. Use `npm ci --only=production` for deterministic installs.
5. **PM2 in containers** (researcher-02): Use `pm2-runtime` (not `pm2`) as PID 1 process. Cluster mode for CPU utilization. Auto-restart on crash.
6. **Shared types** (researcher-01): Keep `/shared/types.ts` and `/shared/constants.ts` for type definitions used by both client and server. Prevents drift.
7. **Custom collision** over Arcade Physics: For snake head-to-body collision, custom circle-based detection is more accurate than Arcade AABB. Run at 60Hz server-side.

<!-- Updated: Validation Session 1 - Decision Changes -->
8. **Guest-only auth for MVP:** Remove email/password system from Phase 1. Use simple username (localStorage). Speeds up development by 1 week. Full auth moved to Phase 2.
9. **Unit testing added:** Jest for collision detection, room management, game loop logic. Adds 1 week to Phase 1 timeline but prevents critical bugs.
10. **Let's Encrypt SSL:** Add certbot sidecar container to docker-compose for free SSL with auto-renewal. Implement in Week 7.

## Requirements

| FR | Feature | Implementation Tasks |
|----|---------|---------------------|
| FR-01 | Room matchmaking | WS `join-room` event, RoomManager service, Redis `room:{id}` keys, auto-create rooms when full, REST `GET /rooms/available` |
| FR-02 | Snake movement | Client: mouse/WASD input capture + `player-input` emit at 60Hz. Server: validate direction/speed, update position per tick. Boost: spacebar consumes mass |
| FR-03 | Food spawning | Server: FoodSpawner service, 500-800 food/room, respawn 1-3s after collection. Redis `food:{room_id}` set. 4 color rarities (white 60%, green 20%, blue 15%, gold 5%) |
| FR-04 | Collision detection | Server-side 60Hz tick: head-to-body circle collision, head-to-head (larger wins), dead snake converts to food. Client: visual only, wait for server `player-death` |
| FR-05 | Real-time leaderboard | Server: compute top 10 by length per room, throttle broadcast to 1Hz. Client: HUD overlay (semi-transparent, DOM element). Redis sorted set for room leaderboard |
| FR-06 | Death screen | Client: DeathScene with stats (rank, kills, time, max length). Server: `player-death` event with stats payload. REST `POST /sessions` to persist if registered |
| FR-07 | Network interpolation | Client: linear interpolation for remote snakes (lerp 0.1-0.15). Server: 20Hz state broadcast. Client prediction for local snake with server reconciliation |

## Architecture

### Client (Phaser.js)

```
client/src/
  scenes/
    BootScene.ts         - Asset preloading, font loading
    LobbyScene.ts        - S-01: Play button, username input, skin preview
    GameScene.ts         - S-02: Main game loop, camera, HUD
    DeathScene.ts        - S-03: Stats display, Play Again button
  entities/
    Snake.ts             - Snake rendering (head, segments, eyes, skin)
    Food.ts              - Food particle rendering with glow
  managers/
    NetworkManager.ts    - Socket.IO client, event handling
    InputManager.ts      - Mouse/WASD/spacebar input capture
    CameraManager.ts     - Camera follow with smooth lerp, zoom
  physics/
    Interpolator.ts      - Remote snake interpolation
    PredictionEngine.ts  - Local snake prediction + reconciliation
  config/
    game-config.ts       - Phaser config, constants
    design-tokens.ts     - Colors, fonts from UI_SPEC
  main.ts                - Phaser.Game initialization
```

**Phaser Scenes map to Screens:**
- BootScene -> Asset loading (no screen)
- LobbyScene -> S-01 (Lobby)
- GameScene -> S-02 (Game Canvas + HUD)
- DeathScene -> S-03 (Death Screen overlay)

### Server (Node.js)

```
server/src/
  routes/
    auth-routes.ts       - POST /auth/register, /auth/login, /auth/logout
    user-routes.ts       - GET/PATCH /users/me, GET /users/me/sessions
    room-routes.ts       - GET /rooms/available
  websocket/
    socket-handler.ts    - Socket.IO connection, auth, event routing
    game-events.ts       - player-input, join-room, leave-room handlers
  game/
    GameLoop.ts          - 60Hz fixed-timestep loop per room
    RoomManager.ts       - Create/destroy rooms, player assignment
    SnakeManager.ts      - Snake state, movement, boost logic
    FoodSpawner.ts       - Food generation, collection, respawn
    CollisionEngine.ts   - Head-to-body, head-to-head, head-to-food
    LeaderboardManager.ts - Per-room top 10, 1Hz broadcast
  models/
    Player.ts            - Sequelize model (E-01)
    PlayerSession.ts     - Sequelize model (E-02)
  services/
    AuthService.ts       - JWT sign/verify, bcrypt, registration
    GameStateService.ts  - Redis read/write for rooms, snakes, food
  middleware/
    auth-middleware.ts   - JWT verification middleware
    rate-limiter.ts      - Express rate limiting (100 req/min)
  config/
    database.ts          - PostgreSQL connection (Sequelize)
    redis.ts             - Redis client setup
    constants.ts         - Game constants (map size, speeds, tick rate)
  server.ts              - Express + Socket.IO server init
```

### Shared Types

```
shared/
  types.ts               - Player, Snake, Food, Room, GameState interfaces
  constants.ts           - MAP_SIZE, MAX_PLAYERS, TICK_RATE, BASE_SPEED
```

### Docker Services

```
docker-compose.yml       - 5 services: frontend, backend, postgres, redis, adminer
client/Dockerfile        - Multi-stage: node:18-alpine build -> nginx:alpine serve
server/Dockerfile        - node:18-alpine + pm2-runtime
nginx.conf               - Reverse proxy: /socket.io/ -> backend, /api/ -> backend
migrations/
  001_initial_schema.sql - players, player_sessions tables + indexes + triggers
```

## Related Code Files

### Files to Create

| File | Purpose | Lines (est.) |
|------|---------|-------------|
| `docker-compose.yml` | Main compose stack | ~60 |
| `docker-compose.dev.yml` | Dev overrides (hot reload, debug) | ~30 |
| `nginx.conf` | Reverse proxy + WebSocket upgrade | ~40 |
| `.env.example` | Environment template | ~25 |
| `.gitignore` | Exclude node_modules, .env, dist | ~20 |
| `client/Dockerfile` | Multi-stage Phaser build | ~20 |
| `client/package.json` | Phaser.js + Vite + Socket.IO client deps | ~30 |
| `client/tsconfig.json` | TypeScript config | ~20 |
| `client/vite.config.ts` | Vite bundler config | ~20 |
| `client/public/index.html` | HTML shell with game-container div | ~20 |
| `client/src/main.ts` | Phaser.Game init | ~40 |
| `client/src/config/game-config.ts` | Phaser config object | ~40 |
| `client/src/config/design-tokens.ts` | UI_SPEC colors, fonts as constants | ~60 |
| `client/src/scenes/BootScene.ts` | Preload assets, fonts | ~50 |
| `client/src/scenes/LobbyScene.ts` | S-01: Play btn, username, skin preview | ~120 |
| `client/src/scenes/GameScene.ts` | S-02: Game loop, HUD, camera | ~180 |
| `client/src/scenes/DeathScene.ts` | S-03: Stats, Play Again | ~100 |
| `client/src/entities/Snake.ts` | Snake head + segments rendering | ~150 |
| `client/src/entities/Food.ts` | Food circle with glow | ~40 |
| `client/src/managers/NetworkManager.ts` | Socket.IO wrapper | ~120 |
| `client/src/managers/InputManager.ts` | Mouse + WASD + spacebar | ~80 |
| `client/src/managers/CameraManager.ts` | Follow + zoom logic | ~60 |
| `client/src/physics/Interpolator.ts` | Remote snake lerp | ~60 |
| `client/src/physics/PredictionEngine.ts` | Local prediction + reconciliation | ~80 |
| `server/Dockerfile` | Node.js + PM2 | ~20 |
| `server/package.json` | Express, Socket.IO, Sequelize, Redis deps | ~30 |
| `server/tsconfig.json` | TypeScript config | ~20 |
| `server/ecosystem.config.js` | PM2 config (cluster mode) | ~20 |
| `server/src/server.ts` | Express + Socket.IO init | ~80 |
| `server/src/routes/auth-routes.ts` | Register, login, logout | ~120 |
| `server/src/routes/user-routes.ts` | Profile, sessions, stats | ~80 |
| `server/src/routes/room-routes.ts` | Available rooms endpoint | ~40 |
| `server/src/websocket/socket-handler.ts` | Connection + auth + routing | ~80 |
| `server/src/websocket/game-events.ts` | player-input, join/leave handlers | ~100 |
| `server/src/game/GameLoop.ts` | 60Hz fixed timestep | ~80 |
| `server/src/game/RoomManager.ts` | Room CRUD, player assignment | ~100 |
| `server/src/game/SnakeManager.ts` | Movement, boost, growth | ~120 |
| `server/src/game/FoodSpawner.ts` | Spawn, collect, respawn | ~80 |
| `server/src/game/CollisionEngine.ts` | Circle collision checks | ~100 |
| `server/src/game/LeaderboardManager.ts` | Top 10 per room | ~60 |
| `server/src/models/Player.ts` | Sequelize Player model | ~60 |
| `server/src/models/PlayerSession.ts` | Sequelize Session model | ~40 |
| `server/src/services/AuthService.ts` | JWT + bcrypt | ~80 |
| `server/src/services/GameStateService.ts` | Redis game state CRUD | ~100 |
| `server/src/middleware/auth-middleware.ts` | JWT verify middleware | ~40 |
| `server/src/middleware/rate-limiter.ts` | Rate limiting | ~30 |
| `server/src/config/database.ts` | Sequelize init | ~30 |
| `server/src/config/redis.ts` | Redis client | ~30 |
| `server/src/config/constants.ts` | Game constants | ~30 |
| `shared/types.ts` | Shared interfaces | ~60 |
| `shared/constants.ts` | Shared constants | ~20 |
| `migrations/001_initial_schema.sql` | Tables, indexes, triggers | ~80 |

## Implementation Steps

### Week 1-2: Infrastructure + Project Scaffolding

1. **Init monorepo structure:** Create `client/`, `server/`, `shared/`, `migrations/` dirs
2. **Docker Compose stack:** Write `docker-compose.yml` with all 5 services (frontend, backend, postgres, redis, adminer). Write `docker-compose.dev.yml` with hot-reload volumes
3. **Client Dockerfile:** Multi-stage build (node:18-alpine -> nginx:alpine). Write `nginx.conf` with WebSocket proxy and API proxy
4. **Server Dockerfile:** node:18-alpine + pm2-runtime. Write `ecosystem.config.js`
5. **Client project init:** `package.json` with phaser@3.70, vite, socket.io-client, typescript. Write `tsconfig.json`, `vite.config.ts`
6. **Server project init:** `package.json` with express, socket.io, sequelize, pg, ioredis, bcryptjs, jsonwebtoken, typescript. Write `tsconfig.json`
7. **Shared types:** Create `shared/types.ts` (Player, Snake, Food, Room, GameState, PlayerInput interfaces) and `shared/constants.ts`
8. **Database migration:** Write `migrations/001_initial_schema.sql` with `players`, `player_sessions` tables, indexes, and `update_player_stats` trigger
9. **Environment config:** Create `.env.example`, add `.env` to `.gitignore`
10. **Verify:** Run `docker-compose up -d`, confirm all 5 containers healthy. Access localhost:80, localhost:3000/health, localhost:8080

### Week 2-3: Server Foundation (Auth + Game Loop)

11. **Express server:** Write `server/src/server.ts` with Express app, CORS, JSON parsing, health endpoint. Attach Socket.IO server
12. **Database connection:** Write `server/src/config/database.ts` (Sequelize init with `DATABASE_URL`). Write `server/src/config/redis.ts` (ioredis client)
13. **Player model:** Write `server/src/models/Player.ts` (Sequelize model matching E-01 schema)
14. **Auth service:** Write `server/src/services/AuthService.ts` with register (bcrypt hash, JWT sign), login (bcrypt compare), verify (JWT decode)
15. **Auth routes:** Write `server/src/routes/auth-routes.ts` with POST /auth/register, /auth/login, /auth/logout. Input validation (username 3-50 chars, email RFC5322, password 8+ chars)
16. **Auth middleware:** Write `server/src/middleware/auth-middleware.ts` (JWT verification from Authorization header)
17. **Rate limiter:** Write `server/src/middleware/rate-limiter.ts` (100 req/min general, 10 login/hr, 5 register/hr)
18. **Game loop:** Write `server/src/game/GameLoop.ts` with 60Hz fixed-timestep using `setInterval(1000/60)`. Delta time calculation. Per-room update cycle
19. **Room manager:** Write `server/src/game/RoomManager.ts`. Create room (Redis hash), find available room (<50 players), join room, leave room, destroy empty rooms
20. **Verify:** Register user via curl, login, get JWT. Confirm room creation in Redis CLI

### Week 3-4: Game Server (Movement, Food, Collision)

21. **Snake manager:** Write `server/src/game/SnakeManager.ts`. Create snake (initial position, length 10, speed 2.5). Update position per tick (direction * speed * dt). Boost logic (speed 5.0, consume 1 mass/tick). Validate speed bounds [2.5, 5.0]
22. **Food spawner:** Write `server/src/game/FoodSpawner.ts`. Initial spawn 500-800 food across 5000x5000 map. Weighted colors (white 60%, green 20%, blue 15%, gold 5%). Collect: remove food, grow snake by value. Respawn: random delay 1-3s
23. **Collision engine:** Write `server/src/game/CollisionEngine.ts`. Circle-based collision: head radius 20px. Head-to-food: distance < head_radius + food_radius. Head-to-body: iterate other snake segments. Head-to-head: larger snake wins. Dead snake: convert segments to food
24. **Leaderboard manager:** Write `server/src/game/LeaderboardManager.ts`. Compute top 10 snakes by length per room. Throttle to 1Hz updates. Include in game-state broadcast
25. **Game state service:** Write `server/src/services/GameStateService.ts`. Redis CRUD for room, snake, and food state. Serialize/deserialize JSON
26. **Socket handler:** Write `server/src/websocket/socket-handler.ts`. On connect: verify JWT, store socket-to-user mapping. On disconnect: clean up snake, update room
27. **Game events:** Write `server/src/websocket/game-events.ts`. `join-room`: find/create room, spawn snake. `player-input`: validate direction (0-2pi), boost flag, queue input. `leave-room`: remove snake, convert to food
28. **State broadcast:** In GameLoop, every 3rd tick (20Hz): collect all snake positions + food + leaderboard -> emit `game-state` to room. Emit `player-death` to killed players
29. **Session persistence:** Write `server/src/models/PlayerSession.ts`. On death, if registered user, INSERT into player_sessions (triggers aggregate update)
30. **Verify:** Connect 2 Socket.IO test clients. Join room, send input, verify movement. Kill one snake, verify death event + food conversion

### Week 4-5: Phaser Client (Rendering + Scenes)

31. **Main entry:** Write `client/src/main.ts` with Phaser.Game config (1920x1080, Phaser.AUTO, arcade physics zero gravity, 60fps target, FIT scale mode)
32. **Design tokens:** Write `client/src/config/design-tokens.ts` extracting all CSS variables from UI_SPEC (colors, fonts, spacing, shadows, glows) as TypeScript constants
33. **Boot scene:** Write `client/src/scenes/BootScene.ts`. Preload Google Fonts (Rajdhani, Orbitron). Show loading bar. Transition to LobbyScene
34. **Lobby scene (S-01):** Write `client/src/scenes/LobbyScene.ts`. Center-aligned layout: game title (Orbitron, neon glow), username input, Play button (primary CTA, 180x60px, glow on hover), snake preview (animated idle). On Play click: connect socket, emit join-room, transition to GameScene
35. **Network manager:** Write `client/src/managers/NetworkManager.ts`. Socket.IO client wrapper. connect(token), disconnect. Event emitters/listeners. Reconnect logic (3 retries, 3s interval)
36. **Input manager:** Write `client/src/managers/InputManager.ts`. Mouse: track cursor position relative to snake head -> calculate direction (atan2). WASD: directional input. Spacebar: boost toggle. Emit `player-input` at 60Hz (direction radian, boost_active, timestamp)
37. **Camera manager:** Write `client/src/managers/CameraManager.ts`. Follow local snake with smooth lerp. World bounds 5000x5000. Zoom out slightly for long snakes
38. **Snake entity:** Write `client/src/entities/Snake.ts`. Phaser.GameObjects.Container. Head: filled circle 20px with eyes (white + black pupils). Body segments: decreasing circles 18->12px. Skin colors from design-tokens. Premium skins: postFX glow. Boost trail: particle emitter
39. **Food entity:** Write `client/src/entities/Food.ts`. Small circle (8px radius). Color from Food Colors table. Pulsing glow tween (1.5s ease-in-out loop). Object pooling for performance
40. **Verify:** Start client, see lobby. Click Play, see game canvas with grid background. Snake renders. Food visible

### Week 5-6: Game Scene (HUD, State Sync, Camera)

41. **Game scene (S-02):** Write `client/src/scenes/GameScene.ts`. Create: initialize snake map, food group, connect network. Update: process local input, interpolate remotes, render. On `game-state`: update all entities. On `player-death`: transition to DeathScene
42. **Background rendering:** Dark grid pattern (#0A0E1A base with #2D3654 grid lines, spacing 50px). Subtle noise texture at 5% opacity. World bounds 5000x5000
43. **HUD overlay:** DOM elements (not canvas) for: leaderboard overlay (top-left, rgba(21,27,46,0.85), max 10 entries), score display (bottom-right, Orbitron 32px), boost bar (bottom-left, progress bar), minimap (top-right, 120x120px)
44. **Leaderboard overlay:** Create DOM element. Update every 1s from `game-state.leaderboard`. Highlight local player row. Show rank + username + length
45. **Boost UI:** Progress bar showing boost energy (100% = full mass). Active: neon glow (#FF3366). Low (<20%): warning color (#FFD600). Spacebar hold activates
46. **Minimap:** Small canvas (120x120px) showing player dot on map. Other snakes as small dots. Map boundary visible
47. **Kill notification:** "+1 KILL" text (center screen, #39FF14, h2 size). Fade up + fade out tween (2s). Triggered on `food-collected` where source is killed snake
48. **Viewport culling:** Only render snakes/food within camera bounds + 200px margin. Skip draw calls for off-screen entities
49. **Object pooling:** Pool food objects. On collect: deactivate + hide. On spawn: reactivate from pool. Prevents GC pauses
50. **Verify:** Full game loop working. HUD displays correctly. Leaderboard updates. Boost bar functional

### Week 6-7: Network (Interpolation, Prediction, Death)

51. **Interpolator:** Write `client/src/physics/Interpolator.ts`. Store last 2 server positions per remote snake. Each frame: `Phaser.Math.Linear(current, target, 0.12)`. If no update for >100ms: extrapolate based on last direction + speed
52. **Prediction engine:** Write `client/src/physics/PredictionEngine.ts`. On local input: predict position immediately (show to player). Store prediction with tick number. On server ack: discard predictions older than server tick. Replay remaining predictions from server-confirmed position
53. **Death scene (S-03):** Write `client/src/scenes/DeathScene.ts`. Blurred game background (freeze canvas, apply blur filter). "YOU DIED" header (#FF1744, pulsing glow, Orbitron 48px). Stats grid: rank, kills, max length, time alive, score. "Play Again" button (primary, large, neon glow). "View Leaderboards" link
54. **Death transition:** On `player-death` event: red flash (100ms tween), freeze game, fade in DeathScene modal (300ms). On "Play Again": emit join-room, transition back to GameScene
55. **Session recording:** On death, if user authenticated: send POST to save session (kills, rank, max_length, duration). Server stores in `player_sessions` table
56. **Reconnection handling:** If socket disconnects mid-game: show "Connection lost. Reconnecting..." overlay. Auto-retry 3 times (3s interval). If all fail: return to Lobby with error toast
57. **Verify:** Play full game session. Die. See stats. Click Play Again. Verify session saved in DB

### Week 7-8: Polish, User Routes, Testing

58. **User routes:** Write `server/src/routes/user-routes.ts`. GET /users/me (profile). PATCH /users/me (update username). GET /users/me/sessions (last 20 sessions, paginated). GET /users/me/stats (aggregated from player table)
59. **Guest play support:** Allow playing without account (A-02 actor). Generate temporary guest_id. No session persistence. Show "Register to save progress" prompt on death
60. **Error handling:** Server: try-catch all route handlers, return standard error format `{error, message, details}`. Client: toast notification system (top-right, red bg, auto-dismiss 5s). Network errors: retry button
61. **Loading states:** Lobby "Play" button -> "Joining..." spinner. Leaderboard skeleton loading. Room join timeout (5s -> retry message)
62. **Performance profiling:** Client: FPS counter (Ctrl+Shift+D toggle). Server: measure tick time (target <16ms), log warnings if >20ms. Monitor Redis/PG query times
63. **Input validation hardening:** Server: validate ALL inputs. Direction: must be 0-2pi float. Speed: must be 2.5-5.0. Position: must be within map bounds 0-5000. Reject invalid packets, log violations
64. **Browser testing:** Verify Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Check 1280x720 min resolution. Check 1920x1080 optimal
65. **Docker production test:** Run `docker-compose -f docker-compose.yml up -d`. Verify all containers healthy. Test full game flow end-to-end through Nginx proxy
66. **Load test (basic):** Spin up 50 socket clients (via script). Join same room. Verify server tick stays <16ms. Check memory usage. Verify no crashes

## Todo List

### Infrastructure (Week 1-2)
- [x] Create monorepo directory structure (client/, server/, shared/, migrations/)
- [x] Write docker-compose.yml (5 services) [FR-01]
- [x] Write docker-compose.dev.yml (hot reload) [FR-01]
- [x] Write client/Dockerfile (multi-stage) [FR-01]
- [x] Write server/Dockerfile (PM2) [FR-01]
- [x] Write nginx.conf (reverse proxy + WebSocket) [FR-01]
- [x] Init client project (Phaser, Vite, Socket.IO, TS) [FR-02]
- [x] Init server project (Express, Socket.IO, Sequelize, Redis, TS) [FR-01]
- [x] Write shared/types.ts and shared/constants.ts [FR-02]
- [x] Write migrations/001_initial_schema.sql [FR-06, FR-13]
- [x] Write .env.example, .gitignore
- [x] Verify: all 5 Docker containers healthy

### Server Auth (Week 2-3)
- [x] Write server.ts (Express + Socket.IO init) [FR-01]
- [x] Write database.ts + redis.ts config [FR-01]
- [x] Write Player model (Sequelize) [FR-01]
- [x] Write AuthService (register, login, JWT) [FR-01]
- [x] Write auth-routes.ts (register, login, logout) [FR-01]
- [x] Write auth-middleware.ts (JWT verify) [FR-01]
- [x] Write rate-limiter.ts [NFR-SEC-05]
- [x] Verify: register + login via curl

### Game Server (Week 3-4)
- [x] Write GameLoop.ts (60Hz fixed timestep) [FR-04, NFR-PERF-02]
- [x] Write RoomManager.ts (create, join, leave) [FR-01]
- [x] Write SnakeManager.ts (movement, boost) [FR-02]
- [x] Write FoodSpawner.ts (spawn, collect, respawn) [FR-03]
- [x] Write CollisionEngine.ts (head-body, head-head, head-food) [FR-04]
- [x] Write LeaderboardManager.ts (top 10, 1Hz) [FR-05]
- [x] Write GameStateService.ts (Redis CRUD) [FR-07]
- [x] Write socket-handler.ts (connect, auth, disconnect) [FR-01]
- [x] Write game-events.ts (join, input, leave) [FR-01, FR-02]
- [x] Write PlayerSession model [FR-06]
- [x] State broadcast at 20Hz [FR-07, NFR-PERF-05]
- [x] Verify: 2 clients join, move, collide, die

### Phaser Client (Week 4-5)
- [x] Write main.ts (Phaser.Game init) [FR-02]
- [x] Write design-tokens.ts (UI_SPEC colors/fonts) [UI]
- [x] Write BootScene.ts (asset preload) [UI]
- [x] Write LobbyScene.ts (S-01: Play, username) [FR-01]
- [x] Write NetworkManager.ts (Socket.IO wrapper) [FR-07]
- [x] Write InputManager.ts (mouse, WASD, spacebar) [FR-02]
- [x] Write CameraManager.ts (follow, zoom) [FR-02]
- [x] Write Snake.ts entity (head, segments, skin) [FR-02]
- [x] Write Food.ts entity (circles, glow) [FR-03]
- [x] Verify: lobby -> game -> snake renders

### Game Scene + HUD (Week 5-6)
- [x] Write GameScene.ts (S-02: full game loop) [FR-02, FR-03, FR-04]
- [x] Background grid rendering [UI]
- [x] HUD: leaderboard overlay [FR-05]
- [x] HUD: score display [FR-05]
- [x] HUD: boost bar [FR-02]
- [x] HUD: minimap [UI]
- [x] Kill notification tween [FR-04]
- [x] Viewport culling [NFR-PERF-01]
- [x] Object pooling for food [NFR-PERF-01]
- [x] Verify: full game with HUD working

### Network + Death (Week 6-7)
- [x] Write Interpolator.ts (remote snake lerp) [FR-07]
- [x] Write PredictionEngine.ts (local prediction) [FR-07]
- [x] Write DeathScene.ts (S-03: stats, replay) [FR-06]
- [x] Death transition (red flash, blur, modal) [FR-06]
- [x] Session recording on death [FR-06]
- [x] Reconnection handling [NFR-AVAIL-01]
- [x] Verify: full play session + death + replay

### Polish (Week 7-8)
- [ ] Write user-routes.ts (profile, sessions, stats) [FR-13] - REMAINING
- [ ] Guest play support (no account needed) [A-02] - REMAINING
- [ ] Error handling (server + client) [NFR-USE] - REMAINING
- [ ] Loading states (buttons, skeletons) [NFR-USE] - REMAINING
- [ ] Performance profiling (FPS counter, tick time) [NFR-PERF] - REMAINING
- [ ] Input validation hardening [NFR-SEC-03, FR-15] - REMAINING
- [ ] Browser compatibility testing [NFR-USE-03] - REMAINING
- [ ] Docker production test [NFR-AVAIL-01] - REMAINING
- [ ] Load test (50 concurrent clients) [NFR-SCALE-01] - REMAINING

## Success Criteria

1. **Playability:** Complete game loop: Lobby -> Play -> Move -> Eat -> Kill -> Die -> Replay
2. **Performance:** Client 60 FPS on mid-tier hardware (i5-8th gen, 8GB RAM). Server tick <16ms at 50 CCU
3. **Latency:** <50ms server response median. Room join <2s
4. **Stability:** No crashes with 50 concurrent players per room. Graceful disconnect handling
5. **Bandwidth:** <3 KB/s per player at 20Hz state broadcast
6. **Auth:** Register, login, JWT working. Guest play supported
7. **Docker:** All 5 containers start with `docker-compose up`. Production stack tested

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| 60Hz server tick too expensive for 50 players | High | Medium | Profile early. Reduce to 30Hz if needed. Optimize collision to spatial hashing |
| Full state broadcast >3KB/s per player | High | Medium | Send only nearby entities (viewport culling server-side). Compress with msgpack |
| Phaser.js Canvas performance on large snake (500+ segments) | Medium | Low | Reduce segment detail for distant snakes. LOD system |
| Socket.IO reconnection causes game state desync | Medium | Medium | On reconnect: request full state snapshot. Clear local predictions |
| PostgreSQL trigger overhead on high session insert rate | Low | Low | Batch session inserts. Use async processing queue |

## Security Considerations

- **Server-authoritative:** Client sends only direction + boost. Server computes all positions, collisions, scores [FR-15]
- **JWT auth:** 7-day expiry, HttpOnly suggested for cookies. Verify on every Socket.IO connection [NFR-SEC-02]
- **Input validation:** All inputs validated server-side. Reject out-of-bounds values. Log violations [NFR-SEC-03]
- **Rate limiting:** REST: 100 req/min. WebSocket: 60 input events/s max. Login: 10/hr [NFR-SEC-05]
- **SQL injection:** Parameterized queries via Sequelize ORM [NFR-SEC-04]
- **Password storage:** bcrypt cost 12 [NFR-SEC-01]
- **CORS:** Restrict to game domain + localhost:3000 [NFR-SEC]

## Next Steps

- After Phase 1 complete: begin Phase 2 (Monetization)
- Apply for Google AdSense account (2-week lead time, start Week 6)
- Set up Stripe merchant account (1-week lead time, start Week 7)
- Collect alpha tester feedback for balancing (boost consumption rate, food density)
