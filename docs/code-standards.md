# Code Standards & Codebase Structure

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0 (Phase 1)
**Last Updated:** 2026-02-10
**Language:** TypeScript 100%

---

## 1. Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| Files | kebab-case | `game-loop.ts`, `bot-manager.ts` |
| Classes/Types | PascalCase | `GameLoop`, `BotManager` |
| Constants | UPPER_SNAKE_CASE | `MAX_PLAYERS`, `TICK_RATE` |
| Variables/Functions | camelCase | `playerCount`, `calculateDistance()` |
| Booleans | Prefix `is`/`has` | `isAlive`, `hasBoost` |

**File size limits:** Server ≤200 LOC, Client ≤150 LOC (Phaser scenes ≤300)

---

## 2. Project Structure

```
apps/
├── client/              # Phaser.js (TypeScript)
│   ├── src/scenes/      # GameScene, LobbyScene, etc.
│   ├── src/entities/    # Snake, Food
│   ├── src/managers/    # InputManager, NetworkManager
│   └── src/config/      # Constants, design tokens
├── server/              # Node.js (TypeScript)
│   ├── src/game/        # GameLoop, CollisionEngine, BotManager
│   ├── src/routes/      # REST endpoints
│   ├── src/websocket/   # Socket.IO events
│   ├── src/models/      # Sequelize models
│   └── src/services/    # Business logic
├── shared/              # Types & constants (shared by both)
└── migrations/          # PostgreSQL schema
```

**Principle:** Organize by feature/domain for easy navigation.

---

## 3. TypeScript Requirements

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Type annotations:**
- Always explicitly type function parameters & returns
- Use interfaces for objects: `interface Snake { id: string; x: number; ... }`
- Use unions for variants: `type GameState = 'lobby' | 'playing' | 'dead';`
- Export named types: `export interface Options { ... }`

**Import order:** External → Shared → Local → Config

**Avoid:** `any`, implicit `any`, `Object` type, untyped exports

---

## 4. Code Organization (Layered)

**Routes (Express):** HTTP endpoints only
```typescript
router.post('/:id/join', auth, controller.joinRoom);
```

**WebSocket (Socket.IO):** Real-time game events
```typescript
socket.on('player-input', handler.onPlayerInput);
socket.on('join-room', handler.onJoinRoom);
```

**Game Logic (Core):** Business logic classes
- `GameLoop` — 60Hz tick, coordinates all managers
- `BotManager` — AI snake behaviors
- `CollisionEngine` — Server-authoritative collision detection
- `SnakeManager` — Snake state tracking
- `FoodSpawner` — Food spawning logic
- `LeaderboardManager` — Top 10 computation

**Services:** Reusable business logic (AuthService, GameStateService, etc.)

**Models:** Sequelize ORM models for PostgreSQL

---

## 5. Error Handling

**Server (Node.js):**
```typescript
// Wrap async operations in try-catch
try {
  const result = await service.process(data);
  logger.info('Success', { result });
} catch (error) {
  logger.error('Failed', { error: error.message });
  throw new ApiError(500, 'Internal error');
}
```

**Client (Phaser.js):**
```typescript
// Retry on network failure
try {
  await socket.joinRoom(roomId);
} catch (error) {
  this.showError('Connection lost. Retrying...');
  setTimeout(() => this.retryJoinRoom(), 2000);
}
```

**WebSocket:** Don't disconnect on invalid input — log and ignore

---

## 6. Logging Standards

```
ERROR   - Critical failures
WARN    - Cheating attempts, unexpected situations
INFO    - Game events (death, room join, etc.)
DEBUG   - Diagnostic details
```

**Format:**
```typescript
logger.info('Player joined room', {
  playerId: 'uuid-123',
  roomId: 'room-456',
  timestamp: Date.now(),
});
```

---

## 7. Testing (Critical Paths Only)

**Must test:**
- Collision detection (deterministic math)
- Movement validation (cheat prevention)
- Leaderboard computation
- Authentication (JWT validation)

**Test structure:**
```typescript
describe('CollisionEngine', () => {
  it('should detect food collision', () => {
    const result = engine.checkHeadToFood({ x: 100, y: 100, radius: 10 }, { x: 105, y: 105 });
    expect(result).toBe(true);
  });
});
```

**Location:** `__tests__/` folder co-located with source

---

## 8. Code Review Checklist

- [ ] All functions explicitly typed (no `any`)
- [ ] Error handling present (try-catch or error callbacks)
- [ ] No console logs in production code (use logger)
- [ ] Variable names are descriptive (no `x`, `i`, `temp`)
- [ ] Tests pass locally before commit
- [ ] No security issues (no SQL injection, XSS, exposed secrets)
- [ ] Performance acceptable (game loop < 5ms per tick)

---

## 9. Performance Guidelines

| Metric | Target | How to Monitor |
|--------|--------|----------------|
| Server tick | 60 Hz (16.6ms) | `console.time()` in game loop |
| Collision checks | <3ms per tick | Profile in Chrome DevTools |
| Network latency | <100ms acceptable | Check browser Network tab |
| Memory per player | <10 MB | Chrome DevTools → Memory |

**Tips:**
- Don't iterate over all players if not needed
- Cache computed values (e.g., sorted leaderboards)
- Use spatial partitioning for large collisions (Phase 2+)

---

## 10. Security Checklist

- [ ] All user input validated server-side
- [ ] No secrets in code (use `.env`)
- [ ] SQL injection prevented (Sequelize ORM)
- [ ] XSS prevention (no `eval()`, sanitize input)
- [ ] HTTPS/TLS enabled in production
- [ ] Rate limiting on REST API (100 req/min per user)
- [ ] JWT tokens expire (7 days)
- [ ] Passwords hashed with bcrypt (12 rounds)

---

## 11. Documentation Standards

**JSDoc for exported functions:**
```typescript
/**
 * Check if head collides with food
 * @param head - Circle with {x, y, radius}
 * @param food - Point {x, y}
 * @returns true if collision detected
 */
export function checkHeadToFood(head: Circle, food: Point): boolean { ... }
```

**README.md** for each module explaining purpose & usage

**Inline comments** only for non-obvious logic

---

## 12. Git & Commits

**Message format (Conventional Commits):**
```
<type>(<scope>): <subject>

<body>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`

**Examples:**
```
feat(collision): add circle-based head detection
fix(network): handle socket reconnection timeout
docs(api): update endpoint descriptions
```

**Branch naming:** `feature/`, `bugfix/`, `docs/`, `refactor/`

---

## 13. Dependencies

**Approved stack:**
- Server: Express, Socket.IO, Sequelize, Redis, JWT, bcrypt
- Client: Phaser.js, Socket.IO-client, Vite
- All: TypeScript, Node 18+, Docker

**Before adding:** Is it necessary? Is it maintained? Size impact?

---

## 14. Intentional Constraints (Phase 1)

| Constraint | Reason |
|-----------|--------|
| No enum (use unions) | Better tree-shaking, serialization |
| Single server | Simplicity for MVP |
| No OOP inheritance | Composition only, simpler testing |
| No decorators | Avoid magic, wait for TS stability |

---

## 15. Common Tasks

| Task | How-to |
|------|--------|
| Add REST endpoint | Create route in `routes/`, add controller, wire in `server.ts` |
| Add WebSocket event | Add handler in `websocket/game-events.ts`, register in socket handler |
| Add game mechanic | Add to `GameLoop.tick()`, broadcast in game-events, handle in GameScene |
| Debug network | Chrome DevTools Network tab, check `socket.io/debug` endpoint |
| Profile performance | Chrome DevTools Performance tab, check tick duration |
| Add error handling | Wrap in try-catch, log with logger, return appropriate status |
| Write test | Create `.test.ts` in `__tests__/` folder, follow AAA pattern (Arrange-Act-Assert) |

---

## 16. Key Files Reference

| File | Purpose |
|------|---------|
| `apps/server/src/game/game-loop.ts` | 60Hz core game loop, orchestrates all managers |
| `apps/server/src/game/bot-manager.ts` | AI snake spawning & behavior logic |
| `apps/server/src/game/collision-engine.ts` | Server-authoritative collision detection |
| `apps/client/src/scenes/game-scene.ts` | Main gameplay rendering & client prediction |
| `apps/shared/types.ts` | Shared type definitions (Player, Snake, Food, etc.) |
| `apps/shared/constants.ts` | Shared constants (MAP_SIZE, TICK_RATE, speeds) |

---

See `system-architecture.md` for detailed architecture & data flow.
