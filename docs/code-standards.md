# Code Standards & Codebase Structure

**Project:** Multiplayer Snake Game (Slither.io Clone)
**Version:** 1.0 (Phase 1)
**Last Updated:** 2026-02-10
**Language:** TypeScript 100%
**Architecture:** Monorepo (Yarn Workspaces)

---

## 1. Directory Structure & Naming Conventions

### 1.1 Root Structure

```
.
├── apps/
│   ├── client/          # Phaser.js frontend
│   ├── server/          # Node.js backend
│   ├── shared/          # Shared types & constants
│   └── migrations/      # Database migrations
├── docs/                # Documentation
├── plans/               # Development plans & reports
├── prototypes/          # UI mockups & design system
├── docker-compose.yml   # Main deployment stack
├── docker-compose.dev.yml
├── nginx.conf           # Reverse proxy
├── .env.example         # Environment template
└── package.json         # Root workspace
```

### 1.2 File & Folder Naming

| Category | Convention | Example | Rationale |
|----------|-----------|---------|-----------|
| TypeScript files | kebab-case | `game-loop.ts`, `player-input.ts` | Industry standard |
| Directories | kebab-case | `collision-engine/`, `network-manager/` | Consistency |
| Classes/Types | PascalCase | `GameLoop`, `PlayerInput`, `SnakeManager` | TypeScript convention |
| Constants | UPPER_SNAKE_CASE | `MAX_PLAYERS`, `TICK_RATE`, `MAP_WIDTH` | Readability |
| Variables/Functions | camelCase | `playerCount`, `calculateDistance()` | JavaScript convention |
| Boolean variables | Prefix with `is` or `has` | `isAlive`, `hasBoost` | Intent clarity |

### 1.3 Module Organization

**By feature (recommended approach):**
```
apps/server/src/
├── game/
│   ├── collision-engine.ts
│   ├── food-spawner.ts
│   ├── game-loop.ts
│   ├── leaderboard-manager.ts
│   ├── room-manager.ts
│   └── snake-manager.ts
├── routes/
│   ├── auth-routes.ts
│   ├── room-routes.ts
│   └── user-routes.ts
├── websocket/
│   ├── game-events.ts
│   └── socket-handler.ts
└── ...
```

**Rationale:** Logical grouping by domain allows developers to find related code quickly.

---

## 2. TypeScript Configuration & Best Practices

### 2.1 Strict Mode Requirements

**All files must have `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2.2 Type Safety Patterns

**✓ DO:**
```typescript
// 1. Always explicitly type function parameters & return
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// 2. Use interfaces for objects
interface Snake {
  id: string;
  x: number;
  y: number;
  direction: number;
  segments: Array<{ x: number; y: number }>;
  boost: boolean;
}

// 3. Use type unions for variants
type GameState = 'lobby' | 'playing' | 'dead' | 'spectating';

// 4. Import/export named types
export interface GameLoopOptions {
  tickRate: number;
  maxPlayers: number;
}

// 5. Use const for immutable collections
const TICK_RATE = 60 as const;
const MAX_PLAYERS = 50 as const;
```

**✗ AVOID:**
```typescript
// Don't use 'any'
function process(data: any) { }  // ✗ BAD

// Don't use implicit 'any'
function process(data) { }  // ✗ BAD

// Don't use 'Object' or 'object'
const config: Object = { };  // ✗ BAD

// Don't omit return types on exported functions
export function joinRoom() { }  // ✗ BAD
```

### 2.3 Import/Export Patterns

**Standard import order:**
```typescript
// 1. External packages
import express, { Request, Response } from 'express';
import { io } from 'socket.io';

// 2. Shared types & constants
import { Player, Snake, GameState } from '@shared/types';
import { MAX_PLAYERS, TICK_RATE } from '@shared/constants';

// 3. Local imports (services, models, utilities)
import { AuthService } from './services/auth-service';
import { PlayerModel } from './models/player';
import { validateInput } from './utils/validate-input';

// 4. Config imports
import { DATABASE_URL } from './config/database';
```

---

## 3. Code Organization Patterns

### 3.1 Server Architecture (Node.js)

**Layer 1: Routes (Express)**
```typescript
// routes/room-routes.ts
import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth-middleware';
import { RoomController } from '../controllers/room-controller';

const router = Router();
const controller = new RoomController();

router.get('/available', controller.getAvailable);
router.post('/:id/join', auth, controller.joinRoom);

export default router;
```

**Layer 2: WebSocket (Socket.IO)**
```typescript
// websocket/game-events.ts
import { Socket } from 'socket.io';
import { GameEventHandler } from './handlers/game-event-handler';

export function registerGameEvents(socket: Socket): void {
  const handler = new GameEventHandler(socket);

  socket.on('player-input', (data) => handler.onPlayerInput(data));
  socket.on('join-room', (roomId) => handler.onJoinRoom(roomId));
  socket.on('leave-room', () => handler.onLeaveRoom());
}
```

**Layer 3: Game Logic (Domain)**
```typescript
// game/game-loop.ts
export class GameLoop {
  private roomId: string;
  private tickRate: number;
  private isRunning: boolean = false;

  constructor(roomId: string, tickRate: number = 60) {
    this.roomId = roomId;
    this.tickRate = tickRate;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
  }

  private tick(): void {
    if (!this.isRunning) return;

    // Game logic
    this.updateSnakes();
    this.checkCollisions();
    this.updateLeaderboard();

    // Schedule next tick
    setTimeout(() => this.tick(), 1000 / this.tickRate);
  }

  private updateSnakes(): void {
    // Update snake positions
  }

  private checkCollisions(): void {
    // Check collisions
  }

  private updateLeaderboard(): void {
    // Update leaderboard
  }
}
```

**Layer 4: Data Layer (Services)**
```typescript
// services/game-state-service.ts
export class GameStateService {
  constructor(private redis: RedisClient) {}

  async getRoom(roomId: string): Promise<Room | null> {
    const data = await this.redis.hgetall(`room:${roomId}`);
    return data ? this.deserializeRoom(data) : null;
  }

  async updateSnake(roomId: string, playerId: string, snake: Snake): Promise<void> {
    await this.redis.hset(`snake:${roomId}:${playerId}`, this.serializeSnake(snake));
  }

  private serializeSnake(snake: Snake): Record<string, string> {
    return {
      x: String(snake.x),
      y: String(snake.y),
      direction: String(snake.direction),
      length: String(snake.segments.length),
    };
  }

  private deserializeSnake(data: Record<string, string>): Snake {
    return {
      x: Number(data.x),
      y: Number(data.y),
      direction: Number(data.direction),
      segments: [],
    };
  }
}
```

### 3.2 Client Architecture (Phaser.js)

**Layer 1: Scenes (Game Screens)**
```typescript
// scenes/game-scene.ts
export class GameScene extends Phaser.Scene {
  private snake?: Snake;
  private food?: Food[];
  private networkManager?: NetworkManager;
  private inputManager?: InputManager;

  constructor() {
    super({ key: 'game-scene' });
  }

  preload(): void {
    // Load assets
  }

  create(): void {
    this.networkManager = new NetworkManager(this);
    this.inputManager = new InputManager(this);
    this.snake = new Snake(this, 100, 100);
    this.food = [];

    this.networkManager.on('game-state', (state) => this.onGameState(state));
  }

  update(): void {
    // Update game logic
  }

  private onGameState(state: GameState): void {
    // Handle server state updates
  }
}
```

**Layer 2: Managers (Core Systems)**
```typescript
// managers/network-manager.ts
export class NetworkManager extends Phaser.Events.EventEmitter {
  private socket?: Socket;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.connect();
  }

  private connect(): void {
    this.socket = io(window.location.origin, {
      auth: { token: this.getToken() },
    });

    this.socket.on('game-state', (state) => this.emit('game-state', state));
    this.socket.on('player-death', (data) => this.emit('player-death', data));
  }

  public sendPlayerInput(direction: number, boost: boolean): void {
    this.socket?.emit('player-input', { direction, boost });
  }

  private getToken(): string {
    return localStorage.getItem('auth-token') || '';
  }
}
```

**Layer 3: Entities (Game Objects)**
```typescript
// entities/snake.ts
export class Snake extends Phaser.GameObjects.Container {
  private head: Phaser.GameObjects.Graphics;
  private segments: Array<Phaser.GameObjects.Graphics>;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.head = scene.make.graphics({ x: 0, y: 0 });
    this.segments = [];
    this.drawHead();
  }

  private drawHead(): void {
    this.head.clear();
    this.head.fillStyle(0x00ff00);
    this.head.fillCircle(0, 0, 10);
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  public addSegment(x: number, y: number): void {
    const segment = this.scene.make.graphics({ x, y });
    segment.fillStyle(0x00cc00);
    segment.fillCircle(0, 0, 8);
    this.segments.push(segment);
  }
}
```

**Layer 4: Physics (Interpolation & Prediction)**
```typescript
// physics/interpolator.ts
export class Interpolator {
  private previousPosition: Point = { x: 0, y: 0 };
  private currentPosition: Point = { x: 0, y: 0 };
  private progress: number = 0;

  public interpolate(deltaTime: number, duration: number): Point {
    this.progress += deltaTime / duration;
    if (this.progress > 1) this.progress = 1;

    return {
      x: Phaser.Math.Linear(this.previousPosition.x, this.currentPosition.x, this.progress),
      y: Phaser.Math.Linear(this.previousPosition.y, this.currentPosition.y, this.progress),
    };
  }

  public setTarget(x: number, y: number): void {
    this.previousPosition = { ...this.currentPosition };
    this.currentPosition = { x, y };
    this.progress = 0;
  }
}
```

---

## 4. Error Handling & Logging

### 4.1 Error Handling Patterns

**Server (Node.js):**
```typescript
// Try-catch for async operations
async function processPayment(userId: string, amount: number): Promise<void> {
  try {
    const result = await paymentService.charge(userId, amount);
    logger.info('Payment processed', { userId, amount, result });
  } catch (error) {
    if (error instanceof PaymentError) {
      logger.warn('Payment failed', { userId, amount, reason: error.message });
      throw new ApiError(402, 'Payment failed');
    }
    logger.error('Unexpected error during payment', { error, userId });
    throw new ApiError(500, 'Internal error');
  }
}

// Wrapper for Express routes
export async function joinRoom(req: Request, res: Response): Promise<void> {
  try {
    const room = await roomService.join(req.user.id);
    res.json({ roomId: room.id });
  } catch (error) {
    handleError(error, res);
  }
}

// WebSocket error handling
socket.on('player-input', (data) => {
  try {
    const validated = validateInput(data);
    gameLoop.updateSnake(socket.id, validated);
  } catch (error) {
    logger.warn('Invalid input', { playerId: socket.id, error });
    // Don't disconnect, just ignore invalid input
  }
});
```

**Client (Phaser.js):**
```typescript
// Network error handling
async function joinRoom(): Promise<void> {
  try {
    const result = await new Promise((resolve, reject) => {
      socket.emit('join-room', (response) => {
        if (response.error) reject(new Error(response.error));
        else resolve(response);
      });

      setTimeout(() => reject(new Error('Timeout')), 5000);
    });

    this.startGame(result);
  } catch (error) {
    this.showError('Failed to join room. Retrying...');
    this.retryJoinRoom();
  }
}

// Visual error feedback
private showError(message: string): void {
  const errorText = this.add.text(400, 300, message, {
    font: '24px Arial',
    color: '#ff0000',
  });

  setTimeout(() => errorText.destroy(), 3000);
}
```

### 4.2 Logging Standards

**Log Levels:**
```
ERROR    - Critical failures requiring immediate attention
WARN     - Unexpected but recoverable situations (e.g., cheat attempts)
INFO     - Important business events (e.g., player death, room created)
DEBUG    - Detailed diagnostic information (e.g., network latency)
```

**Log Format (Server):**
```typescript
logger.info('Player joined room', {
  playerId: 'uuid-123',
  roomId: 'room-456',
  timestamp: new Date().toISOString(),
  duration: performance.now() - startTime,
});

logger.warn('Suspected cheat detected', {
  playerId: 'uuid-123',
  violation: 'speed_exceeded',
  expectedSpeed: 100,
  actualSpeed: 250,
});

logger.error('Database connection failed', {
  error: err.message,
  code: err.code,
  stack: err.stack,
});
```

---

## 5. Testing Standards

### 5.1 Test File Organization

```
apps/server/
├── src/
│   ├── game/
│   │   ├── collision-engine.ts
│   │   └── __tests__/
│   │       └── collision-engine.test.ts
│   └── services/
│       ├── game-state-service.ts
│       └── __tests__/
│           └── game-state-service.test.ts
└── jest.config.js
```

**Test File Naming:** `{module-name}.test.ts` (co-located with source)

### 5.2 Unit Test Patterns (Jest)

```typescript
// game/__tests__/collision-engine.test.ts
import { CollisionEngine } from '../collision-engine';
import { Snake, Food } from '@shared/types';

describe('CollisionEngine', () => {
  let engine: CollisionEngine;

  beforeEach(() => {
    engine = new CollisionEngine({ maxPlayers: 50 });
  });

  describe('checkHeadToFoodCollision', () => {
    it('should detect collision when head overlaps food', () => {
      // Arrange
      const head = { x: 100, y: 100, radius: 10 };
      const food = { x: 105, y: 105, rarity: 'common' };

      // Act
      const result = engine.checkHeadToFoodCollision(head, food);

      // Assert
      expect(result).toBe(true);
    });

    it('should not detect collision when head does not overlap food', () => {
      const head = { x: 100, y: 100, radius: 10 };
      const food = { x: 200, y: 200, rarity: 'common' };

      const result = engine.checkHeadToFoodCollision(head, food);

      expect(result).toBe(false);
    });
  });

  describe('checkHeadToHeadCollision', () => {
    it('should return larger snake as winner', () => {
      const snake1 = { id: '1', length: 50 };
      const snake2 = { id: '2', length: 30 };

      const winner = engine.checkHeadToHeadCollision(snake1, snake2);

      expect(winner).toBe('1');
    });
  });
});
```

### 5.3 What to Test

**Must test (critical paths):**
- Collision detection (deterministic algorithm)
- Movement validation (prevent cheats)
- Leaderboard computation
- Authentication (JWT validation)
- Rate limiting

**Optional (integration tests in Phase 2):**
- Full game loop with multiple players
- Network synchronization
- Database persistence
- Docker deployment

---

## 6. Code Review Checklist

### 6.1 Before Submitting PR

- [ ] **Type safety**: No `any`, all functions typed
- [ ] **Error handling**: Try-catch blocks for errors
- [ ] **Logging**: Added appropriate log statements
- [ ] **Tests**: Unit tests for critical logic
- [ ] **Performance**: No obvious N² loops or memory leaks
- [ ] **Security**: Input validation, no hardcoded secrets
- [ ] **Documentation**: Complex logic has comments

### 6.2 During Review

**Ask these questions:**

1. **Correctness**: Does the code do what it's supposed to?
2. **Readability**: Can someone understand this in 2 minutes?
3. **Maintainability**: Is this easy to modify later?
4. **Performance**: Are there obvious inefficiencies?
5. **Security**: Are there attack vectors?
6. **Testing**: Are edge cases covered?
7. **Consistency**: Does it follow project conventions?

---

## 7. Performance Guidelines

### 7.1 Server Performance

**Game Loop (60 Hz = 16.67ms per tick):**
```
Target: Each tick completes in <5ms

Budget per tick:
- Snake updates: 1-2ms (50 snakes)
- Collision detection: 1-2ms
- Leaderboard update: 0.5ms
- Network broadcast: 1-2ms
- Buffer: 5-6ms
```

**Optimization strategies:**
- Early exit in collision detection (spatial bounds check first)
- Cache computed values (e.g., snake segment positions)
- Batch database writes (don't save every frame)

### 7.2 Client Performance

**Target: 60 FPS = 16.67ms per frame**

```
Profile with Chrome DevTools:
- Avoid layout thrashing (read then write DOM)
- Use GPU-accelerated CSS transforms
- Defer non-critical computations to Web Workers (Phase 2)
```

**Memory targets:**
- Game scene: < 50 MB
- Network manager: < 10 MB
- Total client footprint: < 100 MB

---

## 8. Security Checklist

### 8.1 Server Security

- [ ] **Input validation**: Validate all user input on server
- [ ] **Rate limiting**: Enforce rate limits on all endpoints
- [ ] **Authentication**: Verify JWT on every WebSocket connection
- [ ] **Authorization**: Check permissions before any action
- [ ] **SQL injection**: Use parameterized queries (Sequelize ORM)
- [ ] **XSS prevention**: Never eval() user input
- [ ] **CSRF tokens**: Add to state-changing endpoints (Phase 2)
- [ ] **Secrets management**: Never commit .env files
- [ ] **HTTPS**: Use SSL/TLS in production

### 8.2 Client Security

- [ ] **localStorage**: Store only non-sensitive tokens
- [ ] **API calls**: Always use HTTPS
- [ ] **DOM XSS**: Sanitize any user-generated content
- [ ] **Source maps**: Disable in production
- [ ] **Dependency audit**: Run `npm audit` regularly

---

## 9. Documentation Standards

### 9.1 Code Comments

**Good comments explain WHY, not WHAT:**

```typescript
// ✓ GOOD: Explains the reason
// Use circle-based collision instead of AABB for accuracy with snake head
// AABB would have ~15% false negatives with non-axis-aligned snakes
export function checkCircleCollision(p1: Point, r1: number, p2: Point, r2: number): boolean {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  return dist < r1 + r2;
}

// ✗ BAD: Obvious from code
// Calculate distance between two points
const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

// ✓ GOOD: Documents non-obvious behavior
// Lerp factor 0.12 chosen via empirical testing:
// 0.08 = feels laggy, 0.15 = overshoots, 0.12 = Goldilocks
const LERP_FACTOR = 0.12;
```

### 9.2 Function Documentation (JSDoc)

```typescript
/**
 * Calculates whether a snake head collides with food.
 *
 * @param head - Snake head position and radius
 * @param food - Food position and rarity level
 * @returns true if collision detected, false otherwise
 *
 * @example
 * const collision = checkHeadToFood({ x: 100, y: 100, radius: 10 }, { x: 105, y: 105 });
 * // => true
 */
export function checkHeadToFood(head: Point & { radius: number }, food: Point): boolean {
  // Implementation
}
```

---

## 10. Git & Commit Standards

### 10.1 Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**

```
feat(collision): implement circle-based head detection

Replaces AABB collision with circle detection for 15% accuracy improvement.
Measured empirically on 100-game test suite.

Closes #123
```

```
fix(network): handle socket reconnection timeout

Previously, reconnection would hang if server didn't respond.
Now times out after 5 seconds and shows user error.
```

### 10.2 Branch Naming

```
feature/room-sharding          # New feature
bugfix/collision-false-negative # Bug fix
docs/api-documentation         # Documentation
refactor/game-loop-performance # Code cleanup
```

---

## 11. Dependency Management

### 11.1 Approved Dependencies

**Server:**
```json
{
  "express": "^4.18.0",
  "socket.io": "^4.6.0",
  "sequelize": "^6.35.0",
  "ioredis": "^5.3.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "dotenv": "^16.3.0"
}
```

**Client:**
```json
{
  "phaser": "^3.70.0",
  "socket.io-client": "^4.6.0",
  "vite": "^5.0.0"
}
```

### 11.2 Dependency Review Policy

Before adding a new dependency:
1. **Is it necessary?** (YAGNI principle)
2. **Is it actively maintained?** (Latest commit < 1 month old)
3. **Does it have good documentation?**
4. **What's the bundle size impact?**
5. **Are there viable alternatives?**

---

## 12. Known Limitations & Conventions

### 12.1 Intentional Constraints

| Constraint | Reason | Phase |
|-----------|--------|-------|
| No enum (use union types) | Better tree-shaking, simpler serialization | 1 |
| Single server instance | Simplicity for MVP | 1 |
| No OOP inheritance (composition only) | Reduce complexity, easier testing | 1 |
| No decorators (@decorator) | Not stable in TS, avoid magic | 1 |

### 12.2 File Size Limits

```
Server source file:    < 200 lines
Client source file:    < 150 lines (Phaser scenes < 300 lines)
Test file:            < 300 lines
Config file:          < 100 lines
```

**Rationale:** Easier testing, code review, and mental model.

---

## 13. Tooling & Development Environment

### 13.1 Required Tools

```bash
Node.js 18+
TypeScript 5.0+
Docker 24+
Git 2.0+
```

### 13.2 Development Scripts

```bash
# Root workspace
yarn install          # Install all dependencies
yarn build            # Build all apps
yarn dev              # Start dev server (hot reload)
yarn test             # Run all tests
yarn lint             # Check code style

# Individual apps
cd apps/server && yarn test
cd apps/client && yarn build
```

### 13.3 IDE Configuration (.vscode/settings.json)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "eslint.enable": true,
  "eslint.autoFixOnSave": true
}
```

---

## 14. Migration & Evolution

### 14.1 Breaking Changes

When making breaking changes:
1. Add deprecation warning (1 phase lead time)
2. Update all affected code
3. Document migration path in CHANGELOG.md
4. Add deprecation note to JSDoc

Example:
```typescript
/**
 * @deprecated Use `getPlayerStats()` instead. Will be removed in Phase 2.
 * Migration: Replace `getPlayerScore(id)` with `getPlayerStats(id).score`
 */
export function getPlayerScore(id: string): number {
  const stats = getPlayerStats(id);
  return stats.score;
}
```

### 14.2 Schema Migrations

Database migrations are in `apps/migrations/`:
```sql
-- 001_initial_schema.sql: Created tables
-- 002_add_premium_features.sql: (Phase 2)
-- 003_add_analytics.sql: (Phase 3)
```

Always run migrations in order. Test on dev database first.

---

## 15. Quick Reference

| Question | Answer |
|----------|--------|
| How do I add a new REST endpoint? | Create route in `routes/`, add controller method, wire up in `server.ts` |
| How do I add a new game mechanic? | Add to `GameLoop` class, broadcast in `game-events.ts`, handle in client `GameScene` |
| How do I add a new entity type? | Create model in `models/`, add to `shared/types.ts`, create entity class in client |
| How do I debug network issues? | Use Chrome DevTools Network tab, check `socket.io/debug` endpoint |
| How do I optimize performance? | Profile with Chrome DevTools, check game loop tick time, use `console.time()` |
| How do I add error handling? | Wrap in try-catch, log error, return appropriate HTTP status / WebSocket event |
| How do I add a unit test? | Create `.test.ts` file, use Jest `describe/it`, follow AAA pattern |
