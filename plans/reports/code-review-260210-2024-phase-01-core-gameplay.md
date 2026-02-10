# Code Review: Phase 1 - Core Gameplay Implementation

**Reviewer:** code-reviewer
**Date:** 2026-02-10
**Score:** 6.5 / 10

---

## Scope

- **Files reviewed:** 28 TypeScript files across `apps/server`, `apps/client`, `apps/shared`
- **LOC (approx):** ~1,800
- **Focus:** Full Phase 1 codebase -- security, performance, logic, bugs

---

## Overall Assessment

Solid foundation with clean separation of concerns (shared types, per-room game state, client-side prediction). However, several critical and high-priority issues exist around security hardcoding, memory leaks in the game loop, collision correctness bugs, missing input sanitization on WebSocket, and a hardcoded JWT secret fallback that would ship to production. The client networking and rendering layers are well-structured.

---

## Critical Issues

### C1. Hardcoded JWT Secret Fallback (SECURITY)

**File:** `apps/server/src/config/constants.ts:3`

```ts
export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
```

If `JWT_SECRET` env var is unset in production, the server silently falls back to `'dev-secret-key'`. Any attacker who reads the source code can forge valid JWTs for any user.

**Impact:** Full authentication bypass in production.
**Fix:** Throw at startup if `JWT_SECRET` is not set in non-development environments.

---

### C2. Hardcoded Database Credentials in Source (SECURITY)

**File:** `apps/server/src/config/database.ts:3`

```ts
const databaseUrl = process.env.DATABASE_URL || 'postgresql://snake_user:snake_pass@localhost:5432/snake_game';
```

Hardcoded credentials in source. If the env var is unset, the server connects with well-known credentials. Combined with the `repomix-output.xml` (723KB) checked into the repo root, source code exposure risk is elevated.

**Impact:** Database access with known credentials if misconfigured.
**Fix:** Require `DATABASE_URL` env var in production; remove `repomix-output.xml` from tracked files.

---

### C3. No WebSocket Authentication Enforcement

**File:** `apps/server/src/websocket/socket-handler.ts:21-31`

Any socket connection falls through to guest mode if no token or invalid token is provided. There is no rate limit on socket connections, no IP-based throttle, and no CAPTCHA. A malicious actor can open thousands of guest connections, each joining rooms and consuming server resources (in-memory game state per snake).

**Impact:** Denial of service via mass guest connections.
**Fix:** Add connection-level rate limiting (e.g., `socket.io` middleware or reverse proxy limits). Consider requiring at least a session token.

---

### C4. Username Not Sanitized -- XSS via Leaderboard DOM Injection

**File:** `apps/client/src/scenes/game-scene.ts:253-261`

```ts
const name = entry.username.length > 15 ? entry.username.slice(0, 15) + '...' : entry.username;
html += `<div ...><span>#${entry.rank} ${name}</span>...`;
```

The username is injected directly into `innerHTML` without escaping. A player can set their username to `<img src=x onerror=alert(1)>` and execute arbitrary JavaScript in every other player's browser.

**Server side:** `game-events.ts:20` only truncates to 50 chars -- no HTML entity escaping.

**Impact:** Stored XSS affecting all players in the room.
**Fix:** Use `textContent` instead of `innerHTML`, or escape HTML entities before interpolation.

---

## High Priority

### H1. Memory Leak in FoodSpawner -- Unbounded Timer Array

**File:** `apps/server/src/game/food-spawner.ts:54`

```ts
this.respawnTimers.push(timer);
```

Every collected food item pushes a `setTimeout` handle into `respawnTimers`, but completed timers are never removed from the array. Over a long session with frequent food collection, this array grows indefinitely.

**Impact:** Gradual memory leak proportional to food collection frequency. In a 50-player room collecting ~5 food/sec, this is ~18,000 stale timer refs/hour.
**Fix:** Remove timer from array on callback completion, or use a `Set` and delete on fire.

---

### H2. Collision Double-Death Race Condition

**File:** `apps/server/src/game/collision-engine.ts:12-93`

The collision loop iterates all snakes in insertion order. If snake A's head hits snake B's body, A dies. But in the same tick, if B's head also hits A's body, B also dies -- however, A has already been flagged for death. The `deaths.some()` check on line 56/60 prevents further collision checks for A, but A's body segments remain accessible to B's collision check because `removeSnake` hasn't been called yet.

This means:
- Two snakes can kill each other in the same tick (intended for head-to-head, but also possible for head-to-body).
- The `rank` calculation on line 40/77 uses `getSnakeCount()` which hasn't been decremented yet, producing inaccurate ranks.

**Impact:** Incorrect death attribution and inaccurate rank reporting.

---

### H3. `setInterval` Drift at 60Hz

**File:** `apps/server/src/game/game-loop.ts:49-51`

```ts
state.intervalId = setInterval(() => {
  GameLoop.tick(state);
}, TICK_INTERVAL_MS); // 16.67ms
```

Node.js `setInterval` has ~1-5ms jitter. At 60Hz, this produces inconsistent tick durations. The `deltaTime` is hardcoded to `1/60` regardless of actual elapsed time, meaning physics speed varies with timer drift.

**Impact:** Inconsistent game speed; snakes may move faster/slower depending on system load.
**Fix:** Use measured `deltaTime` (track `Date.now()` between ticks) or switch to a high-resolution timer loop.

---

### H4. Full Game State Broadcast to All Clients

**File:** `apps/server/src/game/game-loop.ts:101-109`

Every broadcast sends ALL snakes (with ALL segments) and ALL food items to every client. With 50 players at average 50 segments each + 800 food items, each broadcast payload is approximately:
- Snakes: 50 * 50 * 16 bytes = ~40KB
- Food: 800 * 40 bytes = ~32KB
- Total: ~72KB per broadcast at 20Hz = ~1.4MB/s per client

For 50 clients: ~70MB/s outbound bandwidth from the server.

**Impact:** Severe bandwidth bottleneck at scale; unplayable on mobile connections.
**Fix:** Implement viewport-based culling (only send entities near each player) and delta compression.

---

### H5. No `skinId` Validation on Server

**File:** `apps/server/src/websocket/game-events.ts:21`

```ts
const skinId = payload.skinId || 'classic-blue';
```

No validation that `skinId` is a legitimate skin or that the player owns it. A client can send any arbitrary string as `skinId`. While this is cosmetic, it breaks the skin ownership/shop economy.

**Impact:** Players can use any skin without owning it, undermining monetization.
**Fix:** Validate `skinId` against player's `ownedSkins` array (requires auth) or against a whitelist.

---

## Medium Priority

### M1. Duplicate `join-room` Exploit

**File:** `apps/server/src/websocket/game-events.ts:18-37`

No guard prevents a client from emitting `join-room` multiple times. Each call spawns a new snake in a new room via `findOrCreateRoom()`, but the `playerRoomMap` overwrites the previous room entry. The old room retains a stale socket reference and a ghost snake that never gets cleaned up.

**Fix:** Check if player is already in a room before allowing join.

---

### M2. `GameStateService` (Redis) Never Actually Called

**File:** `apps/server/src/services/game-state-service.ts`

This service defines Redis-based room tracking (`setRoomInfo`, `trackPlayerSession`, etc.) but is never imported or called anywhere in the codebase. Room state is managed entirely in-memory by `RoomManager`.

**Impact:** Dead code. Redis connection is established but unused for game state.
**Fix:** Either integrate it into `RoomManager` or remove it.

---

### M3. Interpolator Accumulates State Drift

**File:** `apps/client/src/physics/interpolator.ts:49`

```ts
interpState.previous = interpolated;
```

The interpolator mutates `previous` to the interpolated result each frame, meaning the lerp alpha (`INTERPOLATION_LERP = 0.12`) is applied to an already-interpolated value. This creates exponential decay toward the target rather than linear interpolation. While visually acceptable, it causes remote snakes to always lag behind their true position by a variable amount.

---

### M4. Prediction Engine Replay Doubles Predictions Buffer

**File:** `apps/client/src/physics/prediction-engine.ts:64-66`

```ts
for (const pred of this.predictions) {
  reconciled = this.applyInput(reconciled, pred.input);
}
```

`applyInput` on line 41 pushes a new record into `this.predictions`. During reconciliation, replaying N predictions adds N more predictions, doubling the buffer each reconcile cycle until the cap (120) trims it.

**Impact:** Prediction buffer churn; unnecessary CPU work on every server state update.
**Fix:** Use a separate replay method that does not push to `this.predictions`.

---

### M5. `WASD` Key Handling Calls `addKey` Every Frame

**File:** `apps/client/src/managers/input-manager.ts:49-53`

```ts
const keys = this.scene.input.keyboard!;
if (keys.addKey('W').isDown) ...
```

`addKey` creates/registers a new Key object if not already registered. Calling it 60 times/sec is wasteful. Should be initialized once in the constructor and stored as instance variables.

---

### M6. Logout Endpoint is a No-Op

**File:** `apps/server/src/routes/auth-routes.ts:76-78`

The logout endpoint returns a success message but does nothing (stateless JWT). There is no token blacklist mechanism. A stolen JWT remains valid for 7 days.

**Impact:** Token revocation is impossible.
**Fix:** Implement a Redis-based token blacklist checked in `authMiddleware`, or use shorter-lived tokens with refresh tokens.

---

### M7. Email Validation is Minimal

**File:** `apps/server/src/routes/auth-routes.ts:17`

```ts
if (!email || typeof email !== 'string' || !email.includes('@'))
```

Only checks for presence of `@`. Accepts `@`, `@@@@`, `user@`, etc.

**Fix:** Use a proper email regex or validation library.

---

## Low Priority

### L1. `repomix-output.xml` Committed to Repo

A 723KB file at the project root. Contains full source dump -- leaks all code if repo becomes public.

### L2. `FOOD_RESPAWN_MIN_MS` Timers Not Cleaned on Room Destroy

When `GameLoop.stopRoom()` is called, `FoodSpawner.cleanup()` is never invoked. Pending respawn timers continue to fire after room deletion.

### L3. Food UUID Collision Risk

`uuidv4().slice(0, 12)` truncates UUIDs to 12 chars. While collision probability is low per room, it is non-zero and could silently overwrite food items in the Map.

### L4. `Player.create({ ... } as any)` Type Assertion

**File:** `apps/server/src/services/auth-service.ts:21-25`

Bypasses TypeScript type checking for the create call. Should use proper creation attributes type.

### L5. No Graceful Shutdown

`server.ts` does not handle `SIGTERM`/`SIGINT`. Active game rooms and WebSocket connections are dropped without cleanup. In-flight player sessions are lost.

---

## Positive Observations

1. **Clean architecture:** Shared types between client and server prevent contract drift.
2. **Per-room isolation:** Each room has its own `SnakeManager`, `FoodSpawner`, `CollisionEngine` -- good for scalability.
3. **Client-side prediction with server reconciliation:** Well-structured prediction engine with sequence-number-based replay.
4. **Rate limiting:** Both HTTP (express-rate-limit) and WebSocket input rate limiting are implemented.
5. **Volatile emit for input:** `socket.volatile.emit('player-input', input)` correctly drops inputs if the buffer is full rather than queuing.
6. **DOM cleanup on scene exit:** `cleanup()` properly removes event listeners and DOM elements.
7. **Bcrypt with 12 rounds:** Appropriate password hashing strength.

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Coverage | ~85% (some `any` casts in routes/models) |
| Test Coverage | 0% (no tests present) |
| Linting Issues | Not assessed per rules |
| Security Issues | 4 critical, 1 high |
| Memory Leak Risk | 2 identified (timers, prediction buffer) |
| Dead Code | 1 file (`game-state-service.ts`) |

---

## Recommended Actions (Prioritized)

1. **[CRITICAL]** Fail startup if `JWT_SECRET` env var is unset in production
2. **[CRITICAL]** Escape username HTML in leaderboard rendering (XSS)
3. **[CRITICAL]** Add WebSocket connection rate limiting / max connections per IP
4. **[CRITICAL]** Remove hardcoded DB credentials fallback in production
5. **[HIGH]** Fix FoodSpawner timer array memory leak
6. **[HIGH]** Implement viewport culling for state broadcasts
7. **[HIGH]** Validate `skinId` against owned skins
8. **[HIGH]** Guard against duplicate `join-room` calls
9. **[HIGH]** Fix prediction engine replay double-push bug
10. **[MEDIUM]** Integrate or remove `GameStateService`
11. **[MEDIUM]** Use measured `deltaTime` in game loop
12. **[MEDIUM]** Add token blacklist for logout
13. **[LOW]** Remove `repomix-output.xml` from repo
14. **[LOW]** Call `FoodSpawner.cleanup()` on room destroy

---

## Unresolved Questions

1. Is `repomix-output.xml` intentionally tracked or accidental? It exposes full source code.
2. Are player sessions (`PlayerSession` model) supposed to be recorded on death? No code writes to this table currently.
3. Is Redis intended for future use (pub/sub for multi-server scaling)? Currently connected but unused for game logic.
4. What is the target player count per server instance? The full-state broadcast approach may not scale past ~20 players per room on standard connections.
